function FetchJsonFile(this: HTMLSelectElement): void {
    if (this.selectedIndex == 0)
        return
    else if (this.selectedIndex == 1) {
        document.getElementById("JsonFile").click()
    }
    else {
        let name = this.value.replace('.exe', '_config.json');
        fetch("assets/formats/" + name, { headers: { "Content-Type": "application/json; charset=utf-8" } })
            .then(res => res.text())
            .then(response => {
                ApplyTemplate(JSON.parse(response as string), false);
            })
            .catch(err => {
                throw err;
            });
    }
}

function ObjectEquals(object_a: object, object_b: object): boolean {
    if (JSON.stringify(Object.keys(object_a)) != JSON.stringify(Object.keys(object_b))) return false; //order matters

    return Object.keys(object_a).every(key => {
        let elem_a = object_a[key];
        let elem_b = object_b[key];
        return Object.keys(elem_a).length == Object.keys(elem_b).length && Object.keys(elem_a).every(key => Object.keys(elem_b).includes(key) && JSON.stringify(elem_a[key]) == JSON.stringify(elem_b[key])); // order does not matter
    })
}

function CheckChanged(targetElem: HTMLLIElement, newModifiers: object, oldDefaultModifiers: object): boolean {
    let SelectedOptions = document.querySelectorAll("input[data-function][id^=\"option_\"]:checked") as NodeListOf<HTMLInputElement>;
    const warningText = "You made changes to the default obfuscation options, but the new command you entered has different obfuscation settings.\nAre you sure you want to lose the changes you made?\n\nPress OK to discard your changes and apply the new configuration, or click Cancel to keep your configuration.";

    // User clicks (none) or 'upload', check if there is an existing config prior to continuing
    if (targetElem.dataset.keys !== undefined && targetElem.dataset.keys.includes("function") && SelectedOptions?.length > 0) {
        return confirm(warningText)
    }

    // User clicks a button that is different to the selected template
    if (targetElem.innerText != document.getElementById('template_selected').innerText) {
        let currentConfig = GetJsonContents(); // Get JSON object of current config
        if (Object.entries(currentConfig).length === 0 // Current config is blank; no need to ask
            || ObjectEquals(newModifiers, currentConfig) // Current config equals the target config, no need to ask
            || ObjectEquals(oldDefaultModifiers, currentConfig) // current config equals the original config, no need to ask
            ) { // If any of these are true:
            return true; // proceed without asking
        } else { // If not, we should check with the user
            return confirm(warningText)
        }
    } else { // If the target template is the same as the current (even if the user changed the config), leave it as is.
        return false;
    }
}

async function FetchJsonFile2(elem: HTMLLIElement): Promise<object> {
    if (elem == null || elem.dataset['function'] == 'none')
        return {}
    if (LoadedConfigModifiers.has(elem.innerText))
        return LoadedConfigModifiers.get(elem.innerText);
    else if (elem.dataset['function'] == 'upload') {
        document.getElementById("JsonFile").click()
        return {}
    }
    else {
        let name = elem.textContent.replace('.exe', '_config.json');
        let response = await fetch("assets/formats/" + name, { headers: { "Content-Type": "application/json; charset=utf-8" } })
            .then(res => {
                if (!res.ok)
                    throw new Error(`Unexpected status code ${res.status}`);
                return res.text()
            })
            .then(response => {
                let result = JSON.parse(response as string).modifiers;
                LoadedConfigModifiers.set(elem.innerText, result);
                return result;
            })
            .catch(err => {
                logUserError("http-error", `Could not fetch template: ${err}`, true)
                throw err;
            });
        return response;
    }
}

function ReadJsonFile(this: HTMLInputElement): void {
    let file = this.files[0];
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            ApplyTemplate(JSON.parse(evt.target.result as string), true);
        }
        reader.onerror = function (evt) {
            document.getElementById("fileContents").innerHTML = "error reading file";
        }
    }
}

function ApplyTemplate(Input: FileFormat, Interactive: Boolean) {
    var CommandOutput: HTMLTextAreaElement = document.getElementById("input_command") as HTMLTextAreaElement;
    // Reset all currently enabled modifiers
    document.querySelectorAll<HTMLInputElement>("input[id^=\"option_\"]:checked").forEach(p => p.click());

    // Construct command
    let CurrentCommand = GetInputCommand()

    if (Object.keys(Input.modifiers).length == 0)
        logUserError("pattern-no-options", "Bummer! It looks like this executable does not have any known obfuscation options.", true)

    let NewCommand = null;
    if (Input.command)
        NewCommand = Input.command.map(Token => Object.entries(Token)[0][1]).join(" ");
    if (Interactive && NewCommand && (CurrentCommand == null || CurrentCommand == '' || CurrentCommand == NewCommand || confirm('Would you like to replace the existing command with the command that is embedded in the provided config file?\n(Clicking "Cancel" will still apply all obfuscation options)'))) {
        CommandOutput.textContent = '';
        CommandOutput.value = NewCommand;

        LastTokenised = [];
        Input.command.forEach(Entry => {
            let TokenContent = Object.entries(Entry)[0][1];
            let Type = Object.entries(Entry)[0][0]
            var t = new Token(TokenContent.split(''));
            t.SetType(Type);
            LastTokenised.push(t);
        });

        UpdateUITokens(LastTokenised);
    }

    // Set options
    document.querySelectorAll<HTMLInputElement>("input[id^=\"option_\"]:checked").forEach(x => x.click())
    document.querySelectorAll<HTMLInputElement>("div[data-excluded_types]").forEach(ContextMenuButton => { ContextMenuButton.dataset.excluded_types = "[]"; ContextMenuButton.innerText = UpdateExcludeText(ContextMenuButton, ContextMenuButton.nextSibling as HTMLElement); })
    var i = 0;
    Object.entries(Input.modifiers).forEach(([ModifierName, _]) => {
        let ModifierObject = document.getElementById("option_" + ModifierName.toLowerCase())
        if (ModifierObject == null) {
            console.warn(`Could not find modifier "${ModifierName}"`)
            return;
        }
        ModifierObject.click();
        moveItem(ModifierObject.parentElement.parentElement, i++);
        Object.entries(Input.modifiers[ModifierName]).forEach(([Option, _]) => {
            var value = Input.modifiers[ModifierName][Option];
            if (Option == "ExcludedTypes") {
                var ContextMenuButton = document.querySelector<HTMLInputElement>("#" + ModifierName + " div[data-excluded_types]");
                var ContextMenu = document.querySelector<HTMLInputElement>("#" + ModifierName + " menu");
                ContextMenuButton.dataset.excluded_types = JSON.stringify(value);
                ContextMenuButton.innerText = UpdateExcludeText(ContextMenuButton, ContextMenu);
            } else {
                var SettingObject = document.querySelector<HTMLInputElement | HTMLTextAreaElement>("#" + ModifierName + " input[data-field='" + Option + "'], textarea[data-field='" + Option + "']");
                if (!SettingObject)
                    console.warn(`Could not apply option ${Option} on modifier ${ModifierName}`)
                else {
                    if (SettingObject instanceof HTMLInputElement && SettingObject.type == 'checkbox')
                        SettingObject.checked = value;
                    else if (SettingObject.type == 'textarea')
                        SettingObject.value = value;
                    else if (Array.isArray(value))
                        SettingObject.value = value.join('');
                    else
                        SettingObject.value = value;

                    SettingObject.dispatchEvent(new Event("input"))
                }
            }
        });
    });
}

function GetJsonContents(): object {
    let modifiers = {};
    document.querySelectorAll<HTMLInputElement>("input[type=checkbox][data-function]:checked").forEach(x => {
        var settings = {};
        settings['ExcludedTypes'] = JSON.parse(x.parentNode.querySelector<HTMLInputElement>("div[data-excluded_types]").dataset.excluded_types);
        x.parentNode.querySelectorAll<HTMLInputElement>("input[data-field], textarea[data-field]").forEach(y => {
            var result = undefined;
            if (y.type == "checkbox")
                result = y.checked;
            else if (y.type == "range")
                result = Number(y.value);
            else if (y.dataset.type == "array")
                result = y.value.split('');
            else
                result = y.value;

            settings[y.dataset.field] = result;
        })
        modifiers[x.dataset.function] = settings;
    });
    return modifiers;
}

function GenerateConfigJsonFile(this: HTMLAnchorElement) {
    removeUserErrors();
    if (LastTokenised == null || LastTokenised?.length <= 0)
        LastTokenised = [];

    LastTokenised.forEach(Token => Token.Reset());
    let tokens = LastTokenised.map(x => { let result = {}; result[x.GetType()] = x.GetContent().join(''); return result; });

    let modifiers = GetJsonContents();

    if (Object.keys(modifiers).length == 0) {
        alert("You haven't specified any output options, so there is nothing to download at this stage. Specify some obfuscation options first.");
    } else {
        this.download = ((LastTokenised && LastTokenised.length > 0) ? LastTokenised[0].GetContent().join("") : "unspecified") + "_config.json";
        this.href = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify({ "command": tokens, "modifiers": modifiers }))));
    }
}

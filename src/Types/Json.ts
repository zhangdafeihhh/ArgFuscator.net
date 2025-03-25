function FetchJsonFile(this: HTMLSelectElement): void {
    if (this.selectedIndex == 0)
        return
    else if (this.selectedIndex == 1) {
        document.getElementById("json-file").click()
    }
    else {
        let name = this.value.replace('.exe', '.json');
        fetch("assets/models/" + name, { headers: { "Content-Type": "application/json; charset=utf-8" } })
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
    if((object_a == null && object_b != null) || (object_a != null && object_b == null)) return false;

    if (JSON.stringify(Object.keys(object_a)) != JSON.stringify(Object.keys(object_b))) return false; //order matters

    let entries_a =  new Map(Object.entries(object_a));
    let entries_b = new Map(Object.entries(object_b));

    return Object.keys(object_a).every((key) => {
        let properties_a = new Map(Object.entries(entries_a.get(key)))
        let properties_b = new Map(Object.entries(entries_b.get(key)))

        return Object.keys(entries_a.get(key)).every((subkey) => JSON.stringify(properties_a.get(subkey)) == JSON.stringify(properties_b.get(subkey)));
        }); //order does not matter
}

function CheckChanged(targetElem: HTMLLIElement, newModifiers: object, oldDefaultModifiers: object): boolean {
    let SelectedOptions = document.querySelectorAll("input[data-function][id^=\"option-\"]:checked") as NodeListOf<HTMLInputElement>;
    const warningText = "You made changes to the default obfuscation options, but the new command you entered has different obfuscation settings.\nAre you sure you want to lose the changes you made?\n\nPress OK to discard your changes and apply the new configuration, or click Cancel to keep your configuration.";

    // User clicks (none) or 'upload', check if there is an existing config prior to continuing
    if (targetElem.dataset.keys !== undefined && targetElem.dataset.keys.includes("function") && SelectedOptions?.length > 0) {
        return confirm(warningText)
    }

    // User clicks a button that is different to the selected template
    if (targetElem.innerText != document.getElementById('template-selected').innerText) {
        let currentConfig = GetJsonContents(); // Get JSON object of current config
        if (Object.keys(currentConfig).length === 0 // Current config is blank; no need to ask
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

async function FetchJsonFile2(elem: HTMLLIElement): Promise<object | null> {
    if (elem == null || elem.dataset['function'] == 'none')
        return new Promise(function(resolve){ resolve(null); });
    if (LoadedConfigModifiers.has(elem.dataset.target))
        return new Promise(function(resolve){ resolve(LoadedConfigModifiers.get(elem.dataset.target)); });
    if (elem.dataset['function'] == 'upload') {
        document.getElementById("json-file").click()
        return new Promise(function(resolve){ resolve(null); });;
    }
    else {
        let name = elem.dataset.target;
        if (!name.endsWith('.json')) {
            name = name + '.json';
        }
        return await FetchJsonFileContents(name, elem);
    }
}

async function FetchJsonFileContents(name: string, elem: HTMLLIElement | null){
    let response = await fetch(name, { headers: { "Content-Type": "application/json; charset=utf-8" } })
            .then(res => {
                if (!res.ok)
                    throw new Error(`Unexpected status code ${res.status}`);
                return res.text()
            })
            .then(response => {
                let result = JSON.parse(response as string).modifiers;
                if(elem != null)
                    LoadedConfigModifiers.set(elem.innerText, result);
                return result;
            })
            .catch(err => {
                logUserError("http-error", `Could not fetch template: ${err}`, true)
                throw err;
            });
        return response;
}

function ReadJsonFile(this: HTMLInputElement): void {
    let file = this.files[0];
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            ApplyTemplate(JSON.parse(evt.target.result as string), true);
            UpdateTokens();
        }
        reader.onerror = function (evt) {
            document.getElementById("fileContents").innerHTML = "error reading file";
        }
    }
}

function ApplyTemplate(Input: FileFormat, Interactive: Boolean) {
    var CommandOutput: HTMLTextAreaElement = document.getElementById("input-command") as HTMLTextAreaElement;
    // Reset all currently enabled modifiers
    document.querySelectorAll<HTMLInputElement>("input[id^=\"option-\"]:checked").forEach(p => p.click());

    // Construct command
    let CurrentCommand = GetInputCommand()

    if (Object.keys(Input.modifiers).length == 0)
        logUserError("pattern-no-options", "Bummer! It looks like this executable does not have any known obfuscation options.", true)

    let NewCommand = null;
    if (Input.command)
        NewCommand = Input.command.map((Token, index) => {
            let prefix = "";
            if(index > 0){
                let PreviousToken = Object.entries(Input.command[index-1]);
                if(!(PreviousToken[0][0] == 'argument' && Modifier.ValueChars.some(x => PreviousToken[0][1].endsWith(x.toString())))){
                    prefix = Modifier.SeparationChar.toString();
                }
            }
            return prefix + Object.entries(Token)[0][1]
        }).join("");
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
    document.querySelectorAll<HTMLInputElement>("input[id^=\"option-\"]:checked").forEach(x => x.click())
    document.querySelectorAll<HTMLInputElement>("div[data-included_types]").forEach(ContextMenuButton => { ContextMenuButton.dataset.included_types = "[]"; ContextMenuButton.innerText = UpdateExcludeText(ContextMenuButton, ContextMenuButton.nextSibling as HTMLElement); })
    var i = 0;
    Object.entries(Input.modifiers).forEach(([ModifierName, m]) => {
        let ModifierObject = document.getElementById("option-" + ModifierName.toLowerCase())
        if (ModifierObject == null) {
            console.warn(`Could not find modifier "${ModifierName}"`)
            return;
        }
        ModifierObject.click();
        moveItem(ModifierObject.parentElement.parentElement, i++);

         Object.entries(m).forEach(([Option, value]) => {
            if (Option == "AppliesTo") {
                var ContextMenuButton = document.querySelector<HTMLInputElement>("#" + ModifierName + " div[data-included_types]");
                var ContextMenu = document.querySelector<HTMLInputElement>("#" + ModifierName + " menu");
                ContextMenuButton.dataset.included_types = JSON.stringify(value);
                ContextMenuButton.innerText = UpdateExcludeText(ContextMenuButton, ContextMenu);
            } else {
                var SettingObject = document.querySelector<HTMLInputElement | HTMLTextAreaElement>("#" + ModifierName + " input[data-field='" + Option + "'], textarea[data-field='" + Option + "']");
                if (!SettingObject)
                    console.warn(`Could not apply option ${Option} on modifier ${ModifierName}`)
                else {
                    if (SettingObject instanceof HTMLInputElement && SettingObject.type == 'checkbox')
                        SettingObject.checked = value as boolean;
                    else if (SettingObject.type == 'textarea')
                        SettingObject.value = value as string;
                    else if (Array.isArray(value))
                        SettingObject.value = value.join('');
                    else
                        SettingObject.value = value as string;

                    SettingObject.dispatchEvent(new Event("input"))
                }
            }
        });
    });
}

function GetJsonContents(): object {
    console.log("Getting JSON contents");
    let modifiers = new Map<string, object>();
    document.querySelectorAll<HTMLInputElement>("input[type=checkbox][data-function]:checked").forEach(x => {
        let dataFunction = x.dataset['function'] as string;
        var settings = new Map<string, string | number | boolean | string[]>();
        settings.set('AppliesTo', JSON.parse(x.parentNode.querySelector<HTMLInputElement>("div[data-included_types]").dataset.included_types));
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

            settings.set(y.dataset.field, result);
        })

        modifiers.set(dataFunction, Object.fromEntries(settings.entries()));
    });
    return Object.fromEntries(modifiers.entries());
}

const jsonEscapeNonAsci = (input : string) => [...Array.from(input)].map(c => /^[\x20-\x7f]$/.test(c) ? c : c.split("").map(a => "\\u" + a.charCodeAt(0).toString(16).padStart(4, "0")).join("")).join("");

function GenerateConfigJsonFile(this: HTMLAnchorElement) {
    removeUserErrors();
    if (LastTokenised == null || LastTokenised?.length <= 0)
        LastTokenised = [];

    LastTokenised.forEach(Token => Token.Reset());
    let tokens = LastTokenised.map(x => { let result = new Map<string, string>(); result.set(x.GetType(), x.GetStringContent()); return Object.fromEntries(result.entries()); });

    let modifiers = GetJsonContents();

    if (Object.keys(modifiers).length == 0) {
        alert("You haven't specified any output options, so there is nothing to download at this stage. Specify some obfuscation options first.");
    } else {
        this.download = ((LastTokenised && LastTokenised.length > 0) ? (LastTokenised[0].GetStringContent().split(/[\\\/]/).slice(-1)[0]) : "unspecified") + ".json";
        this.href = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(jsonEscapeNonAsci(JSON.stringify({ "command": tokens, "modifiers": modifiers })))));
    }
}

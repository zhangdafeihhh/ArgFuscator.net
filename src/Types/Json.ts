function ReadJsonFile(this: HTMLInputElement): void {
    let file = this.files[0];
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            ParseJson(JSON.parse(evt.target.result as string));
        }
        reader.onerror = function (evt) {
            document.getElementById("fileContents").innerHTML = "error reading file";
        }
    }
}

function ParseJson(Input: FileFormat) {
    var CommandOutput: HTMLTextAreaElement = document.getElementById("input_command") as HTMLTextAreaElement;
    // Reset all currently enabled modifiers
    document.querySelectorAll<HTMLInputElement>("input[id^=\"option_\"]:checked").forEach(p => p.click());
    try {
        // Construct command
        let CurrentCommand = GetInputCommand()
        let NewCommand = Input.command.map(Token => Object.entries(Token)[0][1]).join(" ")
        if(Input.command && (CurrentCommand == null || CurrentCommand == '' || CurrentCommand == NewCommand || confirm('Would you like to replace the existing command with the command that is embedded in the provided config file?\n(Clicking "Cancel" will still apply all obfuscation options)'))){
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
            if(ModifierObject == null){
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
                    var SettingObject = document.querySelector<HTMLInputElement>("#" + ModifierName + " input[data-field='" + Option + "']");
                    if(!SettingObject)
                        console.warn(`Could not apply option ${Option} on modifier ${ModifierName}`)
                    else {
                        if (SettingObject.type == 'checkbox')
                            SettingObject.checked = value;
                        else if (Array.isArray(value))
                            SettingObject.value = value.join('');
                        else
                            SettingObject.value = value;

                        SettingObject.dispatchEvent(new Event("input"))
                    }
                }
            });
        });

    } finally {

    }
}

function GenerateConfigJsonFile(this: HTMLAnchorElement) {
    if (LastTokenised?.length <= 0) return;
    LastTokenised.forEach(Token => Token.Reset());
    let tokens = LastTokenised.map(x => { let result = {}; result[x.GetType()] = x.GetContent().join(''); return result; });

    let modifiers = {};
    document.querySelectorAll<HTMLInputElement>("input[type=checkbox][data-function]:checked").forEach(x => {
        var settings = {};
        settings['ExcludedTypes'] = JSON.parse(x.parentNode.querySelector<HTMLInputElement>("div[data-excluded_types]").dataset.excluded_types);
        x.parentNode.querySelectorAll<HTMLInputElement>("input[data-field]").forEach(y => {
            var result = undefined;
            if(y.type == "checkbox")
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
    this.download = LastTokenised[0].GetContent().join("") + "_config.json";
    this.href = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify({ "command": tokens, "modifiers": modifiers }))));
}

var LastTokenised: Token[] = []
var LastIgnoredTokens: [number, number][] = [];
var OutputTokenHTML: HTMLElement;
var ConfigTokenHTML: HTMLElement;

interface FileFormat {
    command: Array<[string, string]>;
    modifiers: object;
}


function GetInputCommand(): string | null {
    // Obtain input command
    let InputObject = document.querySelector("textarea#input_command") as HTMLInputElement | null;
    let InputCommand = InputObject?.value?.trim();
    if (InputCommand == null || InputCommand == "") { console.warn("No input was provided."); return null; }
    return InputCommand;
}

// function GetIgnoredTokens(Tokens: Token[]): [Token, number][] {
//     let Result: [Token, number][] = [];

//     // Obtain input command
//     let TokenObjects: NodeListOf<HTMLDivElement> = document.querySelectorAll("#tokens > div.token");
//     if (TokenObjects == null || TokenObjects.length == 0) { console.error("No input was provided"); }
//     var i = 0;
//     TokenObjects.forEach(x => { if (x.dataset.dont_process === 'true') Result.push([Tokens[i], i]); i++ });
//     return Result;
// }

// function ToggleToken(this: HTMLElement, ev: Event) {
//     if (this.dataset.dont_process === 'true') {
//         this.dataset.dont_process = 'false';
//         this.classList.remove('enabled');
//     } else {
//         this.dataset.dont_process = 'true';
//         this.classList.add('enabled');
//     }

//     LastIgnoredTokens = GetIgnoredTokens(LastTokenised);
// }

function UpdateTokens(): void {
    ConfigTokenHTML = document.querySelector("div#tokens");
    OutputTokenHTML = document.querySelector('div#output_command');
    LastTokenised = Modifier.CommandTokenise(GetInputCommand());

    UpdateUITokens(LastTokenised);
}

function UpdateUITokens(Tokenised: Token[]): void {
    ConfigTokenHTML.innerHTML = "";
    OutputTokenHTML.innerHTML = "";
    Tokenised?.forEach(Token => {
        //     LatestIgnoredTokens.forEach(x => { if (TokenEquals(x, Token)) Token.ReadOnly = true });
        var OutputTokenElement = document.createElement('div');
        var ConfigTokenElement = document.createElement('div');

        ConfigTokenElement.classList.add("token");
        //     OutputTokenElement.addEventListener("click", ToggleToken)
        ConfigTokenHTML.appendChild(ConfigTokenElement);
        OutputTokenHTML.appendChild(OutputTokenElement);

        Token.SetElements(ConfigTokenElement, OutputTokenElement);
        //     if ((LatestIgnoredTokens.length == 0 && IsFirst) || Token.ReadOnly) OutputTokenElement.click();
        //     IsFirst = false;
    });
}

function ApplyObfuscation(): void {
    if(LastTokenised == null || LastTokenised?.length <= 0) {
        console.warn("No input to apply obfuscation to.");
        return;
    }
    // // Obtain input command
    // let InputCommand = GetInputCommand()

    // if (InputCommand == null) return null;
    // let InputCommandTokens = Modifier.CommandTokenise(InputCommand);

    LastTokenised?.forEach(Token => Token.Reset());
    // Obtain any excluded tokens
    //let TokensExcluded: [string, string][] = []; // GetIgnoredTokens(InputCommandTokens);

    // Obtain selected options
    let SelectedOptions = document.querySelectorAll("input[id^=\"option_\"]:checked") as NodeListOf<HTMLInputElement>;
    if (SelectedOptions?.length <= 0) console.warn("No enabled modififiers.")
    SelectedOptions.forEach(Element => {
        let ClassName = Element.dataset.function as string;
        let ClassInstance: Modifier = Object.create((window as any)[ClassName].prototype);

        let ExcludedTypes = JSON.parse(document.getElementById(Element.id + "_arg0").dataset.excluded_types);
        let ClassInstanceArguments: any[] = [LastTokenised, ExcludedTypes];

        let SelectedOptionArguments = document.querySelectorAll("input[id^=\"" + Element.id + "_arg\"]") as NodeListOf<HTMLInputElement>;
        SelectedOptionArguments.forEach(OptionElement => {
            ClassInstanceArguments.push(OptionElement.value);
        });

        ClassInstance.constructor.apply(ClassInstance, ClassInstanceArguments);
        ClassInstance.GenerateOutput();
    });
}

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
        CommandOutput.textContent = '';
        CommandOutput.value = Input.command.map(Token => Object.entries(Token)[0][1]).join(" ");

        LastTokenised = [];
        Input.command.forEach(Entry => {
            let TokenContent = Object.entries(Entry)[0][1];
            let Type = Object.entries(Entry)[0][0]
            var t = new Token(TokenContent.split(''));
            t.SetType(Type);
            LastTokenised.push(t);
        });

        UpdateUITokens(LastTokenised);

        // Set options
        document.querySelectorAll<HTMLInputElement>("input[id^=\"option_\"]:checked").forEach(x => x.click())
        document.querySelectorAll<HTMLInputElement>("div[data-excluded_types]").forEach(ContextMenuButton => { ContextMenuButton.dataset.excluded_types = "[]"; ContextMenuButton.innerText = UpdateExcludeText(ContextMenuButton, ContextMenuButton.nextSibling as HTMLElement); })
        Object.entries(Input.modifiers).forEach(([ModifierName, _]) => {
            document.getElementById("option_" + ModifierName.toLowerCase()).click();
            Object.entries(Input.modifiers[ModifierName]).forEach(([Option, _]) => {
                var value = Input.modifiers[ModifierName][Option];
                if (Option == "ExcludedTypes") {
                    var ContextMenuButton = document.querySelector<HTMLInputElement>("#" + ModifierName + " div[data-excluded_types]");
                    var ContextMenu = document.querySelector<HTMLInputElement>("#" + ModifierName + " menu");
                    ContextMenuButton.dataset.excluded_types = JSON.stringify(value);
                    ContextMenuButton.innerText = UpdateExcludeText(ContextMenuButton, ContextMenu);
                } else {
                    var SettingObject = document.querySelector<HTMLInputElement>("#" + ModifierName + " input[data-field='" + Option + "']");

                    if (Array.isArray(value))
                        SettingObject.value = value.join('');
                    else
                        SettingObject.value = value;

                    SettingObject.dispatchEvent(new Event("input"))
                }
            });
        });

    } finally {

    }
}

function GenerateConfig(this: HTMLAnchorElement) {
    if (LastTokenised?.length <= 0) return;
    LastTokenised.forEach(Token => Token.Reset());
    let tokens = LastTokenised.map(x => { let result = {}; result[x.GetType()] = x.GetContent().join(''); return result; });

    let modifiers = {};
    document.querySelectorAll<HTMLInputElement>("input[type=checkbox][data-function]:checked").forEach(x => {
        var settings = {};
        settings['ExcludedTypes'] = JSON.parse(x.parentNode.querySelector<HTMLInputElement>("div[data-excluded_types]").dataset.excluded_types);
        x.parentNode.querySelectorAll<HTMLInputElement>("input[data-field]").forEach(y => {
            var result = undefined;
            if (y.type == "range")
                result = Number(y.value);
            else if (y.dataset.type == "array")
                result = y.value.split('')
            else
                result = y.value

            settings[y.dataset.field] = result;
        })
        modifiers[x.dataset.function] = settings;
    });
    this.download = LastTokenised[0].GetContent().join("") + "_config.json";
    this.href = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify({ "command": tokens, "modifiers": modifiers }))));
}

document.addEventListener("DOMContentLoaded", UpdateTokens);
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("JsonFile")?.addEventListener("change", ReadJsonFile);
    document.getElementById("input_command")?.addEventListener("keyup", UpdateTokens);
    document.getElementById("obfuscation_run")?.addEventListener("click", () => ApplyObfuscation());
    document.getElementById("download_config")?.addEventListener("click", GenerateConfig);

    document.querySelectorAll<HTMLInputElement>("input[type=range].probability").forEach(p => { p.addEventListener("input", _ => { if (p.nextElementSibling) p.nextElementSibling.innerHTML = 'p = ' + p.value; }); p.dispatchEvent(new Event("input")) });

    document.querySelectorAll<HTMLInputElement>(".option_target").forEach((ContextMenuButton: HTMLDivElement) => {
        // Create new Context Menu
        var ContextMenu = document.getElementsByClassName("context-menu")[0].cloneNode(true) as HTMLMenuElement;
        ContextMenu.removeChild(ContextMenu.children[0]);
        ContextMenuButton.parentNode.insertBefore(ContextMenu, ContextMenuButton.nextSibling);

        Array.from(ContextMenu.children).forEach((ContextMenuItem: HTMLElement) => {
            ContextMenuItem.addEventListener("click", e => {
                ContextMenuItem.dataset.active = (ContextMenuItem.dataset.active == "true" ? "" : "true");
                var ExcludedTypes = JSON.parse(ContextMenuButton.dataset.excluded_types) as string[];
                if (ContextMenuItem.dataset.active != "true") ExcludedTypes.push(ContextMenuItem.dataset.type); else ExcludedTypes = ExcludedTypes.filter(item => item !== ContextMenuItem.dataset.type);
                ContextMenuButton.dataset.excluded_types = JSON.stringify(ExcludedTypes);
                ContextMenuButton.innerText = UpdateExcludeText(ContextMenuButton, ContextMenu);
            })
        });
        ContextMenuButton.innerText = UpdateExcludeText(ContextMenuButton, ContextMenu);
        ContextMenuButton.addEventListener("click", _ => ShowContextMenu(ContextMenu, ContextMenuButton))
    });

    document.querySelectorAll<HTMLInputElement>("input[id^=\"option_\"]").forEach(p => {
        p.addEventListener("change", _ => {
            if (p.parentElement) {
                var suboptions = p.parentElement.querySelector<HTMLDivElement>("div.suboptions")
                if (!p.checked) {
                    p.parentElement.classList.remove('selected');
                    if (suboptions) suboptions.style.display = "none";
                } else {
                    p.parentElement.classList.add('selected')
                    if (suboptions) suboptions.style.display = "flex";
                }
            }
        }); p.dispatchEvent(new Event("change"))
    });
});

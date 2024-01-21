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

function UpdateTokens(): void {
    removeUserErrors();
    ConfigTokenHTML = document.querySelector("div#tokens");
    OutputTokenHTML = document.querySelector('div#output_command');
    LastTokenised = Modifier.CommandTokenise(GetInputCommand(), document.getElementById("menu-templates") as HTMLMenuElement);

    UpdateUITokens(LastTokenised);
}

function UpdateUITokens(Tokenised: Token[]): void {
    ConfigTokenHTML.innerHTML = "";
    OutputTokenHTML.innerHTML = "";
    Tokenised?.forEach((Token, Index, Array) => {
        //     LatestIgnoredTokens.forEach(x => { if (TokenEquals(x, Token)) Token.ReadOnly = true });
        var OutputTokenElement = document.createElement('span');
        var ConfigTokenElement = document.createElement('div');
        let SpaceElement = document.createElement('span');
        SpaceElement.innerHTML = "&nbsp;";

        ConfigTokenElement.classList.add("token");
        ConfigTokenHTML.appendChild(ConfigTokenElement);
        OutputTokenHTML.appendChild(OutputTokenElement);

        Token.SetElements(ConfigTokenElement, OutputTokenElement);

        if (Index < Array.length - 1 && !Modifier.ValueChars.some(y => Token.GetContent().reverse()[0] == y)) {
            OutputTokenHTML.appendChild(SpaceElement);
        }
        //     if ((LatestIgnoredTokens.length == 0 && IsFirst) || Token.ReadOnly) OutputTokenElement.click();
        //     IsFirst = false;
    });
}

function ApplyObfuscation(): void {
    if (LastTokenised == null || LastTokenised?.length <= 0) {
        UpdateTokens();
        if (LastTokenised == null || LastTokenised?.length <= 0) {
            logUserError("empty-input", "No input to apply obfuscation to. Provide a command in the above box to get started.", true);
            return;
        }
    }

    LastTokenised?.forEach(Token => Token.Reset());

    // Obtain selected options
    let SelectedOptions = document.querySelectorAll("input[data-function][id^=\"option_\"]:checked") as NodeListOf<HTMLInputElement>;
    if (SelectedOptions?.length <= 0) { logUserError("pattern-no-options", "There are no transformations enabled in the options section below; without this, no obfuscation will be applied.", true) }
    SelectedOptions.forEach(Element => {
        let ClassName = Element.dataset.function as string;
        let ClassInstance: Modifier = Object.create((window as any)[ClassName].prototype);

        let ExcludedTypes = JSON.parse(document.getElementById(Element.id + "_arg0").dataset.excluded_types);
        let ClassInstanceArguments: any[] = [LastTokenised, ExcludedTypes];

        let SelectedOptionArguments = document.querySelectorAll("input[id^=\"" + Element.id + "_arg\"], textarea[id^=\"" + Element.id + "_arg\"]") as NodeListOf<HTMLInputElement | HTMLTextAreaElement>;
        SelectedOptionArguments.forEach(OptionElement => {
            ClassInstanceArguments.push((OptionElement instanceof HTMLInputElement && OptionElement.type == 'checkbox') ? OptionElement.checked : OptionElement.value);
        });

        ClassInstance.constructor.apply(ClassInstance, ClassInstanceArguments);
        ClassInstance.GenerateOutput();
    });
}

function GenerateObfuscationOptionsHTML() {
    let modifiers = Modifier.GetAllModifiers();
    let target = document.getElementById('options-panel-options');

    for (let modifierID in modifiers) {
        let modifier = modifiers[modifierID]
        modifierID = modifierID.toLowerCase();

        let modifierBox = document.createElement('div');
        modifierBox.classList.add("option");
        modifierBox.id = modifier.Function.name;

        let modifierBoxBody = document.createElement('div');
        modifierBoxBody.classList.add('body');
        modifierBoxBody.innerHTML = `<input type="checkbox" id="option_${modifierID}" data-function="${modifier.Function.name}" />
        <label for="option_${modifierID}">Enable <a class="explain" title="${modifier.Description}">${modifier.Name}</a></label>`;

        let modifierBoxBodySubOptions = document.createElement('div');
        modifierBoxBodySubOptions.classList.add('suboptions');

        let modifierBoxBodySubOptionsRow = document.createElement('div');
        modifierBoxBodySubOptionsRow.classList.add('flex-row')
        modifierBoxBodySubOptionsRow.innerHTML = `<label for="option_${modifierID}_arg0">Apply to</label>
        <div class="option_target button" id="option_${modifierID}_arg0"
            data-excluded_types=""></div>
            &nbsp;<label for="option_${modifierID}_arg1">with a probability of</label><input
            type="number" id="option_${modifierID}_arg1" data-field="Probability"
            class="probs-slider" value="0.5" min="0" max="1" step="0.1">`;

        (modifierBoxBodySubOptionsRow.querySelector(`div#option_${modifierID}_arg0`) as HTMLElement).dataset['excluded_types'] = JSON.stringify(modifier.DefaultExcludedTypes);

        modifierBoxBodySubOptions.appendChild(modifierBoxBodySubOptionsRow)

        let i = 2;
        let modifierBoxBodySubOptionsRow2 = document.createElement('div');
        modifierBoxBodySubOptionsRow2.classList.add('flex-row')

        modifier.Arguments.forEach((argument: ModifierArgumentsDefinition) => {
            let modifierBoxBodySubOptionsRow3 = document.createElement('div');
            modifierBoxBodySubOptionsRow3.classList.add("suboption")
            let label = `<label for="option_${modifierID}_arg${i}">${argument.PublicName}</label>`;
            if (argument.Type == "text") {
                modifierBoxBodySubOptionsRow3.innerHTML += label + `<input type="text" id="option_${modifierID}_arg${i}" data-field="${argument.InternalName}" data-type="array" placeholder="${argument.Description}" value="" />`;
            } else if (argument.Type == "number") {
                modifierBoxBodySubOptionsRow3.innerHTML += label + `<input type="number" id="option_${modifierID}_arg${i}" data-field="${argument.InternalName}" placeholder="${argument.Description}" title="${argument.Description}" value="" />`;
            } else if (argument.Type == "checkbox") {
                modifierBoxBodySubOptionsRow3.innerHTML += `<input data-field="${argument.InternalName}" type="checkbox" id="option_${modifierID}_arg${i}"></input>` + label;
            } else if (argument.Type == "textarea") {
                modifierBoxBodySubOptionsRow3.innerHTML += label + `<textarea data-field="${argument.InternalName}" id="option_${modifierID}_arg${i}" placeholder="${argument.Description}"></textarea>`;
            }
            modifierBoxBodySubOptionsRow2.appendChild(modifierBoxBodySubOptionsRow3)
            i++;
        });
        modifierBoxBodySubOptions.appendChild(modifierBoxBodySubOptionsRow2)


        modifierBoxBody.appendChild(modifierBoxBodySubOptions);

        let modifierBoxDrag = document.createElement('div');
        modifierBoxDrag.classList.add("drag");
        modifierBoxDrag.innerText = "⠿";

        modifierBox.appendChild(modifierBoxBody);
        modifierBox.appendChild(modifierBoxDrag);

        target.appendChild(modifierBox);
    };
}

function ResetForm() {
    document.querySelectorAll<HTMLInputElement>('input[type=text], input[type=file]').forEach(x => x.value = x.defaultValue);
    document.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach(x => { x.checked = x.defaultChecked; x.dispatchEvent(new Event("change")) });
    document.querySelectorAll<HTMLTextAreaElement>('textarea').forEach(x => { x.value = x.defaultValue; x.dispatchEvent(new Event("keyup")) });
    document.getElementById("menu-templates").children[0].dispatchEvent(new Event("click"));
}

document.addEventListener("DOMContentLoaded", UpdateTokens);
document.addEventListener("DOMContentLoaded", () => {
    GenerateObfuscationOptionsHTML();
    document.getElementById("format-picker")?.addEventListener("change", FetchJsonFile);
    document.getElementById("JsonFile")?.addEventListener("change", ReadJsonFile);
    document.getElementById("input_command")?.addEventListener("keyup", debounce(UpdateTokens, 200));
    document.getElementById("obfuscation_run")?.addEventListener("click", () => ApplyObfuscation());
    document.getElementById("download_config")?.addEventListener("click", GenerateConfigJsonFile);
    document.getElementById("reset_form")?.addEventListener("click", ResetForm);

    document.getElementById("button_template").addEventListener("click", _ => ShowContextMenu(document.getElementById('menu-templates'), document.getElementById('button_template')))

    document.getElementById('menu-templates').childNodes.forEach((ContextMenuItem: HTMLLIElement) => {
        ContextMenuItem.addEventListener("click", e => {
            FetchJsonFile2(ContextMenuItem);
            ContextMenuItem.parentNode.childNodes.forEach((x: HTMLElement) => { if (x.dataset) x.dataset['active'] = "" });

            if (!ContextMenuItem.dataset['function']) {
                ContextMenuItem.dataset['active'] = 'true';

                document.getElementById("button_template").innerHTML = `<strong>Selected template</strong>: ${ContextMenuItem.innerText}`;
            } else
                document.getElementById("button_template").innerHTML = `<strong>Selected template</strong>: (none)`;

            document.getElementById("menu-templates").style.display = 'none';
        })
    });



    document.querySelectorAll<HTMLFieldSetElement>("fieldset.collapsible").forEach((x) => {
        let legend = x.querySelector("legend");
        let span = document.createElement("span");
        let content = x.children[1] as HTMLElement;
        span.innerText = content.classList.contains("collapsed") ? "▲" : "▼";
        legend.appendChild(span);
        legend.addEventListener("click", () => {
            if (content.classList.contains("collapsed")) {
                content.classList.remove("collapsed");
            } else {
                content.classList.add("collapsed");
            }
            span.innerText = content.classList.contains("collapsed") ? "▲" : "▼";
        });

    })

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
    slist(document.getElementById("options-panel-options"));
});


function slist(target: HTMLElement) {
    // (A) SET CSS + GET ALL LIST ITEMS
    target.classList.add("slist");
    function getOptionItems() { return target.querySelectorAll(".slist>div>.drag") }
    let items: any = getOptionItems(), current: any = null, eventTarget: any = null;

    // (B) MAKE ITEMS DRAGGABLE + SORTABLE
    for (let i of items) {
        // (B1) ATTACH DRAGGABLE
        i.draggable = true;

        // (B2) DRAG START - YELLOW HIGHLIGHT DROPZONES
        i.ondragstart = () => {
            current = i.parentElement;
            for (let it of items) {
                if (it.parentElement != current) { it.parentElement.classList.add("hint"); }
            }
        };

        // (B3) DRAG ENTER - RED HIGHLIGHT DROPZONE
        i.ondragenter = (event: Event) => {
            eventTarget = event.target;
            event.stopPropagation();
            event.preventDefault();
            if (i.parentElement != current) { i.parentElement.classList.add("active"); }
        };

        // (B4) DRAG LEAVE - REMOVE RED HIGHLIGHT
        i.ondragleave = (event: Event) => {
            event.stopPropagation();
            event.preventDefault();
            if (eventTarget == event.target)
                i.parentElement.classList.remove("active");
        }

        // (B5) DRAG END - REMOVE ALL HIGHLIGHTS
        i.ondragend = () => {
            for (let it of items) {
                it.parentElement.classList.remove("hint");
                it.parentElement.classList.remove("active");
            }
        };

        // (B6) DRAG OVER - PREVENT THE DEFAULT "DROP", SO WE CAN DO OUR OWN
        i.ondragover = (event: Event) => event.preventDefault();

        // (B7) ON DROP - DO SOMETHING
        i.ondrop = (event: Event) => {
            event.stopPropagation();
            event.preventDefault();
            if (i.parentElement != current) {
                let currentpos = 0, droppedpos = 0, items = getOptionItems();
                for (let it = 0; it < items.length; it++) {
                    if (current == items[it].parentElement) { currentpos = it; }
                    if (i.parentElement == items[it].parentElement) { droppedpos = it; }
                }
                if (currentpos < droppedpos) {
                    i.parentElement.parentNode.insertBefore(current, i.parentElement.nextSibling);
                } else {
                    i.parentElement.parentNode.insertBefore(current, i.parentElement);
                }
            }
        };
    }
}

function moveItem(current: Element, newPosition: number) {
    let items = Array.from(current.parentElement.childNodes).filter(x => x.nodeType == 1)
    current.parentNode.insertBefore(current, items[newPosition])
}

function debounce(func: Function, wait: number, immediate: boolean = false) {
    var timeout: number;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

function getUserErrors(): Map<string, HTMLElement> {
    let result = new Map<string, HTMLElement>();
    let error_messages = document.getElementById("error-messages");
    error_messages.childNodes.forEach(x => result.set((x as HTMLElement).dataset.error_id, x as HTMLElement));
    return result;
}

function logUserError(id: string, message: string, error: boolean = false) {
    (error ? console.error : console.warn)(message);

    let error_messages = document.getElementById("error-messages");
    if (!getUserErrors().has(id)) {
        let error_message = document.createElement("div")
        error_message.innerHTML = `<strong> ${error ? "🔴 Error" : "🟠 Warning"}:</strong> ${message}`;
        error_message.dataset.error_id = id;
        error_messages.append(error_message)
    }
}

function removeUserErrors(): void {
    document.getElementById("error-messages").innerHTML = "";
}

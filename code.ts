var LastTokenised: Token[] = []
var LastIgnoredTokens: [Token, number][] = [];

function GetInputCommand(): string | null {
    // Obtain input command
    let InputObject = document.querySelector("textarea#input_command") as HTMLInputElement | null;
    let InputCommand = InputObject?.value?.trim();
    if (InputCommand == null) { console.error("No input was provided"); return null; }
    return InputCommand;
}

function GetIgnoredTokens(Tokens: Token[]): [Token, number][] {
    let Result: [Token, number][] = [];

    // Obtain input command
    let TokenObjects: NodeListOf<HTMLDivElement> = document.querySelectorAll("#tokens > div.token");
    if (TokenObjects == null || TokenObjects.length == 0) { console.error("No input was provided"); }
    var i = 0;
    TokenObjects.forEach(x => { if (x.dataset.dont_process === 'true') Result.push([Tokens[i], i]); i++ });
    return Result;
}

function ToggleToken(this: HTMLElement, ev: Event) {
    if (this.dataset.dont_process === 'true') {
        this.dataset.dont_process = 'false';
        this.classList.remove('enabled');
    } else {
        this.dataset.dont_process = 'true';
        this.classList.add('enabled');
    }

    LastIgnoredTokens = GetIgnoredTokens(LastTokenised);
}

function UpdateTokens() {
    let InputCommand = GetInputCommand();
    var OutputTokenHTML = document.querySelector("div#tokens") as HTMLInputElement | null;
    if (InputCommand == null || OutputTokenHTML == null) return;
    LastTokenised = Modifier.CommandTokenise(InputCommand);
    OutputTokenHTML.innerHTML = "";

    var IsFirst = true;

    let LatestIgnoredTokens = LastIgnoredTokens.map(x => x[0]);
    LastTokenised.forEach(Token => {
        LatestIgnoredTokens.forEach(x => { if (TokenEquals(x, Token)) Token.ReadOnly = true });
        var OutputTokenElement = document.createElement('div');
        OutputTokenElement.textContent = Token.join('');
        OutputTokenElement.classList.add("token");
        OutputTokenElement.addEventListener("click", ToggleToken)
        OutputTokenHTML?.appendChild(OutputTokenElement);
        if ((LatestIgnoredTokens.length == 0 && IsFirst) || Token.ReadOnly) OutputTokenElement.click();
        IsFirst = false;
    });
}

function ApplyObfuscation(): string | null {
    // Obtain input command
    let InputCommand = GetInputCommand()

    if (InputCommand == null) return null;
    let InputCommandTokens = Modifier.CommandTokenise(InputCommand);

    // Obtain any excluded tokens
    let TokensExcluded = GetIgnoredTokens(InputCommandTokens);

    // Obtain selected options
    let SelectedOptions = document.querySelectorAll("input[id^=\"option_\"]") as NodeListOf<HTMLInputElement>;
    SelectedOptions.forEach(Element => {
        if (Element.checked) {
            let ClassName = Element.dataset.function as string;
            let ClassInstance: Modifier = Object.create(window[ClassName].prototype);

            let ClassInstanceArguments: any[] = [InputCommandTokens, TokensExcluded.map(x => x[1])];
            let SelectedOptionArguments = document.querySelectorAll("input[id^=\"" + Element.id + "_arg\"]") as NodeListOf<HTMLInputElement>;
            SelectedOptionArguments.forEach(OptionElement => {
                ClassInstanceArguments.push(OptionElement.value);
            });

            ClassInstance.constructor.apply(ClassInstance, ClassInstanceArguments);
            InputCommandTokens = ClassInstance.GenerateOutput();
        }
    });

    return Modifier.TokensToString(InputCommandTokens);
}

document.addEventListener("DOMContentLoaded", UpdateTokens);
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("input_command")?.addEventListener("keyup", UpdateTokens);
    document.getElementById("obfuscation_run")?.addEventListener("click", () => {
        var output = document.querySelector('div#output_command') as HTMLDivElement;
        output.textContent = ApplyObfuscation();
        output.style.fontFamily = 'Monospace';
    });
    document.querySelectorAll<HTMLInputElement>("input[type=range].probability").forEach(p => { p.addEventListener("input", _ => { if (p.nextElementSibling) p.nextElementSibling.innerHTML = 'p = ' + p.value; }); p.dispatchEvent(new Event("input")) });
    document.querySelectorAll<HTMLInputElement>("input[id^=\"option_\"]").forEach(p => { p.addEventListener("input", _ => { if (p.parentElement) if (!p.checked) p.parentElement.classList.remove('selected'); else p.parentElement.classList.add('selected') }); p.dispatchEvent(new Event("input")) });
});

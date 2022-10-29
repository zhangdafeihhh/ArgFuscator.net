function ApplyObfuscation() {
    // Obtain input command
    let InputObject = document.querySelector("textarea#input_command") as HTMLInputElement | null;
    let InputCommand = InputObject?.value;
    if (InputCommand == null) { console.error("No input was provided"); return }
    console.log(InputCommand);

    // Obtain any excluded tokens
    let TokensExcludedObject = document.querySelector("input#tokens_excluded") as HTMLInputElement | null;
    let TokensExcluded = TokensExcludedObject?.value;
    if (TokensExcluded == null) { console.warn("No tokens to exclude"); TokensExcluded = ""; }
    console.log(TokensExcluded);

    // Obtain selected options
    let SelectedOptions = document.querySelectorAll("input[id^=\"option_\"]") as NodeListOf<HTMLInputElement>;
    SelectedOptions.forEach(Element => {
        if (Element.checked) {
            let ClassName = Element.dataset.function as string;
            let ClassInstance = Object.create(window[ClassName].prototype);

            let ClassInstanceArguments = [InputCommand, TokensExcluded];
            let SelectedOptionArguments = document.querySelectorAll("input[id^=\"" + Element.id + "_arg\"]") as NodeListOf<HTMLInputElement>;
            SelectedOptionArguments.forEach(OptionElement => {
                ClassInstanceArguments.push(OptionElement.value);
            });

            ClassInstance.constructor.apply(ClassInstance, ClassInstanceArguments);
            InputCommand = ClassInstance.GenerateOutput();
        }
    });

    return InputCommand;
}

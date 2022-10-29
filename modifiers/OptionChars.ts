class OptionChars extends Modifier {
    private ProvidedOptionChar: Char;
    private OutputOptionChars: Char[];

    constructor(InputCommand: string, IgnoreTokens: string, ProvidedOptionChar: string | null, OutputOptionChars: string | null) {
        super(InputCommand, IgnoreTokens);
        if (ProvidedOptionChar?.length != 1)
            throw Error(`Unexpected ProvidedOptionChar length (expecting 1, found ${ProvidedOptionChar?.length})`);
        if (OutputOptionChars == null || OutputOptionChars.length == 0)
            throw Error(`Unexpected OutputOptionChars length (expecting at least 1, found ${OutputOptionChars?.length})`);

        this.ProvidedOptionChar = ProvidedOptionChar as String as Char;
        this.OutputOptionChars = OutputOptionChars.split('').map(x => x as String as Char);
    }

    GenerateOutput(): string {
        let result = "";
        let SeparationCharSeen = true;
        this.InputCommandChars.forEach(char => {
            if (!char.read_only && SeparationCharSeen && char == this.ProvidedOptionChar) {
                char = Modifier.ChooseRandom(this.OutputOptionChars);
            }
            result += char;
            SeparationCharSeen = (char == this.SeparationChar);
        });
        return result;
    }
}

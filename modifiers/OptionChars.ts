class OptionChars extends Modifier {
    private ProvidedOptionChar: Char;
    private OutputOptionChars: Char[];

    constructor(InputCommand: Token[], IgnoreTokens: number[], ProvidedOptionChar: string | null, OutputOptionChars: string | null) {
        super(InputCommand, IgnoreTokens);
        if (ProvidedOptionChar?.length != 1)
            throw Error(`Unexpected ProvidedOptionChar length (expecting 1, found ${ProvidedOptionChar?.length})`);
        if (OutputOptionChars == null || OutputOptionChars.length == 0)
            throw Error(`Unexpected OutputOptionChars length (expecting at least 1, found ${OutputOptionChars?.length})`);

        this.ProvidedOptionChar = ProvidedOptionChar as String as Char;
        this.OutputOptionChars = OutputOptionChars.split('').map(x => x as String as Char);
    }

    GenerateOutput(): Token[] {
        let result: Token[] = [];
        var This = this;
        this.InputCommandTokens.forEach(chars => {
            var Token: Token = [] as Char[] as Token;
            chars.forEach(char => {
                if (!chars.ReadOnly && char == This.ProvidedOptionChar)
                    char = Modifier.ChooseRandom(This.OutputOptionChars);
                Token.push(char);
            });
            result.push(Token);
        });
        return result;
    }
}

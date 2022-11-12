function TokenEquals(array1: Token, array2: Token): boolean {
    return array1.GetContent().length === array1.GetContent().length && array1.GetContent().every(function (value, index) { return CharEquals(value, array1.GetContent()[index]); })
}

function CharEquals(char1: Char, char2: Char): boolean {
    return char1.toString() == char2.toString();
}

abstract class Modifier {
    protected InputCommandTokens: Token[] = [];
    protected ExcludedTypes: string[];

    private static SeparationChar: Char = ' ' as String as Char;
    private static QuoteChars: Char[] = ['"' as String as Char, "'" as String as Char];

    constructor(InputCommand: Token[], ExcludedTypes: string[]) {
        // Parse inputs
        this.InputCommandTokens = InputCommand
        this.ExcludedTypes = ExcludedTypes;

        // Mark ignored tokens as read-only
        //var i = 0;
        //this.InputCommandTokens.forEach(token => { token.ReadOnly = IgnoredTokens.indexOf(i) >= 0; i++; });
    }

    protected CoinFlip(probability: number): boolean {
        return Math.random() > 1 - probability;
    }

    protected static ChooseRandom<T>(options: Array<T>): T {
        return options[Math.floor(Math.random() * options.length)];
    }

    public static CommandTokenise(InputCommand: string): Token[] {
        var InQuote: Char | null = null;
        var Tokens: Token[] = [];
        var TokenContent: Char[] = [];
        for (var i = 0; i < InputCommand.length; i++) {
            let Char: Char = new String(InputCommand[i]) as Char;
            if (InQuote == null && Char == this.SeparationChar) {
                if (Token.length > 0)
                    Tokens.push(new Token(TokenContent));
                TokenContent = [] as Char[];
            } else {
                if (InQuote != null && Char.toString() == InQuote?.toString())
                    InQuote = null;
                else if (InQuote == null && this.QuoteChars.some(x => x == Char))
                    InQuote = Char;

                TokenContent.push(Char);
            }
        }
        if (Token?.length > 0)
            Tokens.push(new Token(TokenContent));

        Tokens[0].SetType("command");
        return Tokens;
    }

    protected static ParseProbability(Probability: string): number {
        let ReturnProbability: number;
        // Parse probability
        if (Probability == null) ReturnProbability = 0.1;
        ReturnProbability = Number(Probability);
        if (ReturnProbability < 0 || ReturnProbability > 1)
            throw Error(`Unexpected Probability (expecting 0<=x<=1, found x=${ReturnProbability})`);
        return ReturnProbability;
    }

    abstract GenerateOutput(): void;

    // public static TokensToString(Tokens: Token[]): string {
    //     return Tokens.map(x => x.join('')).join(Modifier.SeparationChar.toString());
    // }
}

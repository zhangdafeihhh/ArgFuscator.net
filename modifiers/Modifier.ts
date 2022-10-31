type Char = String;
enum TokenType { ProgramName, Generic, FilePath }
type Token = Char[] & { ReadOnly: boolean; Type: TokenType };


function TokenEquals(array1: Token, array2: Token): boolean {
    return array1.length === array2.length && array1.every(function (value, index) { return CharEquals(value, array2[index]); })
}

function CharEquals(char1: Char, char2: Char): boolean {
    return char1.toString() == char2.toString();
}

abstract class Modifier {
    protected InputCommandTokens: Token[] = [];

    private static SeparationChar: Char = ' ' as String as Char;
    private static QuoteChars: Char[] = ['"' as String as Char, "'" as String as Char];

    constructor(InputCommand: Token[], IgnoredTokens: number[]) {
        // Parse inputs
        this.InputCommandTokens = InputCommand

        // Mark ignored tokens as read-only
        var i = 0;
        this.InputCommandTokens.forEach(token => { token.ReadOnly = IgnoredTokens.indexOf(i) >= 0; i++; });
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
        var Token: Token = [] as Char[] as Token;
        for (var i = 0; i < InputCommand.length; i++) {
            let Char: Char = new String(InputCommand[i]) as Char;
            if (InQuote == null && Char == this.SeparationChar) {
                if (Token.length > 0)
                    Tokens.push(Token);
                Token = [] as Char[] as Token;
            } else {
                if (InQuote != null && Char.toString() == InQuote?.toString())
                    InQuote = null;
                else if (InQuote == null && this.QuoteChars.some(x => x == Char))
                    InQuote = Char;

                Token.push(Char);
            }
        }
        if (Token?.length > 0)
            Tokens.push(Token);
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

    abstract GenerateOutput(): Token[];

    public static TokensToString(Tokens: Token[]): string {
        return Tokens.map(x => x.join('')).join(Modifier.SeparationChar.toString());
    }
}

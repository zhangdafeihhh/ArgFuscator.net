class QuoteInsertion extends Modifier {
    private static readonly QuoteCharacter: Char = new String("\"") as Char;
    private Probability: number;

    constructor(InputCommand: Token[], IgnoreTokens: number[], Probability: string) {
        super(InputCommand, IgnoreTokens);

        this.Probability = Modifier.ParseProbability(Probability);
    }

    GenerateOutput(): Token[] {
        let result: Token[] = [];
        var This = this;
        this.InputCommandTokens.forEach(function (chars) {
            var Token: Token = [] as Char[] as Token;
            var i = 0;
            chars.forEach(char => {
                // Add current char to result string
                Token.push(char);

                // Ensure (a) char is not read-only
                //        (b) probability tells us we will insert a char from the range
                if (!chars.ReadOnly && This.CoinFlip(This.Probability)) {
                    do {
                        Token.push(QuoteInsertion.QuoteCharacter);
                        i++;
                    } while (This.CoinFlip(This.Probability * (0.9 ** i)));
                }
            });
            if (i % 2 != 0)
                Token.push(QuoteInsertion.QuoteCharacter);

            result.push(Token);
        });
        return result;
    }
}

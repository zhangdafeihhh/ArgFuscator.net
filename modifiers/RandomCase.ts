class RandomCase extends Modifier {
    private Probability: number;

    constructor(InputCommand: Token[], IgnoreTokens: number[], Probability: string) {
        super(InputCommand, IgnoreTokens);
        this.Probability = Modifier.ParseProbability(Probability);
    }

    GenerateOutput(): Token[] {
        let result: Token[] = []
        let This = this;
        this.InputCommandTokens.forEach(chars => {
            var Token: Token = [] as Char[] as Token;
            chars.forEach(char => {
                if (chars.ReadOnly)
                    Token.push(char);
                else {
                    if (This.CoinFlip(This.Probability) === true) {
                        var x = CharEquals(new String(char.toLowerCase()) as Char, char);
                        Token.push((x ? char.toUpperCase() : char.toLowerCase()) as String as Char);
                    } else {
                        Token.push(char);
                    }
                    //Token.push(this.CoinFlip(this.Probability) === true ? (char.toLowerCase() as String == char ? new String(char.toUpperCase()) : new String(char.toLowerCase())) : char) as Char;
                }
            });
            result.push(Token);
        })
        return result;
    }
}

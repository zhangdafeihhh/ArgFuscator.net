class RandomCase extends Modifier {
    private Probability: number;

    constructor(InputCommand: Token[], ExcludedTypes: string[], Probability: string) {
        super(InputCommand, ExcludedTypes);
        this.Probability = Modifier.ParseProbability(Probability);
    }

    GenerateOutput(): void {
        let This = this;
        this.InputCommandTokens.forEach(Token => {
            var NewTokenContent: Char[] = [];
            Token.GetContent().forEach(char => {
                if (!This.ExcludedTypes.includes(Token.GetType())) {
                    if (This.CoinFlip(This.Probability) === true) {
                        var x = CharEquals(new String(char.toLowerCase()) as Char, char);
                        NewTokenContent.push((x ? char.toUpperCase() : char.toLowerCase()) as String as Char);
                    } else {
                        NewTokenContent.push(char);
                    }
                    //Token.push(this.CoinFlip(this.Probability) === true ? (char.toLowerCase() as String == char ? new String(char.toUpperCase()) : new String(char.toLowerCase())) : char) as Char;
                    Token.SetContent(NewTokenContent);
                }
            });
        })
    }
}

class QuoteInsertion extends Modifier {
    private static readonly QuoteCharacter: Char = new String("\"") as Char;

    constructor(InputCommand: Token[], ExcludedTypes: string[], Probability: string) {
        super(InputCommand, ExcludedTypes, Probability);
    }

    GenerateOutput(): void {
        var This = this;
        this.InputCommandTokens.forEach(function (Token) {
            var NewTokenContent: Char[] = [];
            var i = 0;
            Token.GetContent().forEach(char => {
                // Add current char to result string
                NewTokenContent.push(char);

                // Ensure (a) char is not read-only
                //        (b) probability tells us we will insert a char from the range
                if (!This.ExcludedTypes.includes(Token.GetType()) && Modifier.CoinFlip(This.Probability)) {
                    do {
                        NewTokenContent.push(QuoteInsertion.QuoteCharacter);
                        i++;
                    } while (Modifier.CoinFlip(This.Probability * (0.9 ** i)));
                }
            });
            if (i % 2 != 0)
                NewTokenContent.push(QuoteInsertion.QuoteCharacter);

            Token.SetContent(NewTokenContent);
        });
    }
}

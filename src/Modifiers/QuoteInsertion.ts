@Modifier.Register("Quote Insertion", "Add pairs of quotes to command-line arguments.", ['command'])
class QuoteInsertion extends Modifier {
    private static QuoteCharacter: Char = new String("\"") as Char;

    constructor(InputCommand: Token[], ExcludedTypes: string[], Probability: string) {
        super(InputCommand, ExcludedTypes, Probability);
    }

    GenerateOutput(): void {
        var This = this;
        this.InputCommandTokens.forEach(function (Token) {
            var NewTokenContent: Char[] = [];
            var previousQuote = false;
            var i = 0;
            Token.GetContent().forEach(char => {
                // Add current char to result string
                NewTokenContent.push(char);

                // Ensure (a) char is not excluded
                //        (b) probability tells us we will insert quotes
                if (!This.ExcludedTypes.includes(Token.GetType()) && Modifier.CoinFlip(This.Probability) && previousQuote == false) {
                    // let previousQuote = false;
                    // do {
                        NewTokenContent.push(QuoteInsertion.QuoteCharacter);
                        previousQuote = true;
                        i++;
                    //} while (Modifier.CoinFlip(This.Probability * (0.9 ** i)));
                } else {
                    previousQuote = false;
                }
            });

            if (i % 2 != 0)
                if (previousQuote)
                    NewTokenContent.pop();
                else
                    NewTokenContent.push(QuoteInsertion.QuoteCharacter);

            Token.SetContent(NewTokenContent);
        });
    }
}

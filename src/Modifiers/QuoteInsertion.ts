@Modifier.Register("Quote Insertion", "Add pairs of quotes to command-line arguments.", ['command'])
class QuoteInsertion extends Modifier {
    private static QuoteCharacter: Char = new String("\"") as Char;
    private static AcceptableSuccessionChars : RegExp = /^[a-z0-9\-\/]$/i;

    constructor(InputCommand: Token[], ExcludedTypes: string[], Probability: string) {
        super(InputCommand, ExcludedTypes, Probability);
    }

    GenerateOutput(): void {
        var This = this;
        this.InputCommandTokens.forEach(function (Token) {
            var NewTokenContent: Char[] = [];
            var previousQuote = false;

            let content = Token.GetContent();
            content.forEach((char, index) => {
                let nextChar = index + 1 < content.length ? content[index + 1] : "";

                // Add current char to result string
                NewTokenContent.push(char);

                if (!This.ExcludedTypes.includes(Token.GetType()) && Modifier.CoinFlip(This.Probability)
                    && previousQuote == false
                    && (!Modifier.QuoteChars.some(x => x == content[0]) || (index > 0 && (index < content.length - 1)))
                    && QuoteInsertion.AcceptableSuccessionChars.test(char.toString()) && (nextChar=="" || QuoteInsertion.AcceptableSuccessionChars.test(nextChar.toString()))
                ) {
                    NewTokenContent.push(QuoteInsertion.QuoteCharacter);
                    previousQuote = Modifier.QuoteChars.some(x => x == char);
                } else
                    previousQuote = false;
            });

            // Check if there are unbalanced quotes
            if (NewTokenContent.filter(x => x == QuoteInsertion.QuoteCharacter).length % 2 != 0) {
                NewTokenContent.splice(NewTokenContent.lastIndexOf(QuoteInsertion.QuoteCharacter), 1)
                // if (previousQuote) // If the last char was a quote, simply remove it
                //     NewTokenContent.pop();
                // else // If not:
                //     NewTokenContent.push(QuoteInsertion.QuoteCharacter); // If not, simply add a quote at the end of the string
            }

            // Edge case: Check if we added a quote after a value char
            if (NewTokenContent[NewTokenContent.length - 1] == QuoteInsertion.QuoteCharacter && Modifier.ValueChars.includes(NewTokenContent[NewTokenContent.length - 2].toString())) {
                NewTokenContent.pop(); // Remove the final quote (leaving it may cause issues)
                NewTokenContent = NewTokenContent.filter((_, i) => i != NewTokenContent.lastIndexOf(QuoteInsertion.QuoteCharacter)) //Also remove the right-most quote character to balance the number of quotes out again
            }

            Token.SetContent(NewTokenContent);
        });
    }
}

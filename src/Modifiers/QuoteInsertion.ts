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

                if (!This.ExcludedTypes.includes(Token.GetType()) && !Modifier.QuoteChars.some(x=> x==Token.GetStringContent()[0]) && Modifier.CoinFlip(This.Probability) && previousQuote == false) {
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

            // Check if there are unbalanced quotes
            if (i % 2 != 0){
                if (previousQuote) // If the last char was a quote, simply remove it
                    NewTokenContent.pop();
                else // If not:
                    NewTokenContent.push(QuoteInsertion.QuoteCharacter); // If not, simply add a quote at the end of the string
            }

            // Edge case: Check if we added a quote after a value char
            if(NewTokenContent[NewTokenContent.length-1] == QuoteInsertion.QuoteCharacter && Modifier.ValueChars.includes(NewTokenContent[NewTokenContent.length-2].toString()))
            {
                NewTokenContent.pop(); // Remove the final quote (leaving it may cause issues)
                NewTokenContent = NewTokenContent.filter((_, i) => i!=NewTokenContent.lastIndexOf(QuoteInsertion.QuoteCharacter)) //Also remove the right-most quote character to balance the number of quotes out again
            }

            Token.SetContent(NewTokenContent);
        });
    }
}

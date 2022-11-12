class CharacterInsertion extends Modifier {
    private CharacterInsertRange: Char[];
    private Probability: number;

    constructor(InputCommand: Token[], ExcludedTypes: string[], Probability: string, Characters: string) {
        super(InputCommand, ExcludedTypes);

        this.Probability = Modifier.ParseProbability(Probability);

        // Parse character ranges
        if (Characters == null || Characters.length == 0)
            throw Error(`Missing CharacterRange`);

        this.CharacterInsertRange = Characters.split('').map(x => x as String as Char);
    }

    GenerateOutput(): void {
        var This = this;
        this.InputCommandTokens.forEach(function (Token: Token) {
            var NewTokenContent: Char[] = [];
            Token.GetContent().forEach(char => {
                // Add current char to result string
                NewTokenContent.push(char);

                // Ensure (a) char is not read-only
                //        (b) probability tells us we will insert a char from the range
                var i = 0;
                if (!This.ExcludedTypes.includes(Token.GetType()) && This.CoinFlip(This.Probability))
                    do {
                        NewTokenContent.push(Modifier.ChooseRandom(This.CharacterInsertRange));
                        i++;
                    } while (This.CoinFlip(This.Probability * (0.9 ** i)));
            });

            Token.SetContent(NewTokenContent);
        });
    }
}

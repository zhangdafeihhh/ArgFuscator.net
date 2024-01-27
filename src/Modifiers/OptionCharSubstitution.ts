@Modifier.AddArgument("OutputOptionChars", "text", "Possible option chars", "All possible option chars here, without separator")
@Modifier.Register("Option Char Substitution","Replace option characters, such as '/' or '-' with acceptable alternatives.",  ['command', 'path', 'url', 'value'])
class OptionCharSubstitution extends Modifier {
    private OutputOptionChars: Char[];

    constructor(InputCommand: Token[], ExcludedTypes: string[], Probability: string, OutputOptionChars: string | null) {
        super(InputCommand, ExcludedTypes, Probability);
        if (OutputOptionChars == null || OutputOptionChars.length == 0)
            throw Error(`Unexpected OutputOptionChars length (expecting at least 1, found ${OutputOptionChars?.length})`);

        this.OutputOptionChars = OutputOptionChars.split('').map(x => x as String as Char);
    }

    GenerateOutput(): void {
        var This = this;
        this.InputCommandTokens.forEach(Token => {
            var NewTokenContent: Char[] = Token.GetContent();

            if (!This.ExcludedTypes.includes(Token.GetType()) && This.OutputOptionChars.some(x => x == (NewTokenContent[0] as string)) && Modifier.CoinFlip(This.Probability)){
                NewTokenContent[0] = Modifier.ChooseRandom(This.OutputOptionChars.filter(x => x !== NewTokenContent[0]));
                Token.SetContent(NewTokenContent);
            }
        });
    }
}

@Modifier.AddArgument("ProvidedOptionChar", "text", "Used Option Char", "Single option char here")
@Modifier.AddArgument("OutputOptionChars", "text", "Possible option chars", "All alternative option chars here, without separator")
@Modifier.Register("Option Char Substitution","Replace option characters, such as '/' or '-' with acceptable alternatives.",  ['command', 'path', 'url'])
class OptionCharSubstitution extends Modifier {
    private ProvidedOptionChar: Char;
    private OutputOptionChars: Char[];

    constructor(InputCommand: Token[], ExcludedTypes: string[], Probability: string, ProvidedOptionChar: string | null, OutputOptionChars: string | null) {
        super(InputCommand, ExcludedTypes, Probability);
        if (ProvidedOptionChar?.length != 1)
            throw Error(`Unexpected ProvidedOptionChar length (expecting 1, found ${ProvidedOptionChar?.length})`);
        if (OutputOptionChars == null || OutputOptionChars.length == 0)
            throw Error(`Unexpected OutputOptionChars length (expecting at least 1, found ${OutputOptionChars?.length})`);

        this.ProvidedOptionChar = ProvidedOptionChar as String as Char;
        this.OutputOptionChars = OutputOptionChars.split('').map(x => x as String as Char);
    }

    GenerateOutput(): void {
        var This = this;
        this.InputCommandTokens.forEach(Token => {
            var NewTokenContent: Char[] = Token.GetContent();

            if (!This.ExcludedTypes.includes(Token.GetType()) && NewTokenContent[0] == This.ProvidedOptionChar && Modifier.CoinFlip(This.Probability)){
                NewTokenContent[0] = Modifier.ChooseRandom(This.OutputOptionChars);
                Token.SetContent(NewTokenContent);
            }
        });
    }
}

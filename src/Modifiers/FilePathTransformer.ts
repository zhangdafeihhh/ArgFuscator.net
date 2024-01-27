
@Modifier.AddArgument("PathTraversal", "checkbox", "Path traversal", "")
@Modifier.AddArgument("SubstituteSlashes", "checkbox", "Transform slashes", "")
@Modifier.AddArgument("ExtraSlashes", "checkbox", "Extra slashes", "")
@Modifier.Register("File Path Transformer", "Change the format in which file paths are represented.", ['command', 'argument', 'url', 'value'])
class FilePathTransformer extends Modifier {

    private PathTraversal: boolean;
    private SubstituteSlashes: boolean;
    private ExtraSlashes: boolean;
    private readonly Keywords: string[] = ["debug", "system32", "compile", "exe", "temp", "find"];

    constructor(InputCommand: Token[], ExcludedTypes: string[], Probability: string, PathTraversal: boolean, SubstituteSlashes: boolean, ExtraSlashes: boolean) {
        super(InputCommand, ExcludedTypes, Probability);

        this.PathTraversal = PathTraversal;
        this.SubstituteSlashes = SubstituteSlashes;
        this.ExtraSlashes = ExtraSlashes;
    }

    GenerateOutput(): void {
        var This = this;
        this.InputCommandTokens.forEach(Token => {
            var NewTokenContent: string = Token.GetStringContent();

            if (!This.ExcludedTypes.includes(Token.GetType())) {
                // Path Traversal
                if (This.PathTraversal) {
                    NewTokenContent = NewTokenContent.replace(/([^\\/])([\\/])([^\\/])/g, (match, a, b, c) => {
                        let repeats = b;
                        let i = 0;
                        let options = This.Keywords.map(x => `${x}${b}..${b}`)
                        options.push(`.${b}`)
                        do {
                            repeats += Modifier.ChooseRandom(options);
                            i++;
                        } while (Modifier.CoinFlip(This.Probability * (0.9 ** i)));
                        return Modifier.CoinFlip(This.Probability) ? `${a}${repeats}${c}` : match;
                    });
                }

                // Substitute Slashes
                let tmp_tokencontent = NewTokenContent.split('');
                NewTokenContent = '';
                tmp_tokencontent.forEach(Char => {
                    if (This.SubstituteSlashes && Char.match(/[/\\]/) && Modifier.CoinFlip(This.Probability))
                        Char = Char == "\\" ? "/" : "\\";
                    NewTokenContent += Char;
                });

                // Extra Slashes
                if (This.ExtraSlashes && Modifier.CoinFlip(This.Probability)) {
                    NewTokenContent = NewTokenContent.replace(/([^\\/])([\\/])([^\\/])/g, (match, a, b, c) => {
                        let repeats = b;
                        let i = 0;
                        do {
                            repeats += b;
                            i++;
                        } while (Modifier.CoinFlip(This.Probability * (0.9 ** i)));
                        return Modifier.CoinFlip(This.Probability) ? `${a}${repeats}${c}` : match;
                    });
                }

                Token.SetContent(NewTokenContent.split(""));
            }
        });
    }
}

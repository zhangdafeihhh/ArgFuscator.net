@Modifier.AddArgument("SedStatements", "textarea", "Sed statements", "Sed replacement statements, one per line")
@Modifier.Register("Sed replacements", "Apply a sed-style replace operation (on token-level).", ['command', 'path','url'])
class Sed extends Modifier {
    private readonly SedStatements: SedStatement[];

    constructor(InputCommand: Token[], ExcludedTypes: string[], Probability: string, SedStatements: string) {
        super(InputCommand, ExcludedTypes, Probability);
        this.SedStatements = [];
        if (!SedStatements)
            throw Error("No sed statements string provided")


        SedStatements.split('\n').forEach(x => {
            try {
                if (x) this.SedStatements.push(new SedStatement(x))
            } catch {
                throw Error(`Sed '${x}' could not be compiled.`)
            }
        })

    }

    GenerateOutput(): void {
        let This = this;
        this.InputCommandTokens.forEach(Token => {
            var NewTokenContent: string = Token.GetStringContent();

            if (!This.ExcludedTypes.includes(Token.GetType())) {
                let matches = this.SedStatements.filter(x => x.StringIndex(NewTokenContent) >= 0);


                matches.forEach(match => {
                    let instance = match.StringIndex(NewTokenContent);
                    while (instance >= 0) {
                        let replacement = Modifier.ChooseRandom(match.Replace);
                        if (Modifier.CoinFlip(this.Probability)) {
                            NewTokenContent = NewTokenContent.substring(0, instance) + replacement + NewTokenContent.substring(instance + match.Find.length);
                        }
                        instance = NewTokenContent.indexOf(match.Find, instance + replacement.length + 1);
                    }

                });
                Token.SetContent(NewTokenContent.split(""))
            }
        });
    }
}

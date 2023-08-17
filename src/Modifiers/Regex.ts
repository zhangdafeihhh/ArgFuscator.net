@Modifier.AddArgument("RegexMatch", "text", "Regex Match", "The regex string to find")
@Modifier.AddArgument("RegexReplace", "text", "Regex Replace", "The replacement string")
@Modifier.AddArgument("CaseSensitive", "checkbox", "Case sensitive", "")
@Modifier.Register("Regex", "Apply a regex-replace operation (on token-level).", ['command'])
class Regex extends Modifier {
    private readonly RegexMatch: RegExp;
    private readonly RegexReplace: string;
    constructor(InputCommand: Token[], ExcludedTypes: string[], Probability: string, RegexMatch: string, RegexReplace: string, CaseSensitive: boolean) {
        super(InputCommand, ExcludedTypes, Probability);
        if (!RegexMatch)
            throw Error("No regex string provided")

        try {
            this.RegexMatch = new RegExp(RegexMatch, CaseSensitive ? "" : "i");
        } catch {
            throw Error("Regex could not be compiled.")
        }
        this.RegexReplace = RegexReplace;
    }

    GenerateOutput(): void {
        let This = this;
        this.InputCommandTokens.forEach(Token => {
            var NewTokenContent: string = Token.GetStringContent();

            if (!This.ExcludedTypes.includes(Token.GetType()) && Modifier.CoinFlip(this.Probability) && NewTokenContent.match(this.RegexMatch)) {
                let RexReplace = this.RegexReplace.replace(new RegExp('\\$(\\d+)\\[(\\d+):(\\d+(?:-(?:\\d+)?)?)\\]'), (x, a, b, c) => {
                    let match = NewTokenContent.match(this.RegexMatch)[a];
                    if (c.indexOf('-') >= 0) {
                        let ids = c.split('-')
                        if (!ids[1]) ids[1] = match.length;
                        let choices = Array.from(new Array(parseInt(ids[1])), (x, i) => i + parseInt(ids[0]));
                        c = Modifier.ChooseRandom(choices)
                    }
                    return match.substring(b, c)
                })
                NewTokenContent = NewTokenContent.replace(this.RegexMatch, RexReplace)
            }
            Token.SetContent(NewTokenContent.split(""))
        })
    }
}

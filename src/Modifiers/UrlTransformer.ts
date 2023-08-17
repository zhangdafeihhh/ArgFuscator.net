@Modifier.AddArgument("LeaveOutProtocol", "checkbox", "Omit Protocol", "")
@Modifier.AddArgument("SubstituteSlashes", "checkbox", "Transform Slashes", "")
@Modifier.AddArgument("IpToHex", "checkbox", "Alternate IP Form", "")
@Modifier.Register("URL Transformer", "Change the format in which URLs are represented.", ['command', 'argument', 'path'])
class UrlTransformer extends Modifier {
    private LeaveOutProtocol: boolean;
    private SubstituteSlashes: boolean;
    private IpToHex: boolean;

    constructor(InputCommand: Token[], ExcludedTypes: string[], Probability: string, LeaveOutProtocol: boolean, SubstituteSlashes: boolean, IpToHex: boolean) {
        super(InputCommand, ExcludedTypes, Probability);

        this.Probability = Modifier.ParseProbability(Probability);

        this.LeaveOutProtocol = LeaveOutProtocol;
        this.SubstituteSlashes = SubstituteSlashes;
        this.IpToHex = IpToHex;
    }

    GenerateOutput(): void {
        var This = this;
        this.InputCommandTokens.forEach(Token => {
            var NewTokenContent: string = Token.GetStringContent();

            if (!This.ExcludedTypes.includes(Token.GetType())) {
                // Leave out protocol
                if (this.LeaveOutProtocol && Modifier.CoinFlip(this.Probability))
                    NewTokenContent = NewTokenContent.replace(/\w+:\/\//, "://");

                // Substitute Slashes
                let tmp_tokencontent = NewTokenContent.split('');
                NewTokenContent = '';
                tmp_tokencontent.forEach(Char => {
                    if (this.SubstituteSlashes && Char == "/" && Modifier.CoinFlip(this.Probability))
                        Char = "\\";
                    NewTokenContent += Char;
                });

                // IP Transform
                if (this.IpToHex && Modifier.CoinFlip(this.Probability)) {
                    let IpAddress = NewTokenContent.match('(?:[0-9]{1,3}\.){3}[0-9]{1,3}')
                    if (IpAddress != null && IpAddress.length > 0) {
                        let Decimals = IpAddress[0].split('.').map(Decimal => Number.parseInt(Decimal));
                        let Decimal = Decimals[3] + Decimals[2] * 256 + Decimals[1] * (256 ** 2) + Decimals[0] * (256 ** 3);
                        if (Modifier.CoinFlip(0.5))
                            NewTokenContent = NewTokenContent.replace(IpAddress[0], Decimal.toString(10));
                        else
                            NewTokenContent = NewTokenContent.replace(IpAddress[0], "0x" + Decimal.toString(16));
                    } else
                        console.warn("No valid IPv4 IP Address could be found.");
                }

                Token.SetContent(NewTokenContent.split(""));
            }
        });
    }
}

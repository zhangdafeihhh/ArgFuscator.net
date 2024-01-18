function TokenEquals(array1: Token, array2: Token): boolean {
    return array1.GetContent().length === array1.GetContent().length && array1.GetContent().every(function (value, index) { return CharEquals(value, array1.GetContent()[index]); })
}

function CharEquals(char1: Char, char2: Char): boolean {
    return char1.toString() == char2.toString();
}

class ModifierDefinition {
    public Name: string;
    public Description: string;
    public DefaultExcludedTypes: string[];
    public Arguments: ModifierArgumentsDefinition[] = [];
    public Function: Function;
    public constructor(init?: Partial<ModifierDefinition>) {
        Object.assign(this, init);
    }
}

class ModifierArgumentsDefinition {
    public InternalName: string;
    public PublicName: string;
    public Description: string;
    public Type: string;
    public constructor(init?: Partial<ModifierArgumentsDefinition>) {
        Object.assign(this, init);
    }
}

abstract class Modifier {
    protected InputCommandTokens: Token[] = [];
    protected ExcludedTypes: string[] = ['disabled'];
    protected Probability: number;

    private static SeparationChar: Char = ' ' as String as Char;
    private static QuoteChars: Char[] = ['"' as String as Char, "'" as String as Char];

    constructor(InputCommand: Token[], ExcludedTypes: string[], Probability: string) {
        // Parse inputs
        this.InputCommandTokens = InputCommand
        this.ExcludedTypes.push(...ExcludedTypes);
        this.Probability = Modifier.ParseProbability(Probability);
    }

    protected static CoinFlip(probability: number): boolean {
        return Math.random() > 1 - probability;
    }

    protected static ChooseRandom<T>(options: Array<T>): T {
        return options[Math.floor(Math.random() * options.length)];
    }

    public static CommandTokenise(InputCommand: string, FormatPicker: HTMLMenuElement): Token[] {
        if (InputCommand == null) return null;
        var InQuote: Char | null = null;
        var Tokens: Token[] = [];
        var TokenContent: Char[] = [];
        for (var i = 0; i < InputCommand.length; i++) {
            let Char: Char = new String(InputCommand[i]) as Char;
            if (InQuote == null && Char == this.SeparationChar) {
                if (Token.length > 0)
                    Tokens.push(new Token(TokenContent));
                TokenContent = [] as Char[];
            } else {
                if (InQuote != null && Char.toString() == InQuote?.toString())
                    InQuote = null;
                else if (InQuote == null && this.QuoteChars.some(x => x == Char))
                    InQuote = Char;

                TokenContent.push(Char);
            }
        }
        if (Token?.length > 0)
            Tokens.push(new Token(TokenContent));

        // Find matching template, if available
        Tokens[0].SetType("command");
        //if (FormatPicker && FormatPicker.children[1].dataset['active'] != 'true')
        {
            let i = 0;
            let found = false;
            let token = Tokens[0].GetStringContent();

            if (token.toLowerCase() == 'cmd.exe' || token.toLowerCase() == 'cmd') {
                let tokenIndex = 0;
                Tokens.forEach(x => { if (x.GetStringContent().match(/^\/c$/i)) tokenIndex = i++; else tokenIndex++; })
                if (tokenIndex > 0 && tokenIndex + 1 < Tokens.length) {
                    logUserError("pattern-cmd", '`cmd.exe` requires special obfuscation - please checkout the Invoke-Dosfuscation project for this! Below are the results for obfuscating the \'inner\' command.');
                    if (Tokens[tokenIndex + 1].GetContent()[0] == '"') { // Argument is quoted
                        let command = Tokens[tokenIndex + 1].GetStringContent()
                        return Modifier.CommandTokenise(command.slice(1, command.length - 1), FormatPicker)
                    }
                    else // Argument is unquoted
                        return Modifier.CommandTokenise(Tokens.slice(tokenIndex + 1).map(x => x.GetStringContent()).join(" "), FormatPicker)
                } else {
                    logUserError("pattern-cmd-2", '`cmd.exe` requires special obfuscation - please checkout the Invoke-Dosfuscation project for this!');
                }
            }

            FormatPicker.childNodes.forEach(x => {
                if (x.textContent.toLowerCase() == token.toLowerCase() || x.textContent.toLowerCase() == token.toLowerCase() + ".exe") {
                    found = true;
                    x.dispatchEvent(new Event("click"));
                }
                i++;
            });
            if (!found){
                // Special cases
                if (token.toLowerCase() == 'cmd.exe' || token.toLowerCase() == 'cmd')
                    return;
                if (token.toLowerCase() == 'powershell.exe' || token.toLowerCase() == 'powershell' || token.toLowerCase() == 'pwsh.exe' || token.toLowerCase() == 'pwsh')
                    logUserError("pattern-cmd", 'PowerShell requires special obfuscation that goes beyond the scope of this project - please checkout the <a href="https://github.com/danielbohannon/Invoke-DOSfuscation" target="_blank">Invoke-DOSfuscation project</a> for this!', true);
                else
                    logUserError("pattern-unknown", `It looks like this project is not aware of obfuscation options for \`${token}\`! Create your own using the options panel below.`);
            }
        }
        Tokens.slice(1).forEach(x => {
            let TokenText = x.GetStringContent();
            let _TokenText = TokenText.replace(/(['"])(.*?)\1/g, '$2') //Remove any surrounding quotes
            if (_TokenText.match(/^(?:\\\\[^\\]+|[a-zA-Z]:|\.[\\/])((?:\\[^\\]+)+\\)?([^<>:]*)$/) || _TokenText.match(/^[^<>:]+\.[a-zA-Z0-9]{2,4}$/)) x.SetType('path'); // Windows file path format
            if (_TokenText.match(/^(HKLM|HKCC|HKCR|HKCU|HKU|HKEY_(LOCAL_MACHINE|CURRENT_CONFIG|CLASSES_ROOT|CURRENT_USER|USERS))\\?/i)) x.SetType('disabled'); // Windows Registry


            if (_TokenText.startsWith('http:') || _TokenText.startsWith('https:')) x.SetType('url');
        });
        return Tokens;
    }

    protected static ParseProbability(Probability: string): number {
        let ReturnProbability: number;
        // Parse probability
        if (Probability == null) ReturnProbability = 0.1;
        ReturnProbability = Number(Probability);
        if (ReturnProbability < 0 || ReturnProbability > 1)
            throw Error(`Unexpected Probability (expecting 0<=x<=1, found x=${ReturnProbability})`);
        return ReturnProbability;
    }

    abstract GenerateOutput(): void;

    private static Implementations: Record<string, ModifierDefinition> = {};

    public static Register = (Name: string, Description: string, DefaultExcludedTypes: string[]) => {
        return (target: Function) => {
            Modifier.Implementations[target.name] = new ModifierDefinition({ Name: Name, Description: Description, DefaultExcludedTypes: DefaultExcludedTypes, Function: target });
        }
    }

    public static AddArgument = (name: string, type: string, readableName: string, description: string) => {
        return (target: Function) => {
            if (!(target.name in Modifier.Implementations))
                throw Error(`Unexpected argument declaration for modifier ${target.name}`)
            let obj = Modifier.Implementations[target.name]
            if (obj.Function.toString().split('\n')[0].indexOf(name) <= -1) {
                throw Error(`Unexpected argument declaration for non-existing property ${name} on modifier ${target.name}`)
            }

            obj.Arguments.unshift(new ModifierArgumentsDefinition({ InternalName: name, Type: type, PublicName: readableName, Description: description }));
        }
    }

    public static GetAllModifiers(): Record<string, ModifierDefinition> {
        return Modifier.Implementations;
    }
}

type Constructor<T> = {
    new(...args: any[]): T;
    readonly prototype: T;
    name: string;
}

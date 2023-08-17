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
    public constructor(init?:Partial<ModifierDefinition>) {
        Object.assign(this, init);
    }
}

class ModifierArgumentsDefinition {
    public InternalName: string;
    public PublicName: string;
    public Description: string;
    public Type: string;
    public constructor(init?:Partial<ModifierArgumentsDefinition>) {
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

        // this.Arguments = [];

        // Mark ignored tokens as read-only
        //var i = 0;
        //this.InputCommandTokens.forEach(token => { token.ReadOnly = IgnoredTokens.indexOf(i) >= 0; i++; });
    }

    protected static CoinFlip(probability: number): boolean {
        return Math.random() > 1 - probability;
    }

    protected static ChooseRandom<T>(options: Array<T>): T {
        return options[Math.floor(Math.random() * options.length)];
    }

    public static CommandTokenise(InputCommand: string): Token[] {
        if(InputCommand == null) return null;
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

        // Guess some command types
        Tokens[0].SetType("command");
        Tokens.forEach(x => { let TokenText = x.GetStringContent();
            let _TokenText = TokenText.replace(/(['"])(.*?)\1/g, '$2') //Remove any surrounding quotes
            if(_TokenText.match(/^(?:\\\\[^\\]+|[a-zA-Z]:)((?:\\[^\\]+)+\\)?([^<>:]*)$/) || _TokenText.match(/^[^<>:]+\.[a-zA-Z0-9]{2,4}$/)) x.SetType('path');

            if(_TokenText.startsWith('http:') || _TokenText.startsWith('https:')) x.SetType('url');
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
            Modifier.Implementations[target.name] = new ModifierDefinition({ Name:Name, Description: Description, DefaultExcludedTypes: DefaultExcludedTypes, Function:target});
        }
      }

    public static AddArgument = (name: string, type: string, readableName: string, description: string) => {
        return (target: Function) => {
            if(!(target.name in Modifier.Implementations))
                throw Error(`Unexpected argument declaration for modifier ${target.name}`)
            let obj = Modifier.Implementations[target.name]
            if(obj.Function.toString().split('\n')[0].indexOf(name) <= -1){
                console.warn(obj.Function.toString().split('\n')[0])
                throw Error(`Unexpected argument declaration for non-existing property ${name} on modifier ${target.name}`)
            }

            obj.Arguments.unshift(new ModifierArgumentsDefinition({InternalName:name, Type:type, PublicName:readableName, Description:description}));
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

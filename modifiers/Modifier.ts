type Char = String & { read_only: boolean };

abstract class Modifier {
    private InputCommand: string;
    protected InputCommandChars: Char[] = [];
    protected SeparationChar: Char = ' ' as String as Char;

    constructor(InputCommand: string, IgnoreTokens: string) {
        this.InputCommand = InputCommand;

        let IgnoredTokens: number[] = IgnoreTokens.split(',').map(TokenNumber => Number(TokenNumber));
        let Tokens = this.InputCommandTokenise();
        for (var i = 0; i < Tokens.length; i++) {
            let Chars = Tokens[i].split('').map(function (x) { let y = new String(x) as Char; y.read_only = IgnoredTokens.indexOf(i) >= 0; return y }) as Char[];
            this.InputCommandChars.push(...Chars);
            if (i + 1 < Tokens.length) this.InputCommandChars.push(this.SeparationChar);
        }
    }

    protected CoinFlip(probability: number): boolean {
        return Math.random() > 1 - probability;
    }

    protected static ChooseRandom<T>(options: Array<T>): T {
        return options[Math.floor(Math.random() * options.length)];
    }

    private InputCommandTokenise(): string[] {
        return this.InputCommand.split(this.SeparationChar.toString());
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

    abstract GenerateOutput(): string;
}

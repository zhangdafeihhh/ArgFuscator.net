class RandomCase extends Modifier {
    private Probability: number;

    constructor(InputCommand: string, IgnoreTokens: string, Probability: string) {
        super(InputCommand, IgnoreTokens);
        this.Probability = Modifier.ParseProbability(Probability);
    }

    GenerateOutput(): string {
        let result = "";
        this.InputCommandChars.forEach(char => {
            if (char.read_only)
                result += char
            else
                result += this.CoinFlip(this.Probability) === true ? (char.toLowerCase() as String == char ? char.toUpperCase() : char.toLowerCase()) : char;
        })
        return result;
    }
}

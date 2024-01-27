@Modifier.AddArgument("ShorthandCommands", "textarea", "Commands that can be shortened", "Enter ALL commands that can be shortened here (comma separated).\ne.g. enter 'test' if 'tes', 'te', 't' are also accepted.\nShould there be commands that start with the same letters, this will be taken into account when generating alternatives.")
@Modifier.Register("Shorthands", "Allow certain commands to be shortened.", ['command', 'path', 'url'])
class Shorthands extends Modifier {
    private static readonly Separator = ",";
    private Substitutions : Map<string, string[]> = new Map();

    constructor(InputCommand: Token[], ExcludedTypes: string[], Probability: string, ShorthandCommands: string) {
        super(InputCommand, ExcludedTypes, Probability);

        try {
            let This = this;
            let commands = new Set(ShorthandCommands.split(Shorthands.Separator));
            commands.forEach(command => {
                let suffix = Modifier.ValueChars.includes(command.charAt(command.length-1)) ? command.charAt(command.length-1) : "";
                // Skip commands that cannot be shortened
                if (command.length <= 1) return;

                // Create a deduplicated array of commands that excludes the current one
                let commands_other_s = new Set(commands)
                commands_other_s.delete(command)
                let commands_other_a = Array.from(commands_other_s);

                // Find collisions with other commands
                for (var i = 1; i < command.length; i++) {
                    let command_shortened = command.substring(0, i);
                    if (commands_other_a.every(command_test => command_test.substring(0, i) !== command_shortened)){
                        // At this stage, we have found the minimum number of letters the command should have to be 'unique' amongst the provided commands
                        // Create a substitution entry with an array of possible options
                        This.Substitutions.set(command, Array.from({ length: command.length-i }, (_, j) => command.substring(0, i+j) + suffix));
                        break;
                    }
                }
            })
        }
        catch (e) {
            logUserError("shorthand-error", `Could not compute shorthand permutations.`, true);
            throw e;
        }

    }

    GenerateOutput(): void {
        var This = this;
        this.InputCommandTokens.forEach(Token => {
            if (!This.ExcludedTypes.includes(Token.GetType()) && Modifier.CoinFlip(This.Probability) && This.Substitutions.has(Token.GetStringContent()))
                Token.SetContent(Modifier.ChooseRandom(This.Substitutions.get(Token.GetStringContent())).split(""));
        });
    }
}

// interface CharacterRange {
//     start: string;
//     end: string;
// }

class CharacterInsertion extends Modifier {
    //private CharacterInsertRanges: CharacterRange[];
    private CharacterInsertRange: Char[];
    private Probability: number;

    constructor(InputCommand: string, IgnoreTokens: string, Probability: string, Characters: string) {
        super(InputCommand, IgnoreTokens);

        this.Probability = Modifier.ParseProbability(Probability);

        // Parse character ranges
        if (Characters == null || Characters.length == 0)
            throw Error(`Missing CharacterRange`);

        this.CharacterInsertRange = Characters.split('').map(x => x as String as Char);

        // if(CharacterRanges.length % 2 != 0)
        //     throw Error(`Unbalanced number of CharacterRanges arguments (expecting multiples of two, found ${CharacterRanges.length})`);

        // this.CharacterInsertRange = [];
        // this.CharacterInsertRanges = [];
        // for (let i = 0; i < CharacterRanges.length; i += 2) {
        //     let cr : CharacterRange = {start: CharacterRanges[i], end:CharacterRanges[i+1]}
        //     if(cr.start?.length != 1 || cr.end?.length != 1)
        //         throw Error(`Unexpected character start/end char length (expecting 1/1, found ${cr.start?.length}/${cr.end?.length})`);

        //     this.CharacterInsertRanges.push(cr);
        //     let length = cr.end.charCodeAt(0) - cr.start.charCodeAt(0);
        //     if(length < 0)
        //         throw Error(`End of character range comes before start`);
        //     for(let j=0; j <= length; j++)
        //         this.CharacterInsertRange.push(String.fromCharCode(cr.start.charCodeAt(0) + j));
        //}


    }

    GenerateOutput(): string {
        let result = "";
        let SeparationCharSeen = false;
        let FirstWordSeen = false;
        this.InputCommandChars.forEach(char => {
            // Ensure we don't modify the first token
            SeparationCharSeen = (char == this.SeparationChar);
            if (SeparationCharSeen)
                FirstWordSeen = true;

            // Add current char to result string
            result += char;

            // Ensure (a) Char is not read-only
            //        (b) we are past the first token
            //        (c) we are not dealing with a separation char
            //        (d) probability tells us we will insert a char from the range
            if (!char.read_only && FirstWordSeen && !SeparationCharSeen && this.CoinFlip(this.Probability))
                result += Modifier.ChooseRandom(this.CharacterInsertRange);
        });
        return result;
    }
}

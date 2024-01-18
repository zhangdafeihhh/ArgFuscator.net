class SedStatement {
    private static FORMAT = new RegExp("^s\/(?<Find>.+)\/(?<Replace>.+)\/(?<Options>[ig])?$")
    public Find: string;
    public Replace: string[];
    public CaseInsensitive: boolean;

    constructor(Statement: string) {
        let results = Statement.match(SedStatement.FORMAT);
        this.Find = results[1]; // The string to look for
        this.Replace = results[2].split('|'); // One can specify multiple replacement options, separated by a pipe character
        this.CaseInsensitive = (results[3] !== undefined && results[3].indexOf('i') >= 0) || false;
    }

    public StringIndex(Content: string) : number {
        if(this.CaseInsensitive)
            return Content.toUpperCase().indexOf(this.Find.toUpperCase());
        else
            return Content.indexOf(this.Find);
    }
}

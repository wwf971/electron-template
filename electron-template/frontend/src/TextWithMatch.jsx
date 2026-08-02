// renders text with every case-insensitive occurrence of textSearch highlighted
// (yellow background via the .search-match css class)
export default function TextWithMatch({ text, textSearch }) {
    const textMatch = textSearch.trim();
    if (textMatch === '') {
        return text;
    }
    const textLower = text.toLowerCase();
    const matchLower = textMatch.toLowerCase();
    const parts = [];
    let indexFrom = 0;
    while (true) {
        const indexMatch = textLower.indexOf(matchLower, indexFrom);
        if (indexMatch < 0) {
            parts.push(text.slice(indexFrom));
            break;
        }
        parts.push(text.slice(indexFrom, indexMatch));
        parts.push(
            <span key={indexMatch} className="search-match">
                {text.slice(indexMatch, indexMatch + matchLower.length)}
            </span>
        );
        indexFrom = indexMatch + matchLower.length;
    }
    return parts;
}

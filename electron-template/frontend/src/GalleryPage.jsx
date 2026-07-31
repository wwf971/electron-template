import { observer } from 'mobx-react-lite';
import { SearchIcon } from '@wwf971/react-comp-misc';

// Entry page: a gallery of the features supported by electron-utils.
// Search bar above, feature cards in a grid below. The substring matched by
// the search is highlighted inside each card.
const GalleryPage = observer(({ store }) => {
    return (
        <div className="gallery-page">
            <div className="gallery-header">
                <span className="gallery-title">ElectronUtils</span>
                <span className="gallery-subtitle">demos of features provided by electron-utils</span>
            </div>
            <div className="search-bar">
                <SearchIcon width={16} height={16} />
                <input
                    className="search-input"
                    placeholder="search features..."
                    value={store.searchText}
                    onChange={(event) => store.setSearchText(event.target.value)}
                />
            </div>
            <div className="gallery-hint">
                Click a feature to open it as a sub app. Inside a sub app, press <span className="key-name">Esc</span> to come back to this page.
            </div>
            <div className="gallery-grid">
                {store.subAppListFiltered.map((subApp) => (
                    <div
                        key={subApp.id}
                        className="subapp-card"
                        onClick={() => store.openSubApp(subApp.id)}
                    >
                        <span className="subapp-card-name">
                            <TextWithMatch text={subApp.name} textSearch={store.searchText} />
                        </span>
                        <span className="subapp-card-desc">
                            <TextWithMatch text={subApp.desc} textSearch={store.searchText} />
                        </span>
                    </div>
                ))}
                {store.subAppListFiltered.length === 0 && (
                    <div className="gallery-empty">no feature matches the search</div>
                )}
            </div>
        </div>
    );
});

export default GalleryPage;

// renders text with every case-insensitive occurrence of textSearch highlighted
function TextWithMatch({ text, textSearch }) {
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

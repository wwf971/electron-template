import { observer } from 'mobx-react-lite';
import { SearchIcon, InfoIconWithTooltip } from '@wwf971/react-comp-misc';
import TextWithMatch from './TextWithMatch.jsx';

const textTooltipBasic =
    'a basic app demonstrates one focused feature, usually provided by electron-utils';
const textTooltipCompound =
    'a compound app is closer to application level: it combines several features and owns its own data / config';

// Entry page: a gallery of the sub apps, grouped into two sections
// (basic apps and compound apps). Search bar above, cards in a grid below.
// The substring matched by the search is highlighted inside each card.
// The section title lines stay visible while searching.
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
            <GallerySection
                store={store}
                nameSection="basic app"
                textTooltip={textTooltipBasic}
                subAppListShown={store.subAppListBasicFiltered}
            />
            <GallerySection
                store={store}
                nameSection="compound app"
                textTooltip={textTooltipCompound}
                subAppListShown={store.subAppListCompoundFiltered}
            />
        </div>
    );
});

export default GalleryPage;

// section title row ("basic app [i] ------------") followed by the card grid
const GallerySection = observer(({ store, nameSection, textTooltip, subAppListShown }) => {
    return (
        <div className="gallery-section">
            <div className="gallery-section-title">
                <span className="gallery-section-name">{nameSection}</span>
                <InfoIconWithTooltip tooltipText={textTooltip} />
                <div className="gallery-section-line" />
            </div>
            <div className="gallery-grid">
                {subAppListShown.map((subApp) => (
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
                {subAppListShown.length === 0 && (
                    <div className="gallery-empty">no {nameSection} matches the search</div>
                )}
            </div>
        </div>
    );
});

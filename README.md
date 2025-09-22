# Digital Kholagy

Digital Kholagy is a multi-language Orthodox liturgical companion inspired by the Katamars app. It is built with Expo and React Native, and ships with a modular content pipeline for markdown-based prayers and liturgies.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template and provide your API.Bible key:
   ```bash
   cp .env.example .env
   ```
   The `API_BIBLE_KEY` value is injected into the Expo runtime via `app.config.ts` and consumed through `expo-constants`.
3. Generate the content map (re-run whenever you add or rename markdown files):
   ```bash
   npm run build:content
   ```
4. Launch the Expo development server:
   ```bash
   npm run start
   ```
5. Open the project in the Expo Go app, iOS simulator, Android emulator, or the web browser as needed.

## External Data Sources

- **API.Bible** is used for the Holy Bible screen. Requests require the API key mentioned above and are routed through `src/api/bible.ts`. Books, chapters, verses, and search responses are cached in AsyncStorage so previously viewed passages remain available offline.
- **Orthocal API** powers the liturgical calendar in `src/api/orthocal.ts`. Daily readings, feasts, and fast information are fetched for the selected date and cached to provide an offline history.
- Local markdown liturgy texts are wrapped by `src/api/liturgy.ts`, which ReaderScreen now consumes to keep markdown loading logic consistent with the network APIs.

## Navigation & Menu Updates

- Bottom tabs remain focused on Kholagy, Fractions, Prayers, and Settings. The Settings tab now opens the localized menu list from `src/screens/MenuScreen.tsx`.
- The side menu includes Bible and Calendar entries alongside existing resources (Agpeya, Synaxarium, Psalmody). Selecting Bible or Calendar pushes the new stack screens, while other items deep link into the appropriate tab.
- A global search context (`src/context/SearchContext.tsx`) keeps Bible, Calendar, and liturgy search results in sync across screens.

## Offline Caching

- Bible queries (books, chapters, verses, search results) persist in AsyncStorage for quick repeat access.
- Calendar responses cache per date for 12 hours, ensuring daily readings remain available even when offline.
- Liturgy scroll position bookmarks continue to save automatically; copy/share actions now surface quick toasts.

## Screenshots

Placeholder images for documentation (replace with actual captures when available):

- `docs/bible-screen.png` – Bible screen preview.
- `docs/calendar-screen.png` – Calendar screen preview.

## Project Structure

```
content/                # Markdown sources and catalog metadata
scripts/                # Utility scripts (content map generator)
src/                    # App logic, i18n, context providers
navigation/             # Navigation configuration
screens/                # Screen components (lists, reader, settings)
```

Key configuration files:
- `metro.config.js` – enables bundling markdown assets from the `content` directory.
- `app.json` – Expo application manifest.
- `src/contentMap.ts` – generated mapping of content keys to bundled assets.

## Adding New Content

1. Drop a markdown file under `content/<category>/` using the `name.lang.md` convention (e.g. `content/liturgies/basil.en.md`).
2. Update `content/catalog.json` with the new entry, titles, category, and available languages.
3. Run `npm run build:content` to regenerate `src/contentMap.ts` so the app can locate the new files.
4. Restart the Expo server if it is already running.

## Updating UI Translations

UI strings live in `src/i18n/index.ts`. To add or update translations:
1. Extend the `resources` object with new keys for each supported language (`en`, `ar`, `ru`).
2. For additional UI languages, add the language code to the `UILanguage` union, update the language detector, and register labels in `SettingsScreen`.
3. Restart the app (or reload the JS bundle) to pick up changes.

## Reader Features

- Automatic detection of available markdown files per language with English fallback.
- In-page search with simple highlighting, adjustable font scaling, and light/dark themes.
- Bookmarking of the last scroll position per text/language stored in AsyncStorage.
- RTL-aware layout toggled automatically for Arabic and Arabized Coptic content.

Enjoy building out the full Digital Kholagy prayer library!

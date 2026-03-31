# FastLang

Website: https://kenyoste.com/fastlang

FastLang is a Chrome extension that speeds up language selection in Google Translate by using one-letter shortcuts.
Instead of navigating language menus manually, you type a single letter and FastLang automatically selects the mapped language.

## Features

- **One-letter language shortcuts** (example: `i -> English`)
- **Custom delay per shortcut** (example: `500ms` or `0ms`)
- **Smart trigger behavior** to prevent accidental selection while typing
- **Active mappings panel** to view and manage current rules
- **Bilingual popup UI** (`TR` / `EN`)
- **Works only on Google Translate** (`https://translate.google.com/*`)

## How It Works

1. Open a language picker in Google Translate.
2. Type one shortcut letter in the language search input.
3. FastLang checks your saved mapping for that letter.
4. After the configured delay, it auto-selects the target language.
5. If you continue typing additional characters, the auto-selection is canceled.

## Default Mapping

- `i -> İngilizce (500ms)`

You can change this default and create unlimited custom mappings.

## Installation (Developer Mode)

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder.
5. Refresh `https://translate.google.com/`.
6. Click the FastLang icon and configure your mappings.

## Configuration

From the popup, you can:

- Add/update a mapping (`letter`, `language`, `delay`)
- Remove existing mappings
- Switch popup language (`TR` / `EN`)

## Permissions

- `storage`: Used to store user-defined mappings, delays, and UI language preference.
- Host scope `https://translate.google.com/*`: Required to run only on Google Translate pages for language auto-selection.

## Privacy

FastLang does **not** collect translation content, passwords, payment details, or personal sensitive data.
It stores only extension settings needed for shortcut behavior.

## License

MIT

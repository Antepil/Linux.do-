# Linux.do Stream Extension (Refactored)

Chrome extension for browsing Linux.do community topics in a side panel.

## Installation

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this folder
4. Click the extension icon to open the side panel

## Development

Reload after making changes:
1. Go to `chrome://extensions/`
2. Click the refresh icon on the extension card

## Project Structure

```
├── manifest.json           # Chrome extension manifest (Manifest V3)
├── background.js           # Service worker for API requests and notifications
├── content.js              # Content script for extracting page data
├── sidepanel.html          # Side panel UI
├── styles.css              # Apple HIG style CSS with theme support
├── icon*.png               # Extension icons
└── src/sidepanel/          # Modular side panel code
    ├── index.js            # Entry point
    ├── components/         # UI components (topic-list, settings, filter-bar)
    ├── services/           # API and notification services
    ├── state/              # Store pattern and storage
    ├── events/             # Event bus and refresh scheduling
    └── utils/              # Constants and formatters
```

## Features

- Side panel topic stream
- Auto-refresh with configurable intervals
- Category and keyword filtering
- Theme support (light/dark/system)
- Keyword notifications
- Trust level badges

## License

MIT

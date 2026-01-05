# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome extension for browsing Linux.do community topics in a side panel. Uses Manifest V3 with Side Panel API.

## Development

**Load in Chrome for testing:**
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this project folder
4. Click the extension icon to open the side panel

**Reload after changes:**
1. Go to `chrome://extensions/`
2. Click the refresh icon on the extension card, or
3. Reload the side panel page

## Architecture

```
src/sidepanel/
├── index.js           # Entry point, initializes all managers
├── components/
│   ├── topic-list.js  # Renders topic cards, handles read status, hover preview
│   ├── settings.js    # Settings panel UI and persistence
│   └── filter-bar.js  # Category/sort filter dropdowns
├── services/
│   ├── api.js         # chrome.runtime.sendMessage wrappers (fetch, badge, notification)
│   └── notifications.js # Keyword matching for push notifications
├── state/
│   ├── index.js       # Store pattern with reactive state
│   └── storage.js     # chrome.storage.local wrappers
├── events/
│   └── index.js       # Central event bus, refresh scheduling, auto-refresh timer
└── utils/
    ├── constants.js   # Default config, icons, category IDs
    └── formatter.js   # Time formatting, trust badge logic
```

## Key Integration Points

**Background Service Worker (`background.js`):**
- Handles `FETCH_API`, `UPDATE_BADGE`, `SHOW_NOTIFICATION` messages
- Makes cross-origin fetch requests to linux.do with credentials
- Reports topics as read via `topics/read` endpoint

**Chrome Storage Keys:**
- `config`: Appearance and behavior settings
- `userSettings`: Filter/sort preferences
- `readTopicIds`: Set of read topic IDs

**Theme System:**
- CSS variables in `styles.css` (`--bg-main`, `--text-primary`, etc.)
- `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)` overrides
- Theme set via `document.documentElement.setAttribute('data-theme', value)`

## Common Modifications

**Add new setting:**
1. Add to `DEFAULT_CONFIG` in `utils/constants.js`
2. Add UI element in `sidepanel.html`
3. Add handler in `components/settings.js`
4. Use in relevant component via `store.getConfig().settingName`

**Add new API endpoint:**
1. Add handler in `background.js` with message type
2. Add wrapper in `services/api.js`
3. Call from components via services

**Modify topic card appearance:**
- Structure: `topic-list.js` renders cards
- Styles: `.topic-item`, `.topic-title`, `.topic-meta` in `styles.css`
- Trust badges: `.trust-badge` with admin/l4/l3/l2/l1 classes

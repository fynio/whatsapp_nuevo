# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the project

```powershell
npm install      # first time only — downloads Chromium via puppeteer (~150MB)
npm start        # starts Express on http://localhost:3000
```

After starting, open `http://localhost:3000` in a browser to see the QR code and scan it with WhatsApp.

## Architecture

Single-file Express app (`server.js`) with three concerns:

1. **WhatsApp client** (`whatsapp-web.js` + `LocalAuth`) — runs a headless Chromium instance that connects to WhatsApp Web. Session data is persisted to `./session/` so the QR only needs to be scanned once.

2. **QR flow** — on first run (or after session expiry) the client emits a `qr` event; `server.js` converts it to a base64 PNG via `qrcode` and holds it in memory. The `GET /` page auto-refreshes every 30 s to show a fresh QR if needed.

3. **Express routes**
   - `GET /` — HTML page: shows loading spinner → QR code → connected status depending on client state
   - `GET /status` — JSON `{ connected, name, number }`
   - `GET /qr` — raw PNG image of the current QR (503 if not yet available, 200 JSON if already connected)

## Session persistence

`LocalAuth` stores Chromium profile data in `./session/`. Delete this folder to force a new QR scan. The folder is created automatically on first successful authentication.

## Key dependencies

| Package | Purpose |
|---|---|
| `whatsapp-web.js` | WhatsApp Web automation via Puppeteer |
| `express` | HTTP server |
| `qrcode` | Converts raw QR string to PNG/base64 |

## Notes

- `whatsapp-web.js` requires Puppeteer/Chromium. On Windows, Chromium is downloaded automatically during `npm install` (~150 MB).
- The Puppeteer flags in `server.js` (`--no-sandbox`, `--disable-gpu`, etc.) are needed for headless operation on most systems.
- WhatsApp may invalidate sessions after long inactivity or if WhatsApp Web is opened on another device simultaneously.

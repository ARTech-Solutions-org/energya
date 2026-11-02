# Energya Industries Photobooth

An English-only kiosk flow for Energya Industries: logo screensaver, live camera preview, countdown, framed capture, review, silent print, and QR download. The app performs only camera capture, frame composition, printing, and photo delivery.

## Project structure

- `artifacts/energya-photobooth/` — React/Vite kiosk application
- `artifacts/energya-photobooth/public/new_design/` — the provided Energya logo and frame, the only image assets used by the app
- `server/server.mjs` — local photo storage and mobile download page
- `start.bat` — Windows build, readiness wait, and Chrome kiosk launcher

## Run locally

```bash
pnpm install
pnpm --dir artifacts/energya-photobooth dev
```

For the full local photo server and production-like kiosk flow:

```bash
pnpm --dir artifacts/energya-photobooth build
node server/server.mjs
```

Open `http://localhost:3000`. On Windows, double-click `start.bat`; it installs from the lockfile, builds the kiosk, starts the server, waits for `/config.json` to return HTTP 200, then launches Chrome at `http://127.0.0.1:3000` with `--kiosk --kiosk-printing`.

## Configuration

Edit `artifacts/energya-photobooth/public/config.json` before building:

- **Camera:** set `camera.deviceId` to a `MediaDevices` device ID, or leave it blank for the default camera. Set `camera.width` and `camera.height` to the preferred capture resolution.
- **Countdown:** change `countdownSeconds` to the number of seconds shown before capture.
- **Paper size:** set `paperSize` to the configured printer paper. The included print stylesheet is 4×6 inch portrait with zero margins.
- **QR mode:** use `qrMode: "local"` and set `baseUrl` to the PC LAN URL, such as `http://192.168.1.20:3000`, when phones are on the same Wi-Fi. The QR opens `/photo/<id>` on the local server. `qrMode: "cloud"` is reserved for a configured public upload endpoint; no external upload is performed by this offline build.
- **Other settings:** `idleTimeoutSeconds`, `printEnabled`, and `soundEnabled` are configurable. The UI is English-only.

The local server stores each composed JPEG in `photos/`. The QR destination is a mobile-friendly page containing the Energya logo, a preview, and a large Download photo button. The direct image is available at `/photo/<id>/image`.

## Printer setup

Install the Windows printer driver, set the printer as default, and use 4×6 inch portrait paper. Chrome kiosk printing plus `--kiosk-printing` sends the print without a dialog. The print stylesheet outputs only the composed 4×6 framed image with zero margins.

## Staff controls and recovery

The first screen is a logo screensaver. Press **Open camera** to enter the camera screen. Long-press the Energya logo for three seconds to open the staff panel; a short tap or release before three seconds does nothing. Camera errors, photo-save/server errors, and inactivity timeouts show English recovery messaging and return to the screensaver automatically. The staff panel includes a test-print action and close control.

## Offline behavior

The production bundle has no external font, image, API, or CDN dependency. Fonts are bundled under `artifacts/energya-photobooth/public/fonts/`; the only image assets are the two files under `public/new_design/`.

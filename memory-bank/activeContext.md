# Active Context — brackets-and-symbols

**Last updated:** 2026-09-28  
**Focus:** Live glossary plus VS Code shortcut cheat sheet.

## Current state

- Static site, Tailwind CDN, no build. Theme in `localStorage` key `theme`.
- Pages: `index.html` (hub), `symbols.html` (glossary), `shortcuts.html` (121 shared commands).
- Shortcuts: official Windows and macOS chords, platform switch (`platform-mac` / `platform-win` / `platform-both`). Sheet is a 3-column grid, chord on the left, command on the right.
- Live: https://ukccatc.github.io/brackets-and-symbols/
- Deploy: push to `master` runs `.github/workflows/deploy.yml`. Last sheet deploy is `e0a9cae`.

## Open

- Redesign only if branding work is requested
- Do not invent a Linux column or list personal keybindings

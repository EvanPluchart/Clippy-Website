# Clippy Website

The official bilingual landing page for [Clippy](https://github.com/EvanPluchart/Clippy), a fast, local, open-source clipboard history app for macOS.

**Live website:** [clippy.evanpluchart.fr](https://clippy.evanpluchart.fr)

## Contents

- [Overview](#overview)
- [Run locally](#run-locally)
- [Validation](#validation)
- [Languages](#languages)
- [Release-aware install buttons](#release-aware-install-buttons)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

This is a dependency-free static website designed for fast loading, simple maintenance, and deployment on Vercel.

- French homepage at `/`
- English homepage at `/en`
- Responsive layouts from small phones to wide desktop screens
- Light and dark appearance support
- Reduced-motion support and keyboard-accessible navigation
- Strict production security headers
- No analytics, advertising, cookies, or third-party fonts

## Run locally

Requirements: Node.js 22 or later.

```bash
npm run dev
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Validation

```bash
npm run check
```

The validator checks page metadata, language declarations, local links, image alternatives, required assets, and accidental placeholder content. GitHub Actions runs the same command on every pull request and push to `main`.

## Languages

French and English pages are intentionally separate static documents. This keeps the content indexable, gives each language its own metadata, and lets visitors switch languages without JavaScript.

When editing product copy, keep `index.html` and `en.html` aligned.

## Release-aware install buttons

The direct-download button checks the latest public [Clippy GitHub release](https://github.com/EvanPluchart/Clippy/releases). It becomes active only when that release contains a `.dmg` asset.

The Homebrew command becomes copyable only when the public Cask exists at:

```text
EvanPluchart/homebrew-tap/Casks/clippy.rb
```

This prevents the website from presenting broken or unsafe installation paths before a signed and notarized release is available.

## Deployment

Production is deployed automatically from `main` on Vercel:

```text
https://clippy.evanpluchart.fr
```

`vercel.json` configures clean URLs, the `/fr` redirect, long-lived asset caching, and security headers. Pull requests are validated by GitHub Actions before they are merged.

## Contributing

Bug reports and focused pull requests are welcome. Please run `npm run check` before opening a pull request and verify both language versions when changing shared styles or behavior.

## License

[MIT](LICENSE) © Evan Pluchart

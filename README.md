# Echoes — v1.0.0

Echoes is a desktop-oriented music experience with a Liquid Glass interface. This repository currently contains the initial static web experience, download page, and Electron desktop shell. It does **not** yet contain a music player, Spotify or Firebase integration, global media shortcuts, background playback, low-latency audio, or offline music caching. These are future goals, not features of this release.

## Features in v1.0.0

- Responsive Liquid Glass homepage and download page, with reduced-motion support.
- Browser-only desktop download prompt with a locally stored dismissal preference.
- Electron shell with locally bundled static pages and external links opened in the browser.
- GitHub Actions builds Windows installers and macOS DMGs.

See [CHANGELOG.md](CHANGELOG.md) for the update log.

## Setup

Requires Node.js 22 and npm. Install and run the web app:

```sh
npm ci
npm run dev
```

Visit http://localhost:3000. `npm run build` exports the static site to `out/`; `npm run typecheck` and `npm run lint` check the source. Build the desktop package on its target OS with `npm run desktop:build` (Electron Builder may require platform-specific build tools). Outputs are in `dist/`.

## Releases

Pushes and published releases trigger `.github/workflows/build.yml` on Windows and macOS. Builds are uploaded as workflow artifacts; publishing a GitHub release also uploads them to that release. Create a `v1.0.0` GitHub release to make the Windows download link available; macOS downloads are listed on the latest release page. Builds are not code-signed or notarized, so operating systems may show security warnings. The release tag and package version should match when publishing.

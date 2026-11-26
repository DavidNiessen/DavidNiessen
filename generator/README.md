# Profile generator

Renders every element of the profile README as an animated SVG or GIF, dark and light. Nothing is static markdown text.

```bash
npm ci
npm run build:mock        # offline fixture data → dist/
npm run build             # live data (GITHUB_TOKEN / PROFILE_TOKEN, falls back to scraping)
npm run build -- --only=hero,stats --now=2026-12-31T23:00:00Z
npm test
```

`dist/preview.html` shows the whole README layout locally in both themes.

## How it fits together

- `src/data/` loads data in this order:
  - GitHub GraphQL first.
  - If that fails, the public contributions page plus the REST API.
  - Open-Meteo for the weather tile.
  - `--mock` uses deterministic fixtures instead of the network.
- `src/widgets/` holds one file per element. Each widget is `(ctx) => svg | gif`, built from hand-written SVG and CSS/SMIL animation.
- `src/lib/gif.ts` is a dependency-free GIF encoder (median-cut palette and LZW). Frames are SVGs rasterised with resvg.
- `src/readme.ts` writes the image-only README that points at the `output` branch.
- `assets/` holds the vendored fonts and brand icons (see `assets/LICENSES.md`).

The workflow `.github/workflows/profile.yml` runs every night at 02:17 UTC:

1. Rebuilds all assets from live data.
2. Force-pushes `dist/` to the `output` branch.
3. Commits `README.md` only when the layout or links changed.

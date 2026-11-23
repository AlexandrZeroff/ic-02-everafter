# Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Verification

Verify your own work with `astro build` and by reporting the errors it finds. Nothing else.

Do not drive the browser to click through the UI, test interactions, or confirm that a feature
behaves correctly — the user does that themselves. Use browser automation only when explicitly
asked for it.

## Starting a new project from this template

This repo is a blank starter. When asked to set it up for a new project, go through this list and
ask the user for any value you don't have — never invent a domain, name or brand color.

1. `package.json` — set `name`.
2. `astro.config.mjs` — replace `site: 'https://example.com'` with the real domain. Canonical
   URLs, `og:url`, `og:image`, the sitemap and `robots.txt` are all built from it.
3. `src/data/site.ts` — set `name`, `description` and `lang`. The layout reads its defaults from
   here; page titles render as `Page | Name`.
4. `src/assets/images/og-image.png` — replace the grey placeholder with the real 1200×630 share
   image. A page can override it with the `ogImage` prop on `Layout`.
5. `public/favicon.svg` and `public/favicon.ico` — replace the Astro defaults.
6. `src/styles/global.scss` — replace the color variables in `:root` with the project palette,
   and adjust `--container` and the typography classes to the design.
7. Font — add it through the Astro Fonts API (see below) and point `--font-sans` in
   `global.scss` at its CSS variable.

### Adding a local font

Put the `.woff2` files in `src/assets/fonts/`, register them in `astro.config.mjs`:

```js
import { defineConfig, fontProviders } from 'astro/config'

export default defineConfig({
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Inter',
      cssVariable: '--font-inter',
      options: {
        variants: [
          {
            weight: 400,
            style: 'normal',
            src: ['./src/assets/fonts/Inter-Regular.woff2'],
          },
          {
            weight: 700,
            style: 'normal',
            src: ['./src/assets/fonts/Inter-Bold.woff2'],
          },
        ],
      },
    },
  ],
})
```

then render `<Font cssVariable="--font-inter" preload={[{ weight: 400 }]} />` from `astro:assets`
in the `<head>` of `Layout.astro`, and set `--font-sans: var(--font-inter);` in `global.scss`.

## Project conventions

- Styles: SCSS. `rem()`, `em()` and the `fullhd` / `mobile` mixins from `src/styles/_functions.scss`
  are injected into every `<style lang="scss">` — do not import them manually.
- Layout scaling: the root font size follows the viewport (1440 design width, 375 on mobile,
  fixed 16px from 1920). Size things in `rem()` so they scale with it.
- Components: `src/components/atoms/` for small reusable pieces (one folder per atom),
  `src/components/sections/<page>/` for page sections, `sections/global/` for header, footer and
  anything shared across pages.
- Content: keep texts and lists in `src/data/`, not hard-coded in sections, so a CMS can replace
  the data source later without rewriting markup.
- Animations: import from `@/scripts/gsap` (never directly from `'gsap'`) inside a component
  `<script>`, so plugins are always registered.

## Images

An image used as a CSS background must go through `getImage()` from `astro:assets`. Do not write
a bare `url('@/assets/...')` in a style block: that path is handled by Vite, which only hashes and
copies the file — no webp conversion, no resizing, so the original weight ships to the browser.

Generate the URL in the frontmatter, hand it to the element as an inline custom property, and read
that property in the style block:

```astro
---
const bg = await getImage({ src: bgSrc, format: 'webp' })
---

<div class="banner" style={`--bg: url(${bg.src})`}></div>

<style lang="scss">
  .banner {
    background-image: var(--bg);
  }
</style>
```

Start with a single `--bg` even when only one image exists — swapping in a per-breakpoint variant
later then costs one line, with no change to the markup.

When the background does change per breakpoint, pass each variant as its own custom property and
switch which property the style block reads. Do not try to redefine `--bg` inside a media query:
an inline style wins over any rule in `<style>`, so override the property you _use_, not its value.

```astro
<div
  class="banner"
  style={`--bg: url(${bg.src}); --bg-mobile: url(${bgMobile.src})`}
></div>

<style lang="scss">
  .banner {
    background-image: var(--bg);

    @include mobile {
      background-image: var(--bg-mobile);
    }
  }
</style>
```

The browser downloads only the variant that actually applies — an unused custom property is just
text.

For `<picture>` with different crops per breakpoint, use `getImage()` per variant and write the
`<source>` tags by hand — `<Image />` renders its own `<img>` and cannot emit them.

## Code comments

Write code comments in English only, even when the conversation is in another language. Prefer no
comment at all: explain reasoning in the chat reply, not in the file. When a comment is genuinely
needed, keep it to the non-obvious "why".

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

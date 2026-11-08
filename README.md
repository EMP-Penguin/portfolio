# Hyukjoon John Lee — Portfolio & Thoughts

A bilingual personal portfolio and writing site for Hyukjoon John Lee. The site has four sections: Overview, Experience, Thoughts, and Contacts. It is statically generated and requires no visitor account or database.

## Run locally

Node.js 22 or newer is required. From this folder:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the local URL printed by Astro, normally `http://localhost:4321/portfolio/`. To check a production build:

```powershell
npm.cmd run check
npm.cmd run build
npm.cmd run preview
```

## Publish a post

1. Add a Markdown file under `src/content/posts/`. Its filename becomes its permanent URL, for example `field-notes.md` → `/portfolio/thoughts/field-notes/`.
2. Begin with the following fields. Write the post below the second `---` line.

```md
---
title: "A question I am exploring"
description: "One sentence for the list and search results."
date: 2026-09-27
category: "생각_thoughts"
language: en
draft: true
---

Your writing starts here.
```

3. Preview locally, check facts and links, then set `draft: false` and publish the change. Drafts are excluded from the built site and on-site search. Because the source repository is public, keep private drafts outside this repository.

Available categories are `외상_trauma`, `군사_military`, and `생각_thoughts`. Add a category in `src/data/categories.ts`; the post schema and filters read that same list. Posts keep their original language while the surrounding interface switches between English and Korean. Markdown supports headings, links, images, tables, lists, quotations, and footnotes. Place article images under `public/assets/` and reference them as `/portfolio/assets/filename.ext`.

The Thoughts page searches titles, summaries, and full text in both languages. Search and category selections are reflected in the URL so a filtered list can be shared.

## Sync the Naver Blog

The public posts from `blog.naver.com/heock_yi` are imported with their original Korean text, publication dates, source links, and Naver-hosted images. To refresh locally, run:

```powershell
npm.cmd run sync:blog
```

GitHub Actions refreshes the public RSS feed and the linked article pages once a day before building the site. Only posts exposed through the public RSS feed are synchronized. A post must be public and allow external sharing in Naver Blog settings. Imported posts use stable filenames under `src/content/posts/`; make edits to those originals on Naver so the next sync does not overwrite them.

## Update profile and assets

- `src/data/content.json` contains the verified education, awards, experience, contact data, and original translated source copy. Edit both language versions when changing a fact or official label.
- `src/pages/index.astro` contains the short Overview introduction and its English/Korean copy.
- `public/assets/Portrait-cutout.png` is the monochrome transparent cutout used on the site; the root `Portrait.jpg` and the rebuild kit preserve the source photograph.
- `public/assets/CV_Hyukjoon_John_Lee.pdf` is the downloadable CV. Check its public content before replacing it.
- `public/assets/portfolio-qr.png` and `.svg` point to `https://emp-penguin.github.io/portfolio/`. Regenerate them if the public URL changes.

## GitHub Pages

The site is configured for `https://emp-penguin.github.io/portfolio/` and its `/portfolio/` path. In the repository's **Settings → Pages**, select **GitHub Actions** as the source. The included workflow builds and deploys `dist/` on updates to the `main` branch. Verify the published pages, CV, and QR before sharing the link.

The previous root-level HTML, CSS, JavaScript, and local server files are retained as a reference to the earlier site; Astro uses the files in `src/` and `public/` for the current build.

## Astra rebuild kit

`astra-rebuild-kit/` contains the original assets, structured bilingual content, product/design/technical specifications, an acceptance checklist, and the reference implementation. The new site's blog and page structure follow the user's later instructions where they differ from the kit's earlier specification.

# Hyukjoon John Lee - Portfolio

Bilingual personal portfolio for Hyukjoon John Lee, a Republic of Korea Army officer and medical student focused on military medicine, trauma care, and AI for healthcare and defense.

## Features

- Korean and English language switch with saved preference
- Updated education, awards, clinical experience, leadership, activities, and language skills
- LinkedIn and downloadable CV links
- Responsive desktop and mobile layout
- Shareable QR code for the public portfolio URL

## Run locally

Node.js is required. In PowerShell, run:

```powershell
npm.cmd run dev
```

Then open:

```text
http://127.0.0.1:8000
```

Keep the terminal window open while viewing the site. Because the project is static, `index.html` can also be opened directly in a browser.

## Public URL

The QR code points to the expected GitHub Pages URL:

```text
https://emp-penguin.github.io/portfolio/
```

Enable GitHub Pages from the repository settings using the `main` branch and repository root before distributing the QR code.

## Files

- `index.html`: Page structure and bilingual content bindings
- `style.css`: Visual design and responsive layout
- `script.js`: Language switching, persistence, and reveal effects
- `local-server.js`: Dependency-free local development server
- `assets/CV_Hyukjoon_John_Lee.pdf`: Downloadable CV
- `assets/portfolio-qr.png`: QR code for the public page

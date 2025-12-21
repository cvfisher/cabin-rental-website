# Cabin Rental Website (Vite)

This is a Vite-powered version of the original static site, keeping the layout and styling intact while improving structure, accessibility, and maintainability.

## Tech

- Vite (multi-page: `index.html` + `cabins.html`)
- Handlebars partials for reusable HTML sections (`src/partials`)
- GSAP via npm

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
npm run preview
```

## Project structure

- `index.html`, `cabins.html`: page entry points (Vite multi-page)
- `src/partials/`: reusable markup (header, cabin card, testimonial)
- `src/styles/`: existing CSS moved here (paths updated to `/images/...`)
- `src/main.js`: existing JS refactored into clean modules + a11y improvements
- `public/images/`: all images (stable URLs like `/images/...`)

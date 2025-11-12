
# SmartShop – Multi‑file Demo

**Tech:** HTML, Tailwind CDN, Vanilla JS, Public API (FakeStore), Local JSON

## Files
- `index.html` — layout, Tailwind, sections
- `app.js` — all DOM logic (fetch products, cart, coupon, balance, banner, reviews)
- `reviews.json` — local data for the review carousel

## Run locally
Just double‑click `index.html`.

> If your browser blocks `fetch('reviews.json')` due to file:// CORS, run a simple local server:
- Python 3: `python -m http.server 8000` then open http://localhost:8000
- Node: `npx serve`

## Features
- Only **6 products** loaded from FakeStore API
- Sticky navbar, active highlight
- Banner carousel (auto + prev/next)
- Product cards (image, title, price, rating, Add to Cart)
- Cart with subtotal, delivery, shipping, coupon **SMART10**, total (no reloads)
- **User balance** with +1000 / Reset, localStorage persistence and over‑budget warning
- Reviews carousel from `reviews.json`
- Extra: Search + Sort, Dark/Light mode

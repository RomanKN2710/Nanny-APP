# Praxis Lumen: gynaecology practice website

A single-page website for a gynaecology practice, in German, French and English. It is a standalone static file (`index.html`) with no build step, separate from the Nest app in this repo.

## Features

- Language switch (DE / FR / EN). The page picks the browser language on the first visit and remembers the choice.
- Live opening hours: today is highlighted, and an "open now / closed, opens Monday at 08:00" badge updates every minute.
- Animations: hero headline reveal, a botanical line drawing, ultrasound-style ripples, a scrolling values band, reveal-on-scroll sections, and a pregnancy timeline that fills as you scroll. All motion switches off when the visitor has "reduce motion" set.
- Works on phones, with a full-screen menu and a sticky "Request appointment" bar.
- Light and dark mode.

## Placeholders to replace

| What | Where |
|---|---|
| Practice name "Praxis Lumen" | header, footer, `<title>` |
| Doctor "Dr. med. Sophie Martin", bio and focus areas | About section and the `a.*` keys in the `T` dictionary |
| Portrait | `.portrait` block (replace the silhouette with an `<img>`) |
| Address, phone, email | Visit section and footer |
| Opening hours | the `HOURS` array in the script |
| Emergency hospital (Inselspital) | `h.emergency` keys |
| Impressum / Datenschutz | footer links (both required in Switzerland) |

All text lives in the `T` dictionary at the bottom of the file (one block per language). The German text in the HTML is the fallback.

## The appointment form

The form validates input and shows a thank-you screen, but it does not send anything yet. To go live, connect it to a form service (for example Formspree or a small serverless function) and remove the "Preview" note (`f.demo` keys). Medical enquiries count as sensitive data under the Swiss nFADP, so choose a provider that hosts in Switzerland or the EU.

## Deploy

Any static host works: Vercel, Netlify, Cloudflare Pages or GitHub Pages. Upload the `gyn-praxis` folder.

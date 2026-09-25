# Praxis Lumen: gynaecology practice website

A single-page website for a gynaecology practice, in German, French and English. It is a standalone static file (`index.html`) with no build step, separate from the Nest app in this repo.

## Features

- Language switch (DE / FR / EN). The page picks the browser language on the first visit and remembers the choice.
- Live opening hours: today is highlighted, and an "open now / closed, opens Monday at 08:00" badge updates every minute.
- Lake theme: glacier turquoise, pale sky and deep lake blue, with a pale pebble tone in the room illustrations.
- Animations:
  - The hero is a live lake drawn on a canvas: Alps mirrored in wobbling water, sun glints, a drifting sailboat and birds.
  - Moving waves between sections, a scrolling values band and shimmering accent words.
  - Service cards fill with water on hover. On phones each card keeps a gentle water line.
  - Reveal-on-scroll sections and a pregnancy timeline that fills as you scroll.
  - The lake pauses when it is off screen or the tab is hidden, and all motion switches off when the visitor has "reduce motion" set.
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

## Lake photos

The photos in `photos/` are the practice's own lake pictures. They were resized for the web, and all metadata, including GPS location, was removed.

- `see-tag-*`: the "Durchatmen / Respirer / Breathe" photo band after the services. It moves slower than the page as you scroll (parallax), has wavy animated edges, and the title letters rise in when the band comes into view.
- `see-abend-1..3-*`: three sunsets that cross-fade slowly with a gentle zoom behind the footer.

Each photo comes in a 1000 px (`-s`) and a full (`-l`) version. The browser picks the right size.

## Practice tour and room photos

The "A look inside" section shows four illustrated, animated rooms (reception, waiting room, consultation room, examination room). They change automatically every 7 seconds and pause on hover. The waiting-room clock shows the real time.

To use real photos, put them in `gyn-praxis/photos/` and replace the `<svg class="rs">…</svg>` inside each `<figure class="scene">` with an image, for example:

```html
<figure class="scene active" data-room="0"><img src="photos/empfang.jpg" alt="Empfang der Praxis"></figure>
```

Photos get a slow zoom automatically. Use landscape images, about 2000 × 1250 px (16:10).

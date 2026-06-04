# The Autopsy of Jane Doe — An Interactive Horror Portfolio

> *No name. No record. No cause of death they could agree on.*

A static, horror-themed personal portfolio built with plain **HTML, CSS, and
JavaScript**. Instead of the usual scrolling one-pager, the whole site is framed
as a forensic case file: every page is a *room* in the Greenwich County Morgue,
and the visitor explores the "case" of Jane Doe — a fictional creative developer.
The concept is inspired by the film *The Autopsy of Jane Doe*.

**Live demo:** https://joshuamanasye.github.io/portfolio-of-jane-doe.github.io/

---

## Concept

Each section of a normal portfolio is reskinned as an interactive room and tied
together by a shared narrative and a facility map:

| Page | Room | What it really is |
|------|------|-------------------|
| `index.html` | Entrance | Animated game-style main menu |
| `about.html` | Corridor | Side-scrolling platformer with the bio |
| `work.html` | Darkroom | Drag-to-explore board of "developing" project photos |
| `skills.html` | Exam Room | Autopsy table — click evidence pins to reveal skills |
| `contact.html` | Intake | Retro terminal contact form |
| `resume.html` | Records | Forensic case-file résumé |
| `evidence.html` | Evidence Locker | Steel drawers of achievements/certifications |
| `map.html` | Facility Map | SVG floor-plan that tracks which rooms you've visited |

Progress is remembered in `localStorage`: the map shows which rooms you've
already entered and a pulsing **"you are here"** marker on the last room you left.

## Controls

**Main menu** — `W` / `S`, arrow keys, or the mouse to move between options;
`Space` / `Enter` / left-click to open the selected room.
**About (platformer)** — scroll or arrow keys to walk; the character follows the
camera. Press `E` / `Space` / `Enter` at a door to enter that room.
**Skills** — click an evidence marker or press `1`–`5`.
Every room has a `← menu` and a `map` link in the top-left corner.

## Tech stack

- **HTML5** — 8 separate, semantic pages
- **CSS3** — per-page stylesheets + a shared `main.css`; animations, transitions,
  `clamp()` responsive sizing, blueprint/grain/vignette overlays
- **Vanilla JavaScript (ES6)** — no frameworks; `requestAnimationFrame` game
  loop, dynamic **SVG** generation, **Web Audio**, and the `localStorage`
  progress system
- **GitHub Pages** (Jekyll, `_config.yml`) for hosting

## Run locally

It's a static site — just serve the folder:

```bash
# any static server works, e.g.
python -m http.server 8000
# then open http://localhost:8000
```

## Project structure

```
portfolio-of-jane-doe.github.io/
├── index.html / about.html / work.html / skills.html /
│   contact.html / resume.html / evidence.html / map.html
├── main.css                 # shared: nav buttons, loader
├── *.css                    # one stylesheet per page
├── js/
│   ├── index.js  about.js  work.js  skills.js
│   ├── contact.js  resume.js  evidence.js  map.js
├── assets/                  # sprites, images, audio
├── docs/                    # documentation + screenshots
├── _config.yml              # GitHub Pages config
└── README.md
```

Full write-up (features, code walkthrough, sitemap, screenshots) is in
[`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md).

---

*Author: Joshua Manasye · Final Project — Web-Based App Development*

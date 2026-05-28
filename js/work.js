const WORLD_W      = 1600;
const WORLD_H      = 1300;
const CARD_WORLD_W = 180;   // polaroid width in world-px
const CARD_WORLD_H = 240;   // polaroid height in world-px (photo 150 + caption ~80 + padding 10)
const PAN_MUL      = 1;     // panX/Y are screen-px → 1 mouse-px = 1 screen-px pan

// World-space centre (P1 centre: left 710 + half card 90, top 529 + half ~121)
const WC_X = 800;
const WC_Y = 650;

// ── Dynamic values — recalculated on every resize ─────────────
let SCALE      = 0;   // innerWidth / CARD_WORLD_W  → 1 card ≈ 1 screen width
let DARK_START = 0;   // screen-px: beyond here = pitch black
let RED_END    = 0;   // screen-px: inside here = developing into true colour

function recompute() {
    // Fit card within viewport: width ≈ screen width AND height < screen height
    const scaleW = window.innerWidth  / CARD_WORLD_W;
    const scaleH = window.innerHeight * 0.9 / CARD_WORLD_H;  // 90% — slight breathing room
    SCALE = Math.min(scaleW, scaleH);

    DARK_START = window.innerWidth * 2.5;  // red glow starts 2.5 screens away
    RED_END    = window.innerWidth * 1.0;  // true colours start 1 screen away
}

let panX = 0;
let panY = 0;

function initPan() {
    panX = window.innerWidth  / 2 - SCALE * WC_X;
    panY = window.innerHeight / 2 - SCALE * WC_Y;
}

const world     = document.getElementById('world');
const hint      = document.getElementById('drag-hint');
const polaroids = Array.from(document.querySelectorAll('.polaroid'));

let isDragging    = false;
let startMouseX   = 0, startMouseY = 0;
let startPanX     = 0, startPanY   = 0;
let hintDismissed = false;

function clampPan() {
    const margin  = 200;
    const visualW = SCALE * WORLD_W;
    const visualH = SCALE * WORLD_H;
    panX = Math.max(-(visualW - window.innerWidth  + margin), Math.min(margin, panX));
    panY = Math.max(-(visualH - window.innerHeight + margin), Math.min(margin, panY));
}

function applyTransform() {
    world.style.transform = `translate(${panX}px, ${panY}px) scale(${SCALE})`;
}

function updatePolaroids() {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;

    polaroids.forEach(el => {
        const r       = el.getBoundingClientRect();
        const screenX = r.left + r.width  / 2;
        const screenY = r.top  + r.height / 2;
        const dist    = Math.sqrt((screenX - cx) ** 2 + (screenY - cy) ** 2);

        const photo   = el.querySelector('.polaroid-photo');
        const caption = el.querySelector('.polaroid-caption');

        if (dist >= DARK_START) {
            photo.style.filter          = 'brightness(0)';
            caption.style.opacity       = '0';
            caption.style.pointerEvents = 'none';
            return;
        }

        if (dist >= RED_END) {
            const t = 1 - (dist - RED_END) / (DARK_START - RED_END);
            photo.style.filter =
                `brightness(${(t * 0.2).toFixed(3)}) sepia(1) saturate(12) hue-rotate(315deg)`;
            caption.style.opacity       = '0';
            caption.style.pointerEvents = 'none';
            return;
        }

        // Developing — red fades, true colours emerge
        const t          = 1 - dist / RED_END;
        const brightness = 0.2  + t * 0.8;
        const sepia      = (1 - t) * 0.55;
        const sat        = 12   - t * 11;
        const hue        = 315  - t * 315;

        photo.style.filter =
            `brightness(${brightness.toFixed(3)}) sepia(${sepia.toFixed(3)}) ` +
            `saturate(${sat.toFixed(2)}) hue-rotate(${hue.toFixed(1)}deg)`;

        const captionT              = Math.max(0, (t - 0.5) * 2);
        caption.style.opacity       = captionT.toFixed(3);
        caption.style.pointerEvents = captionT > 0.1 ? 'auto' : 'none';
    });
}

// ── Mouse drag ────────────────────────────────────────────────
document.addEventListener('mousedown', (e) => {
    if (e.target.closest('#back-btn') || e.target.classList.contains('p-link')) return;
    isDragging  = true;
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startPanX   = panX;
    startPanY   = panY;
    document.body.classList.add('dragging');
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    panX = startPanX + (e.clientX - startMouseX) * PAN_MUL;
    panY = startPanY + (e.clientY - startMouseY) * PAN_MUL;
    clampPan();
    applyTransform();
    updatePolaroids();

    if (!hintDismissed &&
        (Math.abs(e.clientX - startMouseX) > 6 || Math.abs(e.clientY - startMouseY) > 6)) {
        hintDismissed = true;
        hint.classList.add('hidden');
    }
});

document.addEventListener('mouseup',    () => { isDragging = false; document.body.classList.remove('dragging'); });
document.addEventListener('mouseleave', () => { isDragging = false; document.body.classList.remove('dragging'); });

// ── Touch drag ────────────────────────────────────────────────
let lastTouchX = 0, lastTouchY = 0;

document.addEventListener('touchstart', (e) => {
    lastTouchX  = e.touches[0].clientX;
    lastTouchY  = e.touches[0].clientY;
    startMouseX = lastTouchX;
    startMouseY = lastTouchY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    e.preventDefault();
    panX += (e.touches[0].clientX - lastTouchX) * PAN_MUL;
    panY += (e.touches[0].clientY - lastTouchY) * PAN_MUL;
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
    clampPan();
    applyTransform();
    updatePolaroids();

    if (!hintDismissed && Math.abs(lastTouchX - startMouseX) > 6) {
        hintDismissed = true;
        hint.classList.add('hidden');
    }
}, { passive: false });

// ── Resize — recompute scale & thresholds, re-centre view ────
window.addEventListener('resize', () => {
    recompute();
    initPan();
    clampPan();
    applyTransform();
    updatePolaroids();
});

// ── Loader ────────────────────────────────────────────────────
(function () {
    const loader = document.getElementById('loader');
    const bar    = document.getElementById('loader-bar');
    bar.addEventListener('animationend', () => {
        loader.classList.add('fade-out');
        loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }, { once: true });
}());

// ── Init ──────────────────────────────────────────────────────
recompute();
initPan();
clampPan();
applyTransform();
updatePolaroids();

const WORLD_WIDTH  = 5000;
const GROUND_HEIGHT = 70;    // px — must match #ground height in CSS
let CHAR_OFFSET = window.innerWidth * 0.4;  // 40% from left, recalculated on resize
const SCROLL_SPEED = 5;      // pixels per frame for held arrow keys

// Pre-determined elevation path
const PATH_POINTS = [
    { x: 0,    y: 0   },  // start on ground
    { x: 1250, y: 0   },  // approach Platform A
    { x: 1450, y: 130 },  // land on Platform A
    { x: 2200, y: 130 },  // cross Platform A
    { x: 2450, y: 0   },  // drop to ground
    { x: 2500, y: 0   },  // brief ground
    { x: 2650, y: 200 },  // land on Platform B (big jump)
    { x: 3200, y: 200 },  // cross Platform B
    { x: 3450, y: 0   },  // drop to ground
    { x: 3500, y: 0   },  // brief ground
    { x: 3650, y: 100 },  // land on Platform C
    { x: 4400, y: 100 },  // cross Platform C
    { x: 4600, y: 0   },  // drop to ground
    { x: 5000, y: 0   },  // end
];

function smoothstep(t) {
    return t * t * (3 - 2 * t);
}

function getPathY(worldX) {
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
        const a = PATH_POINTS[i];
        const b = PATH_POINTS[i + 1];
        if (worldX >= a.x && worldX < b.x) {
            const t = smoothstep((worldX - a.x) / (b.x - a.x));
            return a.y + (b.y - a.y) * t;
        }
    }
    return PATH_POINTS[PATH_POINTS.length - 1].y;
}

let scrollX = 0;
let maxScrollX = WORLD_WIDTH - window.innerWidth;

const world     = document.getElementById('world');
const character = document.getElementById('character');
const progress  = document.getElementById('progress');
const hint      = document.getElementById('scroll-hint');

let hintDismissed = false;

function setScrollX(x) {
    scrollX = Math.max(0, Math.min(maxScrollX, x));

    // World snaps instantly — so the character's 0.2s left-transition lag is visible
    world.style.transform = `translateX(${-scrollX}px)`;

    // left: target keeps character at CHAR_OFFSET on screen; CSS transition adds the lag
    character.style.left   = (scrollX + CHAR_OFFSET) + 'px';

    // bottom: follows the pre-determined path with no extra delay
    const charWorldX = scrollX + CHAR_OFFSET;
    character.style.bottom = (GROUND_HEIGHT + getPathY(charWorldX)) + 'px';

    progress.style.width = (scrollX / maxScrollX * 100) + '%';

    if (!hintDismissed && scrollX > 30) {
        hintDismissed = true;
        hint.classList.add('hidden');
    }
}

// ── Input: mouse wheel (converts vertical to horizontal) ─────────────────────
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    setScrollX(scrollX + e.deltaY * 1.5);
}, { passive: false });

// ── Input: touch swipe ────────────────────────────────────────────────────────
let touchStartX = 0;

window.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    const dx = touchStartX - e.touches[0].clientX;
    touchStartX = e.touches[0].clientX;
    setScrollX(scrollX + dx * 1.5);
    e.preventDefault();
}, { passive: false });

// ── Input: keyboard (held-key via RAF loop) ───────────────────────────────────
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') e.preventDefault();
});

window.addEventListener('keyup', (e) => {
    delete keys[e.code];
});

function loop() {
    if (keys['ArrowRight'] || keys['KeyD']) setScrollX(scrollX + SCROLL_SPEED);
    if (keys['ArrowLeft']  || keys['KeyA']) setScrollX(scrollX - SCROLL_SPEED);
    requestAnimationFrame(loop);
}

// ── Resize ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    maxScrollX = WORLD_WIDTH - window.innerWidth;
    CHAR_OFFSET = window.innerWidth * 0.4;
    setScrollX(scrollX);
});

// ── Init ──────────────────────────────────────────────────────────────────────
setScrollX(0);
loop();

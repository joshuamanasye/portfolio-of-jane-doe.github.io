const WORLD_WIDTH = 5000;
let CHAR_OFFSET = window.innerWidth * 0.4;  // 40% from left, recalculated on resize
const SCROLL_SPEED = 5;   // pixels per frame for held arrow keys

let scrollX = 0;
let maxScrollX = WORLD_WIDTH - window.innerWidth;

const world     = document.getElementById('world');
const character = document.getElementById('character');
const progress  = document.getElementById('progress');
const hint      = document.getElementById('scroll-hint');

let hintDismissed = false;

function setScrollX(x) {
    scrollX = Math.max(0, Math.min(maxScrollX, x));

    // World snaps instantly — so the character's transition lag is visible
    world.style.transform = `translateX(${-scrollX}px)`;

    // Character left = world-x that keeps it at CHAR_OFFSET on screen.
    // Because screen-x = (character.left) + (world translateX)
    //                   = (scrollX + CHAR_OFFSET) + (-scrollX)
    //                   = CHAR_OFFSET
    // The 0.2s CSS transition on `left` makes the character lag behind the world.
    character.style.left = (scrollX + CHAR_OFFSET) + 'px';

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

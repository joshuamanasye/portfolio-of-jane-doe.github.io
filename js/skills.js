/* ── Loader ───────────────────────────────────────────────────── */
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        loader.classList.add('fade-out');
        setTimeout(() => loader.remove(), 700);
    }, 1000);
});

/* ── Config ───────────────────────────────────────────────────── */
const WORLD_WIDTH   = 14000;
const GROUND_Y      = 70;
const SCROLL_SPEED  = 8;
const CHAR_SCREEN_X = 0.4;
const LERP_FACTOR   = 0.08;

const PLATFORMS = [
    { left: 1200,  width: 900,  height: 110 },
    { left: 2100,  width: 700,  height: 180 },
    { left: 3000,  width: 1100, height: 80  },
    { left: 4100,  width: 600,  height: 150 },
];

const DOORS = document.querySelectorAll('.door');
const DOOR_PROXIMITY = 160;

/* ── State ────────────────────────────────────────────────────── */
let worldX     = 0;
let targetX    = 0;
let charWorldX = window.innerWidth * CHAR_SCREEN_X;
let charY      = 0;
let velY       = 0;
let onGround   = false;
let jumping    = false;
let scrolled   = false;
let facing     = 1;

const keys = { left: false, right: false, up: false };

/* ── Elements ─────────────────────────────────────────────────── */
const world      = document.getElementById('world');
const character  = document.getElementById('character');
const scrollHint = document.getElementById('scroll-hint');
const progressEl = document.getElementById('progress');
const doorHint   = document.getElementById('door-hint');

/* ── Sprite sheet (2×2 walk cycle, same as about.js) ─────────── */
const SPRITE_W  = 96;
const SPRITE_H  = 96;
const FRAME_DUR = 140;
let   frame     = 0;
let   lastFrame = 0;
let   moving    = false;

function buildSpriteCSS(col, row) {
    return `url('./assets/character.png') -${col * SPRITE_W}px -${row * SPRITE_H}px`;
}

function updateSprite(ts) {
    if (ts - lastFrame > FRAME_DUR && moving) {
        frame = (frame + 1) % 4;
        lastFrame = ts;
    }
    const col = moving ? frame : 0;
    const row = facing < 0 ? 1 : 0;
    character.style.backgroundImage = buildSpriteCSS(col, row);
    character.style.transform = '';
}

/* ── Platform collision ───────────────────────────────────────── */
function getPlatformFloor(wx) {
    for (const p of PLATFORMS) {
        if (wx + SPRITE_W > p.left && wx < p.left + p.width) {
            return p.height;
        }
    }
    return 0;
}

/* ── Physics ──────────────────────────────────────────────────── */
const GRAVITY   = 0.55;
const JUMP_VEL  = -13;

function physicsStep() {
    const floor = getPlatformFloor(charWorldX);

    velY += GRAVITY;
    charY -= velY;

    const viewH  = window.innerHeight;
    const minY   = floor + GROUND_Y;
    const screenBottom = viewH - GROUND_Y - floor;

    if (charY >= screenBottom) {
        charY   = screenBottom;
        velY    = 0;
        onGround = true;
    } else {
        onGround = false;
    }

    character.style.bottom = (GROUND_Y + floor + 'px');
    if (!onGround) {
        character.style.bottom = (viewH - charY - SPRITE_H) + 'px';
    }
}

/* ── Input ────────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
    if (['ArrowLeft','a','A'].includes(e.key))  { keys.left  = true; }
    if (['ArrowRight','d','D'].includes(e.key)) { keys.right = true; }
    if (['ArrowUp','w','W',' '].includes(e.key)) {
        if (onGround && !jumping) { velY = JUMP_VEL; jumping = true; }
    }
    if (['Enter',' '].includes(e.key)) tryEnterDoor();
});
document.addEventListener('keyup', e => {
    if (['ArrowLeft','a','A'].includes(e.key))  keys.left  = false;
    if (['ArrowRight','d','D'].includes(e.key)) keys.right = false;
    if (['ArrowUp','w','W',' '].includes(e.key)) jumping = false;
    if (onGround) jumping = false;
});

/* Scroll / wheel */
window.addEventListener('wheel', e => {
    const dir = e.deltaY > 0 ? 1 : -1;
    targetX = Math.max(0, Math.min(WORLD_WIDTH - window.innerWidth, targetX + dir * SCROLL_SPEED * 20));
    if (!scrolled) { scrolled = true; scrollHint.classList.add('hidden'); }
}, { passive: true });

/* Touch swipe */
let touchStartX = 0;
window.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
window.addEventListener('touchmove', e => {
    const dx = touchStartX - e.touches[0].clientX;
    targetX = Math.max(0, Math.min(WORLD_WIDTH - window.innerWidth, targetX + dx * 1.5));
    touchStartX = e.touches[0].clientX;
    if (!scrolled) { scrolled = true; scrollHint.classList.add('hidden'); }
}, { passive: true });

/* ── Door logic ───────────────────────────────────────────────── */
let activeDoor = null;

function checkDoors() {
    let nearest = null;
    let nearestDist = Infinity;

    DOORS.forEach(door => {
        const dLeft = parseInt(door.style.left);
        const dist  = Math.abs(charWorldX - dLeft);
        if (dist < nearestDist) { nearestDist = dist; nearest = door; }
    });

    if (nearestDist < DOOR_PROXIMITY) {
        if (activeDoor !== nearest) {
            if (activeDoor) activeDoor.classList.remove('door-active');
            nearest.classList.add('door-active');
            activeDoor = nearest;
            doorHint.textContent = 'press enter to enter';
            doorHint.classList.remove('hidden');
        }
    } else {
        if (activeDoor) { activeDoor.classList.remove('door-active'); activeDoor = null; }
        doorHint.classList.add('hidden');
    }
}

function tryEnterDoor() {
    if (activeDoor) {
        const href = activeDoor.dataset.href;
        if (href) window.location.href = href;
    }
}

/* ── Skill bar reveal ─────────────────────────────────────────── */
const panels = document.querySelectorAll('.skill-panel');
const revealedPanels = new Set();

function checkSkillReveal() {
    panels.forEach(panel => {
        if (revealedPanels.has(panel)) return;
        const panelLeft = parseInt(panel.style.left);
        const dist = Math.abs(charWorldX - panelLeft);
        if (dist < 600) {
            revealedPanels.add(panel);
            panel.querySelectorAll('.skill-fill').forEach(fill => {
                const target = fill.style.width;
                fill.style.width = '0';
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => { fill.style.width = target; });
                });
            });
        }
    });
}

/* ── Main loop ────────────────────────────────────────────────── */
function loop(ts) {
    /* movement */
    moving = false;
    if (keys.left)  { charWorldX = Math.max(0, charWorldX - SCROLL_SPEED); facing = -1; moving = true; }
    if (keys.right) { charWorldX = Math.min(WORLD_WIDTH - SPRITE_W, charWorldX + SCROLL_SPEED); facing = 1; moving = true; }

    /* auto-scroll world to keep character at CHAR_SCREEN_X */
    const desiredWorldX = charWorldX - window.innerWidth * CHAR_SCREEN_X;
    targetX = Math.max(0, Math.min(WORLD_WIDTH - window.innerWidth, desiredWorldX));
    worldX += (targetX - worldX) * LERP_FACTOR;

    world.style.transform = `translateX(${-worldX}px)`;

    /* character screen position */
    const screenX = charWorldX - worldX;
    character.style.left = screenX + 'px';

    physicsStep();
    updateSprite(ts);
    checkDoors();
    checkSkillReveal();

    /* progress bar */
    const pct = worldX / (WORLD_WIDTH - window.innerWidth) * 100;
    progressEl.style.width = pct + '%';

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

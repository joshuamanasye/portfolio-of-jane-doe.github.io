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

/* ── Sprite system (mirrors about.js) ────────────────────────── */
const SPRITE_BASE      = './assets/Characters/Prototype_Character/Default/';
const FRAME_SRC        = 32;
const SPRITE_SCALE     = 3;
const FRAME_PX         = FRAME_SRC * SPRITE_SCALE;   // 96
const CHAR_FOOT_OFFSET = 9 * SPRITE_SCALE;            // 27

const ANIMS = {
    idle: { file: 'idle.png', cols: 2, frames: 6, fps: 8,  srcW: 64,  srcH: 96, startRow: 0 },
    walk: { file: 'walk.png', cols: 4, frames: 4, fps: 12, srcW: 128, srcH: 96, startRow: 1 },
};

Object.values(ANIMS).forEach(a => { new Image().src = SPRITE_BASE + a.file; });

let spriteAnim  = 'idle';
let spriteFrame = 0;
let spriteLast  = 0;
let facingRight = true;

function updateSprite(ts) {
    const inputMove  = keys.left || keys.right;
    const gap        = targetX - worldX;
    const catchingUp = Math.abs(charWorldX - (worldX + window.innerWidth * CHAR_SCREEN_X)) > 2;
    const walking    = inputMove || catchingUp;

    const nextAnim = walking ? 'walk' : 'idle';
    if (nextAnim !== spriteAnim) {
        spriteAnim  = nextAnim;
        spriteFrame = 0;
        spriteLast  = ts;
    }

    const a = ANIMS[spriteAnim];
    if (ts - spriteLast >= 1000 / a.fps) {
        spriteFrame = (spriteFrame + 1) % a.frames;
        spriteLast  = ts;
    }

    const col = spriteFrame % a.cols;
    const row = a.startRow + Math.floor(spriteFrame / a.cols);

    character.style.backgroundImage    = `url('${SPRITE_BASE}${a.file}')`;
    character.style.backgroundSize     = `${a.srcW * SPRITE_SCALE}px ${a.srcH * SPRITE_SCALE}px`;
    character.style.backgroundPosition = `-${col * FRAME_PX}px -${row * FRAME_PX}px`;

    if (inputMove) {
        if (keys.right) facingRight = true;
        if (keys.left)  facingRight = false;
    }
    character.style.transform = facingRight ? 'scaleX(1)' : 'scaleX(-1)';
}

/* ── Platform collision ───────────────────────────────────────── */
function getPlatformFloor(wx) {
    for (const p of PLATFORMS) {
        if (wx + FRAME_PX > p.left && wx < p.left + p.width) {
            return p.height;
        }
    }
    return 0;
}

/* ── Physics ──────────────────────────────────────────────────── */
const GRAVITY  = 0.55;
const JUMP_VEL = -13;

function physicsStep() {
    const floor        = getPlatformFloor(charWorldX);
    const viewH        = window.innerHeight;
    const screenBottom = viewH - GROUND_Y - floor;

    velY += GRAVITY;
    charY -= velY;

    if (charY >= screenBottom) {
        charY    = screenBottom;
        velY     = 0;
        onGround = true;
    } else {
        onGround = false;
    }

    if (onGround) {
        character.style.bottom = (GROUND_Y + floor) + 'px';
    } else {
        character.style.bottom = (viewH - charY - FRAME_PX) + 'px';
    }
}

/* ── Input ────────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
    if (['ArrowLeft',  'a', 'A'].includes(e.key)) keys.left  = true;
    if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.right = true;
    if (['ArrowUp', 'w', 'W', ' '].includes(e.key)) {
        if (onGround && !jumping) { velY = JUMP_VEL; jumping = true; }
    }
    if (['Enter', ' '].includes(e.key)) tryEnterDoor();
});

document.addEventListener('keyup', e => {
    if (['ArrowLeft',  'a', 'A'].includes(e.key)) keys.left  = false;
    if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.right = false;
    if (['ArrowUp', 'w', 'W', ' '].includes(e.key)) jumping = false;
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
    let nearest     = null;
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

/* ── Skill bar reveal on approach ─────────────────────────────── */
const panels        = document.querySelectorAll('.skill-panel');
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
    if (keys.left)  { charWorldX = Math.max(0, charWorldX - SCROLL_SPEED); facing = -1; }
    if (keys.right) { charWorldX = Math.min(WORLD_WIDTH - FRAME_PX, charWorldX + SCROLL_SPEED); facing = 1; }

    const desiredWorldX = charWorldX - window.innerWidth * CHAR_SCREEN_X;
    targetX = Math.max(0, Math.min(WORLD_WIDTH - window.innerWidth, desiredWorldX));
    worldX += (targetX - worldX) * LERP_FACTOR;

    world.style.transform = `translateX(${-worldX}px)`;

    const screenX = charWorldX - worldX;
    character.style.left = screenX + 'px';

    physicsStep();
    updateSprite(ts);
    checkDoors();
    checkSkillReveal();

    const pct = worldX / (WORLD_WIDTH - window.innerWidth) * 100;
    progressEl.style.width = pct + '%';

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
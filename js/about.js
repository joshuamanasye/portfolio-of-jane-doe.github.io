const WORLD_WIDTH  = 7500;
const GROUND_HEIGHT = 70;    // px — must match #ground height in CSS
let CHAR_OFFSET = window.innerWidth * 0.4;  // 40% from left, recalculated on resize
const SCROLL_SPEED = 5;      // pixels per frame for held arrow keys

// Pre-determined elevation path
// Platforms: A = 800–1600 h130 | B = 1600–2700 h200 | C = 2700–4100 h100
const PATH_POINTS = [
    { x: 0,    y: 0   },  // start on ground
    { x: 1100,  y: 0   },  // run toward Platform A
    { x: 1220,  y: 230 },  // jump apex (~100px above Platform A at 130)
    { x: 1380,  y: 130 },  // land on Platform A
    { x: 1980, y: 130 },  // cross Platform A, approach jump to B
    { x: 2090, y: 300 },  // jump apex (~100px above Platform B at 200)
    { x: 2230, y: 200 },  // land on Platform B
    { x: 3080, y: 200 },  // cross Platform B, approach jump to C
    { x: 3170, y: 260 },  // jump apex (falling from B at 200 to C at 100)
    { x: 3330, y: 100 },  // land on Platform C
    { x: 3980, y: 100 },  // cross Platform C (now wider, covers Find Me panel)
    { x: 4080, y: 160 },  // arc off edge
    { x: 4250, y: 0   },  // land on ground
    { x: 8000, y: 0   },  // end
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

let scrollX    = 0;
let maxScrollX = WORLD_WIDTH - window.innerWidth;

// Character follow — world moves instantly, character lerps toward target
const CHAR_FOLLOW     = 0.03;   // fraction of gap closed per frame (~0.5 s to catch up)
const CHAR_MAX_SPEED  = 3;    // px per frame — caps how fast character can move
let charActualX   = CHAR_OFFSET;  // world-space X; starts at same position as target

const world     = document.getElementById('world');
const character = document.getElementById('character');
const progress  = document.getElementById('progress');
const hint      = document.getElementById('scroll-hint');

let hintDismissed = false;

function setScrollX(x) {
    scrollX = Math.max(0, Math.min(maxScrollX, x));

    // World moves immediately — character follows in the RAF loop
    world.style.transform = `translateX(${-scrollX}px)`;
    progress.style.width  = (scrollX / maxScrollX * 100) + '%';

    if (!hintDismissed && scrollX > 30) {
        hintDismissed = true;
        hint.classList.add('hidden');
    }
}

// ── Touch momentum ────────────────────────────────────────────────────────────
let scrollVelocity = 0;
const SCROLL_FRICTION = 0.8;
const SCROLL_VEL_CAP  = 30;

// ── Snap-to-panel (wheel + keyboard) ─────────────────────────────────────────
// World-space X of each panel's left edge — character stops here on snap
const SNAP_WORLD_X    = [0, 650, 1600, 2600, 3700, 4400, 4650, 4900, 5150];
const SNAP_LERP       = 0.08;    // fraction of gap camera closes per frame
let   snapTargetScrollX = null;  // null = not snapping

let   wheelAccum      = 0;
const WHEEL_THRESHOLD = 50;      // accumulated deltaY before a snap fires

function triggerSnap(dir) {
    const charX  = scrollX + CHAR_OFFSET;
    const target = dir > 0
        ? SNAP_WORLD_X.find(x => x > charX + 30)
        : [...SNAP_WORLD_X].reverse().find(x => x < charX - 30);
    if (target !== undefined) {
        snapTargetScrollX = Math.max(0, Math.min(maxScrollX, target - CHAR_OFFSET));
    }
}

// ── Input: mouse wheel → snap ─────────────────────────────────────────────────
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
    wheelAccum += delta;
    if (Math.abs(wheelAccum) >= WHEEL_THRESHOLD) {
        triggerSnap(wheelAccum > 0 ? 1 : -1);
        wheelAccum = 0;
    }
}, { passive: false });

// ── Input: touch swipe ────────────────────────────────────────────────────────
let touchStartX  = 0;
let touchLastDx  = 0;   // last per-frame delta — handed to velocity on lift

window.addEventListener('touchstart', (e) => {
    touchStartX       = e.touches[0].clientX;
    touchLastDx       = 0;
    scrollVelocity    = 0;
    snapTargetScrollX = null;  // finger down cancels any snap in progress
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    const dx   = (touchStartX - e.touches[0].clientX) * 1.5;
    touchLastDx = dx;
    touchStartX = e.touches[0].clientX;
    setScrollX(scrollX + dx);
    e.preventDefault();
}, { passive: false });

window.addEventListener('touchend', () => {
    // carry swipe speed into momentum
    scrollVelocity = Math.max(-SCROLL_VEL_CAP, Math.min(SCROLL_VEL_CAP, touchLastDx));
});

// ── Doors ─────────────────────────────────────────────────────────────────────
const DOORS = [
    { x: 4400, label: 'work',    href: 'work.html'    },
    { x: 4650, label: 'skills',  href: 'skills.html'  },
    { x: 4900, label: 'contact', href: 'contact.html' },
    { x: 5150, label: 'resume',  href: 'resume.pdf'   },
];
const DOOR_RANGE = 80;   // world-px — within this distance, E/Space/Enter triggers
const doorHint   = document.getElementById('door-hint');
const doorEls    = Array.from(document.querySelectorAll('.door'));

let activeDoor = null;

function checkDoorProximity() {
    const nearest = DOORS.find(d => Math.abs(charActualX - d.x) < DOOR_RANGE) ?? null;
    if (nearest === activeDoor) return;
    activeDoor = nearest;
    doorEls.forEach(el => el.classList.remove('door-active'));
    if (activeDoor) {
        const el = doorEls.find(el => el.dataset.href === activeDoor.href);
        if (el) el.classList.add('door-active');
        doorHint.textContent = `[ e ]  ${activeDoor.label}`;
        doorHint.classList.remove('hidden');
    } else {
        doorHint.classList.add('hidden');
    }
}

function enterDoor() {
    if (activeDoor) window.location.href = activeDoor.href;
}

// ── Input: keyboard → snap ────────────────────────────────────────────────────
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { triggerSnap(1);  e.preventDefault(); }
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') { triggerSnap(-1); e.preventDefault(); }
    if ((e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') && activeDoor) {
        enterDoor(); e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    delete keys[e.code];
});

function loop(ts) {
    // Snap animation (wheel / keyboard) — takes priority over touch momentum
    if (snapTargetScrollX !== null) {
        const diff = snapTargetScrollX - scrollX;
        if (Math.abs(diff) < 0.3) {
            setScrollX(snapTargetScrollX);
            snapTargetScrollX = null;
        } else {
            setScrollX(scrollX + diff * SNAP_LERP);
        }
        scrollVelocity = 0;
    } else if (Math.abs(scrollVelocity) > 0.1) {
        // Touch momentum
        setScrollX(scrollX + scrollVelocity);
        scrollVelocity *= SCROLL_FRICTION;
    } else {
        scrollVelocity = 0;
    }

    // Lerp character toward target world position (capped at max speed)
    const targetX  = scrollX + CHAR_OFFSET;
    const charStep = (targetX - charActualX) * CHAR_FOLLOW;
    charActualX   += Math.abs(charStep) > CHAR_MAX_SPEED
        ? Math.sign(charStep) * CHAR_MAX_SPEED
        : charStep;

    character.style.left   = charActualX + 'px';
    character.style.bottom = (GROUND_HEIGHT + getPathY(charActualX) - CHAR_FOOT_OFFSET) + 'px';

    updateSprite(ts, targetX);
    checkDoorProximity();
    checkJumpscare();
    requestAnimationFrame(loop);
}

// ── Resize ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    maxScrollX  = WORLD_WIDTH - window.innerWidth;
    CHAR_OFFSET = window.innerWidth * 0.4;
    charActualX = scrollX + CHAR_OFFSET;
    if (snapTargetScrollX !== null) {
        snapTargetScrollX = Math.max(0, Math.min(maxScrollX, snapTargetScrollX));
    }
    setScrollX(scrollX);
});

// ── Jumpscare ─────────────────────────────────────────────────────────────────
// Fires 3 s after character walks past the "Find Me" panel (left: 4200, width: 280)
// Fires 3 s after character walks past the "Find Me" panel (left: 3700, width: 280)
const JUMPSCARE_TRIGGER_X = 3000;

// Preload assets so there's no delay on first trigger
const _jsImg = new Image();
_jsImg.src = 'assets/jane-doe.jpg';
const _jsAudio = new Audio('assets/Wilhelm Scream - Sound Effect HD.mp3');
_jsAudio.load();

function jumpscare() {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;z-index:9999;overflow:hidden;';
    const img = document.createElement('img');
    img.src = 'assets/jane-doe.jpg';
    img.style.cssText = 'position:absolute;inset:-5%;width:110%;height:110%;object-fit:cover;';
    el.appendChild(img);
    document.body.appendChild(el);
    _jsAudio.currentTime = 0;
    _jsAudio.play().catch(() => {});
    setTimeout(() => el.remove(), 200);
}

let jumpscareTimer = null;

function checkJumpscare() {
    if (charActualX > JUMPSCARE_TRIGGER_X) {
        if (!jumpscareTimer) {
            console.log("triggered");
            jumpscareTimer = setTimeout(jumpscare, 2500);
        }
    } else {
        clearTimeout(jumpscareTimer);
        jumpscareTimer = null;
    }
}

// ── Sprite animation ──────────────────────────────────────────────────────────
const SPRITE_BASE      = './assets/Characters/Prototype_Character/Default/';
const FRAME_SRC        = 32;   // source px per frame (all sheets 32×32)
const SPRITE_SCALE     = 3;    // display scale → 96×96 per frame (×1.5 of ×2)
const FRAME_PX         = FRAME_SRC * SPRITE_SCALE;          // 96
const CHAR_FOOT_OFFSET = 9    * SPRITE_SCALE;               // 27 — transparent px below feet × scale

const ANIMS = {
    idle: { file: 'idle.png', cols: 2, frames: 6, fps: 8,  srcW: 64,  srcH: 96, startRow: 0 },
    walk: { file: 'walk.png', cols: 4, frames: 4, fps: 12, srcW: 128, srcH: 96, startRow: 1 },
};

// Preload both sheets so there's no flicker on first switch
Object.values(ANIMS).forEach(a => { new Image().src = SPRITE_BASE + a.file; });

let spriteAnim  = 'idle';
let spriteFrame = 0;
let spriteLast  = 0;
let facingRight = true;

function updateSprite(ts, targetX) {
    const gap        = targetX - charActualX;
    const catchingUp = Math.abs(gap) > 2;           // character hasn't reached target yet
    const inputMove  = keys['ArrowRight'] || keys['KeyD'] || keys['ArrowLeft'] || keys['KeyA'];
    const walking    = inputMove || catchingUp;

    const nextAnim = walking ? 'walk' : 'idle';

    if (nextAnim !== spriteAnim) {
        spriteAnim  = nextAnim;
        spriteFrame = 0;
        spriteLast  = ts;
    }

    const a = ANIMS[spriteAnim];

    if (ts - spriteLast >= 4000 / a.fps) {
        spriteFrame = (spriteFrame + 1) % a.frames;
        spriteLast  = ts;
    }

    const col = spriteFrame % a.cols;
    const row = a.startRow + Math.floor(spriteFrame / a.cols);

    character.style.backgroundImage    = `url('${SPRITE_BASE}${a.file}')`;
    character.style.backgroundSize     = `${a.srcW * SPRITE_SCALE}px ${a.srcH * SPRITE_SCALE}px`;
    character.style.backgroundPosition = `${-col * FRAME_PX}px ${-row * FRAME_PX}px`;

    // Facing: input direction takes priority; otherwise follow the catch-up direction
    if (inputMove) {
        if (keys['ArrowRight'] || keys['KeyD']) facingRight = true;
        if (keys['ArrowLeft']  || keys['KeyA']) facingRight = false;
    } else if (catchingUp) {
        facingRight = gap > 0;  // chase right if target is ahead, left if behind
    }
    character.style.transform = facingRight ? 'scaleX(1)' : 'scaleX(-1)';
}

// ── Loader ────────────────────────────────────────────────────────────────────
(function () {
    const loader = document.getElementById('loader');
    const bar    = document.getElementById('loader-bar');
    bar.addEventListener('animationend', () => {
        loader.classList.add('fade-out');
        loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }, { once: true });
}());

// ── Init ──────────────────────────────────────────────────────────────────────
setScrollX(0);
requestAnimationFrame(loop);

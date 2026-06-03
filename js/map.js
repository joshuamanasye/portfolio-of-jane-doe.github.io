/* ── Loader ───────────────────────────────────────────────────── */
(function () {
    const loader = document.getElementById('loader');
    const bar    = document.getElementById('loader-bar');
    if (!bar) return;
    bar.addEventListener('animationend', () => {
        loader.classList.add('fade-out');
        loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }, { once: true });
}());

/* Mark this page visited */
try { localStorage.setItem('visited_map', '1'); } catch (e) {}

/* ── Room data ────────────────────────────────────────────────── */
const ROOMS = [
    { id:'lobby',    label:'LOBBY',           sub:'entrance',        href:'index.html',    flag:null,               x:20,  y:185, w:145, h:100 },
    { id:'corridor', label:'CORRIDOR',        sub:'case narrative',  href:'about.html',    flag:'visited_about',    x:215, y:185, w:185, h:100 },
    { id:'darkroom', label:'DARKROOM',        sub:'evidence board',  href:'work.html',     flag:'visited_work',     x:455, y:185, w:155, h:100 },
    { id:'exam',     label:'EXAM ROOM',       sub:'subject skills',  href:'skills.html',   flag:'visited_skills',   x:455, y:50,  w:155, h:100 },
    { id:'intake',   label:'INTAKE',          sub:'communicate',     href:'contact.html',  flag:'visited_contact',  x:455, y:325, w:155, h:100 },
    { id:'records',  label:'RECORDS',         sub:'case file',       href:'resume.html',   flag:'visited_resume',   x:670, y:105, w:150, h:90  },
    { id:'evidence', label:'EVIDENCE LOCKER', sub:'artifacts',       href:'evidence.html', flag:'visited_evidence', x:670, y:240, w:150, h:90  },
    { id:'ops',      label:'OPERATIONS',      sub:'you are here',    href:null,            flag:null,               x:670, y:372, w:150, h:75  },
];

/* Centers (x + w/2, y + h/2) */
function cx(r) { return r.x + r.w / 2; }
function cy(r) { return r.y + r.h / 2; }

const R = Object.fromEntries(ROOMS.map(r => [r.id, r]));

/* Connector paths between rooms */
const CONNECTORS = [
    `M${R.lobby.x + R.lobby.w},${cy(R.lobby)} H${R.corridor.x}`,
    `M${R.corridor.x + R.corridor.w},${cy(R.corridor)} H${R.darkroom.x}`,
    `M${cx(R.corridor)},${R.corridor.y} V${R.exam.y + R.exam.h} H${R.exam.x}`,
    `M${cx(R.corridor)},${R.corridor.y + R.corridor.h} V${R.intake.y} H${R.intake.x}`,
    `M${R.darkroom.x + R.darkroom.w},${cy(R.darkroom)} L${R.records.x - 10},${cy(R.darkroom)} L${R.records.x - 10},${cy(R.records)} H${R.records.x}`,
    `M${R.darkroom.x + R.darkroom.w},${cy(R.darkroom)} L${R.evidence.x - 10},${cy(R.darkroom)} L${R.evidence.x - 10},${cy(R.evidence)} H${R.evidence.x}`,
    `M${cx(R.evidence)},${R.evidence.y + R.evidence.h} V${R.ops.y}`,
];

/* ── Build SVG ────────────────────────────────────────────────── */
const NS  = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('floor-plan');

function el(tag, attrs = {}) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
}
function txt(tag, attrs, text) {
    const e = el(tag, attrs);
    e.textContent = text;
    return e;
}

function isVisited(room) {
    if (!room.flag) return false;
    try { return !!localStorage.getItem(room.flag); } catch(e) { return false; }
}

/* Connectors */
const gConn = el('g', { id:'connectors' });
CONNECTORS.forEach(d => gConn.appendChild(el('path', { class:'connector', d })));
svg.appendChild(gConn);

/* Rooms */
const gRooms = el('g', { id:'rooms' });

ROOMS.forEach(room => {
    const visited  = isVisited(room);
    const isHere   = room.id === 'ops';
    const isLobby  = room.id === 'lobby';

    const g = el('g', {
        class: ['room-group', visited ? 'visited' : '', isHere ? 'here' : ''].filter(Boolean).join(' '),
        'data-id': room.id,
        ...(room.href && !isHere ? { tabindex:'0', role:'link', 'aria-label': room.label } : {}),
    });

    /* Background rect */
    g.appendChild(el('rect', { class:'room-bg', x:room.x, y:room.y, width:room.w, height:room.h }));

    /* Dimension annotations (flavour) */
    const dim = `${room.w}m × ${room.h}m`;
    g.appendChild(txt('text', { class:'room-dim', x: room.x + 4, y: room.y + room.h - 4 }, dim));

    /* Room label */
    g.appendChild(txt('text', { class:'room-label', x: cx(room), y: cy(room) - 8, 'text-anchor':'middle' }, room.label));

    /* Sub label */
    g.appendChild(txt('text', { class:'room-sub',   x: cx(room), y: cy(room) + 6, 'text-anchor':'middle' }, `// ${room.sub}`));

    /* Visited stamp */
    if (visited) {
        g.appendChild(txt('text', { class:'room-stamp', x: room.x + room.w - 4, y: room.y + 10, 'text-anchor':'end' }, '✓ VISITED'));
    }

    /* "You are here" indicator */
    if (isHere) {
        const dot = el('circle', { class:'here-dot', cx: cx(room), cy: room.y + room.h - 14, r:'4' });
        const ring = el('circle', { class:'here-ring', cx: cx(room), cy: room.y + room.h - 14, r:'5' });
        g.appendChild(ring);
        g.appendChild(dot);
        g.appendChild(txt('text', { class:'room-sub', x: cx(room), y: room.y + room.h - 4, 'text-anchor':'middle' }, '▸ YOU ARE HERE'));
    }

    /* Lobby special label */
    if (isLobby) {
        g.appendChild(txt('text', { class:'room-sub', x: cx(room), y: cy(room) + 18, 'text-anchor':'middle' }, '[ HOME ]'));
    }

    gRooms.appendChild(g);
});

svg.appendChild(gRooms);

/* Scale bar + north */
const gMeta = el('g', { id:'meta' });
gMeta.appendChild(el('line', { x1:820, y1:445, x2:880, y2:445, stroke:'rgba(0,100,150,0.3)', 'stroke-width':'1' }));
gMeta.appendChild(el('line', { x1:820, y1:440, x2:820, y2:450, stroke:'rgba(0,100,150,0.3)', 'stroke-width':'1' }));
gMeta.appendChild(el('line', { x1:880, y1:440, x2:880, y2:450, stroke:'rgba(0,100,150,0.3)', 'stroke-width':'1' }));
gMeta.appendChild(txt('text', { x:850, y:458, 'text-anchor':'middle', 'font-family':'monospace', 'font-size':'5.5', fill:'rgba(0,80,120,0.3)', 'letter-spacing':'1' }, '10m'));
gMeta.appendChild(txt('text', { x:15, y:20, 'font-family':'monospace', 'font-size':'8', fill:'rgba(0,100,150,0.3)', 'letter-spacing':'1' }, '↑ N'));
svg.appendChild(gMeta);

/* ── Tooltip ──────────────────────────────────────────────────── */
const tip    = document.getElementById('room-tip');
const tipLbl = document.getElementById('tip-label');
const tipSub = document.getElementById('tip-sub');
const tipSts = document.getElementById('tip-status');
const tipAct = document.getElementById('tip-action');

let tipX = 0, tipY = 0;

document.addEventListener('mousemove', e => { tipX = e.clientX; tipY = e.clientY; });

function showTip(room) {
    const visited = isVisited(room);
    tipLbl.textContent = room.label;
    tipSub.textContent = `// ${room.sub}`;
    if (room.id === 'ops') {
        tipSts.textContent = '▸ current location';
        tipSts.className = '';
        tipAct.textContent = '';
    } else {
        tipSts.textContent = visited ? '✓ visited' : '○ unvisited';
        tipSts.className   = visited ? '' : 'unvisited';
        tipAct.textContent = room.href ? '— click to enter —' : '';
    }
    tip.classList.remove('hidden');
    positionTip();
}

function positionTip() {
    const offX = tipX + 16, offY = tipY - 8;
    const r    = tip.getBoundingClientRect();
    tip.style.left = Math.min(offX, window.innerWidth  - r.width  - 10) + 'px';
    tip.style.top  = Math.min(offY, window.innerHeight - r.height - 10) + 'px';
}

function hideTip() { tip.classList.add('hidden'); }

/* ── Events ───────────────────────────────────────────────────── */
gRooms.querySelectorAll('.room-group').forEach(g => {
    const room = ROOMS.find(r => r.id === g.dataset.id);
    if (!room) return;

    g.addEventListener('mouseenter', () => showTip(room));
    g.addEventListener('mouseleave', hideTip);
    g.addEventListener('mousemove',  positionTip);

    if (room.href) {
        g.addEventListener('click', () => { window.location.href = room.href; });
        g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = room.href; });
    }
});

/* ── Progress strip ───────────────────────────────────────────── */
const TRACKABLE = ROOMS.filter(r => r.flag);
const progCount = document.getElementById('prog-count');
const progSts   = document.getElementById('prog-status');

function updateProgress() {
    const n = TRACKABLE.filter(r => isVisited(r)).length;
    progCount.textContent = `${n} / ${TRACKABLE.length} rooms visited`;
    if (n >= TRACKABLE.length) {
        progSts.textContent = '— case resolved —';
        progSts.classList.add('solved');
    }
}

updateProgress();

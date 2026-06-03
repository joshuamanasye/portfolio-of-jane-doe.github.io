/* ── Loader ───────────────────────────────────────────────────── */
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (!loader) return;
        loader.classList.add('fade-out');
        setTimeout(() => loader.remove(), 700);
    }, 1000);
});

/* ── Findings — each evidence marker maps to a skill category ──── */
const FINDINGS = {
    skull: {
        tag:    'exhibit a',
        region: 'cranial cavity',
        title:  'Languages',
        lore:   'What she thinks in. The examiners opened the skull and found syntax where the brain should be — clean, recursive, still running.',
        skills: [
            { name: 'JavaScript', pct: 92 },
            { name: 'Python',     pct: 85 },
            { name: 'TypeScript', pct: 78 },
            { name: 'GLSL',       pct: 60 },
        ],
    },
    hands: {
        tag:    'exhibit b',
        region: 'hands & fingers',
        title:  'Frameworks',
        lore:   'What she builds with. The fingertips were worn smooth, as though they had assembled the same structures ten thousand times in the dark.',
        skills: [
            { name: 'React',    pct: 88 },
            { name: 'Node.js',  pct: 82 },
            { name: 'Three.js', pct: 75 },
            { name: 'D3.js',    pct: 70 },
        ],
    },
    chest: {
        tag:    'exhibit c',
        region: 'chest cavity',
        title:  'Tools',
        lore:   'Residues identified in the tissue. Toxicology returned results no one had seen before — versioned, committed, sealed.',
        skills: [
            { name: 'Git',      pct: 90 },
            { name: 'MongoDB',  pct: 72 },
            { name: 'Firebase', pct: 68 },
            { name: 'Webpack',  pct: 65 },
        ],
    },
    skin: {
        tag:    'exhibit d',
        region: 'dermal markings',
        title:  'Design',
        lore:   'Symbols carved before she had a name for them. The structure told a different story than the flesh — proportion, motion, an eye for what was missing.',
        skills: [
            { name: 'CSS / Motion', pct: 88 },
            { name: 'Figma',        pct: 80 },
            { name: 'Canvas API',   pct: 76 },
            { name: 'WebGL',        pct: 58 },
        ],
    },
    cavity: {
        tag:    'exhibit e',
        region: 'sealed cavity',
        title:  'Other.',
        lore:   'The last findings were not entered into the record.<br><br>The lead examiner resigned the following morning. His notes read only: <em class="highlight-red">she was smiling.</em>',
        caseline: '— CASE FILE NO. 001 — UNRESOLVED —',
        skills: [],
    },
};

/* ── Elements ─────────────────────────────────────────────────── */
const pins        = Array.from(document.querySelectorAll('.pin'));
const card        = document.getElementById('finding');
const cardBody    = document.getElementById('finding-body');
const closeBtn    = document.getElementById('finding-close');
const examineHint = document.getElementById('examine-hint');
const bodyEl      = document.getElementById('body');

const ZOOM = 2.1;   // zoom factor when a marker is examined

let activePin   = null;
const seen      = new Set();

/* ── Build + open a finding ───────────────────────────────────── */
function buildFinding(f) {
    let html =
        `<div class="finding-tag">${f.tag}<span class="ft-region">// ${f.region}</span></div>` +
        `<p class="finding-h2">${f.title}</p>` +
        `<p class="finding-lore">${f.lore}</p>`;

    if (f.skills.length) {
        html += '<div class="skill-list">';
        for (const s of f.skills) {
            html +=
                `<div class="skill-row">` +
                    `<span class="skill-name">${s.name}</span>` +
                    `<div class="skill-bar"><div class="skill-fill" data-pct="${s.pct}"></div></div>` +
                    `<span class="skill-pct">${s.pct}</span>` +
                `</div>`;
        }
        html += '</div>';
    }

    if (f.caseline) {
        html += `<p class="finding-caseline">${f.caseline}</p>`;
    }

    cardBody.innerHTML = html;

    // Animate bars from 0 → target after layout settles
    requestAnimationFrame(() => requestAnimationFrame(() => {
        cardBody.querySelectorAll('.skill-fill').forEach(fill => {
            fill.style.width = fill.dataset.pct + '%';
        });
    }));
}

function openFinding(pin) {
    const key = pin.dataset.finding;
    const f   = FINDINGS[key];
    if (!f) return;

    if (activePin) activePin.classList.remove('pin-active');
    activePin = pin;
    pin.classList.add('pin-active', 'pin-seen');
    seen.add(key);

    // Zoom the body in and bring the clicked marker to centre
    const px = parseFloat(pin.style.left);   // % within #body
    const py = parseFloat(pin.style.top);
    const tx = -(px - 50) * ZOOM;             // % of body box
    const ty = -(py - 50) * ZOOM;
    bodyEl.style.transform = `translate(${tx.toFixed(2)}%, ${ty.toFixed(2)}%) scale(${ZOOM})`;

    buildFinding(f);
    card.classList.remove('hidden');
    dismissHint();
    checkComplete();
}

function closeFinding() {
    card.classList.add('hidden');
    bodyEl.style.transform = '';   // zoom back out
    if (activePin) { activePin.classList.remove('pin-active'); activePin = null; }
}

function dismissHint() {
    if (examineHint) examineHint.classList.add('hidden');
}

/* When every marker has been examined, mark the case file ──────── */
function checkComplete() {
    if (seen.size >= pins.length) {
        try { localStorage.setItem('examined_skills', '1'); } catch (e) {}
        const room = document.querySelector('#case-strip .cs-room');
        if (room) room.textContent = 'examination complete';
    }
}

/* ── Events ───────────────────────────────────────────────────── */
pins.forEach(pin => {
    pin.addEventListener('click', () => {
        if (pin === activePin) { closeFinding(); }
        else { openFinding(pin); }
    });
});

closeBtn.addEventListener('click', closeFinding);

// Clicking anywhere that isn't a pin or the card closes the finding
document.addEventListener('click', e => {
    if (card.classList.contains('hidden')) return;
    if (e.target.closest('.pin') || e.target.closest('#finding')) return;
    closeFinding();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeFinding(); return; }
    // number keys 1–5 select the matching pin
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= pins.length) {
        const pin = pins[n - 1];
        if (pin === activePin) closeFinding();
        else openFinding(pin);
    }
});
try { localStorage.setItem('visited_skills',  '1'); } catch(e) {}

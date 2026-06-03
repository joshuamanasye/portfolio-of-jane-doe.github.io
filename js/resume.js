/* ── Loader ───────────────────────────────────────────────────── */
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        loader.classList.add('fade-out');
        setTimeout(() => loader.remove(), 700);
    }, 1000);
});

/* ── Stamp glitch on hover ────────────────────────────────────── */
const stamp = document.getElementById('doc-stamp');
if (stamp) {
    let glitchTimer;
    stamp.addEventListener('mouseenter', () => {
        clearInterval(glitchTimer);
        glitchTimer = setInterval(() => {
            stamp.style.opacity = Math.random() > 0.3 ? '0.18' : '0.06';
            stamp.style.transform = `rotate(-14deg) translateX(${(Math.random()-0.5)*2}px)`;
        }, 80);
    });
    stamp.addEventListener('mouseleave', () => {
        clearInterval(glitchTimer);
        stamp.style.opacity = '';
        stamp.style.transform = 'rotate(-14deg)';
    });
}

const stamp2 = document.getElementById('doc-stamp-2');
if (stamp2) {
    let glitchTimer2;
    stamp2.addEventListener('mouseenter', () => {
        clearInterval(glitchTimer2);
        glitchTimer2 = setInterval(() => {
            stamp2.style.opacity = Math.random() > 0.3 ? '0.14' : '0.04';
            stamp2.style.transform = `rotate(8deg) translateX(${(Math.random()-0.5)*2}px)`;
        }, 90);
    });
    stamp2.addEventListener('mouseleave', () => {
        clearInterval(glitchTimer2);
        stamp2.style.opacity = '';
        stamp2.style.transform = 'rotate(8deg)';
    });
}

/* ── COD field typewrite after document develops ──────────────── */
const codEl = document.getElementById('cod-val');
const COD_OPTIONS = [
    'unknown',
    'cardiac arrest',
    'exsanguination',
    'unknown',
    'unknown',
    'asphyxiation',
    'unknown',
    '— classified —',
];

let codIdx = 0;
let codTimer;

function cycleCOD() {
    if (!codEl) return;
    codIdx = (codIdx + 1) % COD_OPTIONS.length;
    codEl.style.opacity = '0';
    setTimeout(() => {
        codEl.textContent = COD_OPTIONS[codIdx];
        codEl.style.transition = 'opacity 0.3s';
        codEl.style.opacity = '';
    }, 200);
}

// Start cycling after doc develops (1.8s + 0.4s + buffer)
setTimeout(() => {
    codTimer = setInterval(cycleCOD, 2200);
}, 3000);
try { localStorage.setItem('visited_resume',  '1'); } catch(e) {}

/* ── Loader ───────────────────────────────────────────────────── */
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        loader.classList.add('fade-out');
        setTimeout(() => loader.remove(), 700);
    }, 1000);
});

/* ── Typewriter util ──────────────────────────────────────────── */
function typewrite(el, text, speed, cb) {
    el.textContent = '';
    let i = 0;
    const tick = () => {
        el.textContent += text[i++];
        if (i < text.length) setTimeout(tick, speed);
        else if (cb) setTimeout(cb, 300);
    };
    setTimeout(tick, speed);
}

/* ── Reveal util ──────────────────────────────────────────────── */
function showField(id, delay) {
    setTimeout(() => {
        const el = document.getElementById(id);
        el.classList.remove('hidden');
        el.classList.add('reveal');
        const inp = el.querySelector('input, textarea');
        if (inp) setTimeout(() => inp.focus(), 80);
    }, delay);
}

/* ── Random screen flicker ────────────────────────────────────── */
const flickerOverlay = document.getElementById('flicker-overlay');

function doFlicker() {
    if (!flickerOverlay) return;
    flickerOverlay.classList.add('on');
    setTimeout(() => {
        flickerOverlay.classList.remove('on');
        setTimeout(() => {
            flickerOverlay.classList.add('on');
            setTimeout(() => {
                flickerOverlay.classList.remove('on');
            }, 60);
        }, 80);
    }, 50);

    // Schedule next flicker at random interval
    const next = 8000 + Math.random() * 14000;
    setTimeout(doFlicker, next);
}

// Start flickering after page settles
setTimeout(doFlicker, 5000);

/* ── Init sequence ────────────────────────────────────────────── */
const lineReady = document.getElementById('line-ready');

setTimeout(() => {
    typewrite(lineReady, '> she is listening. speak.', 38, () => {
        showField('field-name', 200);
    });
    lineReady.classList.add('sys');
}, 1800);

/* ── Progressive field reveal ────────────────────────────────── */
const nameInp  = document.getElementById('inp-name');
const emailInp = document.getElementById('inp-email');
const msgInp   = document.getElementById('inp-msg');
let nameSet = false, emailSet = false;

function appendEcho(text) {
    const out = document.getElementById('output');
    const div = document.createElement('div');
    div.className = 'line echo reveal';
    div.textContent = '  ' + text;
    out.appendChild(div);
}

nameInp.addEventListener('keydown', e => {
    if (e.key === 'Enter' && nameInp.value.trim() && !nameSet) {
        e.preventDefault();
        nameSet = true;
        appendEcho(nameInp.value.trim());
        nameInp.blur();
        nameInp.readOnly = true;
        showField('field-email', 300);
    }
});

emailInp.addEventListener('keydown', e => {
    if (e.key === 'Enter' && emailInp.value.trim() && !emailSet) {
        e.preventDefault();
        emailSet = true;
        appendEcho(emailInp.value.trim());
        emailInp.blur();
        emailInp.readOnly = true;
        showField('field-msg', 300);
        setTimeout(() => showField('field-submit', 600), 100);
    }
});

/* ── Form submit ─────────────────────────────────────────────── */
document.getElementById('contact-form').addEventListener('submit', e => {
    e.preventDefault();
    const name  = nameInp.value.trim();
    const email = emailInp.value.trim();
    const msg   = msgInp.value.trim();
    if (!name || !email || !msg) return;

    /* In a real build, wire to your backend / formspree / etc. */
    /* fetch('https://formspree.io/f/YOUR_ID', { method:'POST', body: JSON.stringify({name,email,msg}), headers:{'Content-Type':'application/json'} }) */

    document.getElementById('contact-form').classList.add('hidden');
    const sent = document.getElementById('sent-msg');
    sent.classList.remove('hidden');

    /* Staggered typewriter for reply lines */
    const lines = sent.querySelectorAll('.line.sys');
    lines.forEach((l, i) => {
        const txt = l.textContent;
        l.textContent = '';
        setTimeout(() => typewrite(l, txt, 30), i * 700);
    });

    /* Whisper line — Jane's final word, arrives last */
    const WHISPERS = [
        'she was never the one who was lost.',
        'the drawer was always open.',
        'you opened it. now she knows where you are.',
        'they buried her smiling. she hasn\'t stopped.',
        'no cause of death. no next of kin. no end.',
    ];
    const whisperEl = document.getElementById('whisper-line');
    const whisper   = WHISPERS[Math.floor(Math.random() * WHISPERS.length)];
    setTimeout(() => {
        typewrite(whisperEl, '— ' + whisper, 28);
    }, lines.length * 700 + 600);
});

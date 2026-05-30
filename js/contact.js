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

/* ── Init sequence ────────────────────────────────────────────── */
const lineReady = document.getElementById('line-ready');

setTimeout(() => {
    typewrite(lineReady, '> ready. speak.', 38, () => {
        showField('field-name', 200);
    });
    lineReady.classList.add('sys');
}, 1100);

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
    /* fetch('https://formspree.io/f/YOUR_ID', { method:'POST', ... }) */

    document.getElementById('contact-form').classList.add('hidden');
    const sent = document.getElementById('sent-msg');
    sent.classList.remove('hidden');

    /* Staggered typewriter for each reply line */
    const lines = sent.querySelectorAll('.line');
    lines.forEach((l, i) => {
        const txt = l.textContent;
        l.textContent = '';
        setTimeout(() => typewrite(l, txt, 30), i * 600);
    });
});

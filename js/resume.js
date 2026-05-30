/* ── Loader ───────────────────────────────────────────────────── */
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        loader.classList.add('fade-out');
        setTimeout(() => loader.remove(), 700);
    }, 1000);
});

/* ── Subtle stamp glitch on hover ─────────────────────────────── */
const stamp = document.getElementById('doc-stamp');
if (stamp) {
    let glitchTimer;
    stamp.addEventListener('mouseenter', () => {
        clearInterval(glitchTimer);
        glitchTimer = setInterval(() => {
            stamp.style.opacity = Math.random() > 0.3 ? '0.2' : '0.08';
            stamp.style.transform = `rotate(-14deg) translateX(${(Math.random()-0.5)*2}px)`;
        }, 80);
    });
    stamp.addEventListener('mouseleave', () => {
        clearInterval(glitchTimer);
        stamp.style.opacity = '';
        stamp.style.transform = 'rotate(-14deg)';
    });
}

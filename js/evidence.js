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

/* Mark visited */
try { localStorage.setItem('visited_evidence', '1'); localStorage.setItem('last_room', 'evidence'); } catch (e) {}

/* ── Drawer interaction ───────────────────────────────────────── */
const drawers = Array.from(document.querySelectorAll('.drawer'));
let openDrawer = null;

function openDrw(drawer) {
    if (drawer === openDrawer) return;
    if (openDrawer) closeDrw(openDrawer);
    drawer.classList.add('open');
    openDrawer = drawer;

    // Add close hint if not already there
    if (!drawer.querySelector('.close-hint')) {
        const hint = document.createElement('p');
        hint.className = 'close-hint';
        hint.textContent = '[ click anywhere to close ]';
        drawer.querySelector('.drawer-content').appendChild(hint);
    }
}

function closeDrw(drawer) {
    drawer.classList.remove('open');
    if (openDrawer === drawer) openDrawer = null;
}

drawers.forEach(drawer => {
    drawer.addEventListener('click', e => {
        if (drawer.classList.contains('open')) {
            // click inside open drawer — ignore (allow text selection etc)
            return;
        }
        openDrw(drawer);
    });
});

// Click outside open drawer closes it
document.addEventListener('click', e => {
    if (!openDrawer) return;
    if (e.target.closest('.drawer') === openDrawer) return;
    closeDrw(openDrawer);
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && openDrawer) closeDrw(openDrawer);
});

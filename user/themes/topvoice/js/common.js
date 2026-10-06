// Shared by every page that has the header and the off-canvas menu. The home
// page's scene code lives in scripts.js; other pages load only this file.

function toggleMenu() {
    const open = document.getElementById('offcanvas').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('open', open);
    document.getElementById('hamburger').classList.toggle('open', open);
    document.getElementById('offcanvas').setAttribute('aria-hidden', !open);
}
function closeMenu() {
    document.getElementById('offcanvas').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
    document.getElementById('hamburger').classList.remove('open');
    document.getElementById('offcanvas').setAttribute('aria-hidden', 'true');
}
// Smooth-scrolls to a home section. Returns false when it handled the click,
// true when the section is not on this page, so the link's href (the home page
// plus #section) is followed instead.
function goTo(id) {
    const el = document.getElementById(id);
    if (!el) return true;
    closeMenu();
    setTimeout(() => {
        const top = el.getBoundingClientRect().top + window.scrollY - document.querySelector('nav').offsetHeight;
        window.scrollTo({ top, behavior: 'smooth' });
    }, 280);
    return false;
}

// Nav scroll
window.addEventListener('scroll', () => {
    document.querySelector('header nav').classList.toggle('scrolled', window.scrollY > 80);
}, { passive: true });

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
function goTo(id) {
    closeMenu();
    setTimeout(() => { document.getElementById(id).scrollIntoView({ behavior: 'smooth' }); }, 280);
}
function setLang(lang) {
    document.getElementById('body').className = 'lang-' + lang;
    document.querySelectorAll('.offcanvas-lang button').forEach((btn, i) => {
        btn.classList.toggle('active', (i === 0 && lang === 'es') || (i === 1 && lang === 'ca'));
    });
}
// Nav scroll
window.addEventListener('scroll', () => {
    document.querySelector('header nav').classList.toggle('scrolled', window.scrollY > 80);
}, { passive: true });

// GSAP
gsap.registerPlugin(ScrollTrigger);

const bgLeopard = document.getElementById('bg-leopard');

// Blobs: se desvanecen despacio, durante varias secciones
gsap.to('.bg-blobs', { opacity: 0.06, ease: 'power1.in',
    scrollTrigger: { trigger: '#hero', start: 'bottom 60%', end: 'bottom -300%', scrub: 2 } });
gsap.to('.bg-tint',  { opacity: 1, ease: 'power1.out',
    scrollTrigger: { trigger: '#hero', start: 'bottom 60%', end: 'bottom -300%', scrub: 2 } });

// Leopardo: SVG inline con <pattern> — bounce con transform SVG manual
async function setupLeopard() {
    try {
        const response = await fetch('assets/images/leopard-tile.svg');
        const text     = await response.text();
        const src      = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;

        // Medir centros con getBBox() — requiere que el SVG esté en el DOM
        src.style.cssText = 'position:fixed;top:0;left:0;width:1920px;height:1920px;opacity:0;pointer-events:none;';
        document.body.appendChild(src);

        const rnd      = (a, b) => a + Math.random() * (b - a);
        const ns       = 'http://www.w3.org/2000/svg';

        const pathData = Array.from(src.querySelectorAll('.st1')).map(p => {
            const bb    = p.getBBox();
            const clone = p.cloneNode(true);
            clone.setAttribute('fill', '#0d0a04');
            clone.removeAttribute('class');
            return { clone, cx: bb.x + bb.width / 2, cy: bb.y + bb.height / 2, ok: bb.width > 1 };
        });

        document.body.removeChild(src);

        // Construir SVG + pattern
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('xmlns', ns);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.cssText = 'position:absolute;inset:0;display:block;';

        const defs = document.createElementNS(ns, 'defs');
        const pat  = document.createElementNS(ns, 'pattern');
        pat.id = 'leo-pat';
        pat.setAttribute('patternUnits', 'userSpaceOnUse');

        const g = document.createElementNS(ns, 'g');
        pathData.forEach(({ clone }) => g.appendChild(clone));
        pat.appendChild(g);
        defs.appendChild(pat);
        svg.appendChild(defs);

        const rect = document.createElementNS(ns, 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', 'url(#leo-pat)');
        svg.appendChild(rect);
        bgLeopard.appendChild(svg);

        function applySize(size) {
            const cx = window.innerWidth  / 2;
            const cy = window.innerHeight / 2;
            pat.setAttribute('x',      cx - size / 2);
            pat.setAttribute('y',      cy - size / 2);
            pat.setAttribute('width',  size);
            pat.setAttribute('height', size);
            g.setAttribute('transform', `scale(${size / 1920})`);
        }
        applySize(3500);

        // Factor global de entrada (7→1): todos los spots empiezan grandes y encogen con el scroll
        const spotEntry  = { scale: 7 };
        const patState   = { size: 3500 };
        const leopardTl  = gsap.timeline();
        leopardTl
            .fromTo(bgLeopard,  { opacity: 0 }, { opacity: 0.9, ease: 'power2.inOut', duration: .5 }, 0)
            .fromTo(patState,   { size: 3500 }, { size: 800,    ease: 'power2.inOut', duration: 1,
                onUpdate() { applySize(patState.size); } }, 0)
            .fromTo(spotEntry,  { scale: 7 },   { scale: 1,     ease: 'power2.out',   duration: 0.5 }, 0);

        // Spots: bounce continuo (escala pequeña sobre el factor global)
        const bounceStates = pathData
            .filter(({ ok }) => ok)
            .map(({ clone, cx, cy }) => {
                const st = { s: 1 + rnd(0.01, 0.04), o: rnd(0.55, 0.9) };
                gsap.to(st, {
                    s: st.s + rnd(0.01, 0.03), duration: rnd(2, 4.5),
                    delay: rnd(0, 5), repeat: -1, yoyo: true, ease: 'sine.inOut',
                });
                return { st, clone, cx, cy };
            });

        ScrollTrigger.create({
            trigger:             '#hero',
            start:               'top top',
            end:                 'bottom -150%',
            scrub:               3,
            invalidateOnRefresh: true,
            animation:           leopardTl,
        });

        // Un único ticker para todos los writes — evita 249 onUpdate individuales
        gsap.ticker.add(() => {
            const entry   = spotEntry.scale;
            const settled = entry <= 1.05; // spots ya colocados, activar bounce de opacidad
            bounceStates.forEach(({ st, clone, cx, cy }) => {
                const s = st.s * entry;
                clone.setAttribute('transform',
                    `translate(${cx * (1 - s)},${cy * (1 - s)}) scale(${s})`);
                clone.setAttribute('opacity', settled ? st.o : 0.95);
            });
        });

    } catch (_) { /* silencioso */ }
}
setupLeopard();

// Section content entrance animations
['#about', '#video', '#gallery', '#contact'].forEach(sel => {
    const section = document.querySelector(sel);
    if (!section) return;

    const tag     = section.querySelector('.section-tag');
    const titles  = section.querySelectorAll('.section-title');
    const divider = section.querySelector('.divider');
    const body    = section.querySelectorAll([
        '.about-text p', '.about-img',
        '.video-wrap',
        '.gallery-grid',
        '.contact-backdrop-grid',
        '.contact-form',
    ].join(', '));

    const to = { force3D: true };

    const stl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            once: true,
        }
    });

    if (tag)           stl.fromTo(tag,     { y: 18, autoAlpha: 0 }, { ...to, y: 0, autoAlpha: 1, duration: 0.5, ease: 'power2.out' });
    if (titles.length) stl.fromTo(titles,  { y: 28, autoAlpha: 0 }, { ...to, y: 0, autoAlpha: 1, duration: 0.6, ease: 'power2.out', stagger: 0.08 }, '-=0.3');
    if (divider)       stl.fromTo(divider, { scaleX: 0 },           { ...to, scaleX: 1, transformOrigin: 'left center', duration: 0.5, ease: 'power2.out' }, '-=0.25');
    if (body.length)   stl.fromTo(body,    { y: 36, autoAlpha: 0 }, { ...to, y: 0, autoAlpha: 1, duration: 0.7, ease: 'power2.out', stagger: 0.12 }, '-=0.3');
});


function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn  = form.querySelector('button[type="submit"]');
    const isCA = document.getElementById('body').classList.contains('lang-ca');

    const msgs = {
        sending: isCA ? 'Enviant…'          : 'Enviando…',
        ok:      isCA ? '¡Missatge enviat!'  : '¡Mensaje enviado!',
        error:   isCA ? 'Error en enviar. Torna a intentar-ho.' : 'Error al enviar. Por favor inténtalo de nuevo.',
    };

    btn.disabled    = true;
    btn.textContent = msgs.sending;
    clearFormMsg(form);

    fetch('contact.php', {
        method:  'POST',
        body:    new FormData(form),
    })
    .then(r => {
        const status = r.status;
        return r.text().then(text => ({ status, text }));
    })
    .then(({ status, text }) => {
        let data;
        try { data = JSON.parse(text); } catch(e) {
            showFormMsg(form, msgs.error, 'error');
            return;
        }
        if (data.ok) {
            form.reset();
            showFormMsg(form, msgs.ok, 'success');
        } else {
            showFormMsg(form, msgs.error, 'error');
        }
    })
    .catch(() => showFormMsg(form, msgs.error, 'error'))
    .finally(() => {
        btn.disabled    = false;
        btn.innerHTML   = '<span data-lang="es">Enviar</span><span data-lang="ca">Enviar</span>';
    });
}

function showFormMsg(form, text, type) {
    clearFormMsg(form);
    const el = document.createElement('p');
    el.className      = 'form-msg form-msg--' + type;
    el.textContent    = text;
    form.appendChild(el);
}

function clearFormMsg(form) {
    form.querySelectorAll('.form-msg').forEach(el => el.remove());
}
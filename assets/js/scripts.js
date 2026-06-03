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
    setTimeout(() => {
        const el  = document.getElementById(id);
        const top = el.getBoundingClientRect().top + window.scrollY - document.querySelector('nav').offsetHeight;
        window.scrollTo({ top, behavior: 'smooth' });
    }, 280);
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
            start:               'top top+=50',  // 50px de margen → estado "antes" limpio en scrollY=0
            end:                 'bottom -150%',
            scrub:               3,
            invalidateOnRefresh: true,
            animation:           leopardTl,
        });

        // Un único ticker para todos los writes — evita 249 onUpdate individuales
        gsap.ticker.add(() => {
            const entry   = spotEntry.scale;
            const settled = entry <= 1.05;
            bounceStates.forEach(({ st, clone, cx, cy }) => {
                const s = st.s * entry;
                clone.setAttribute('transform',
                    `translate(${cx * (1 - s)},${cy * (1 - s)}) scale(${s})`);
                clone.setAttribute('opacity', settled ? st.o : 0.95);
            });
        });

        // Refresh après setup async perquè tots els triggers recalculin posicions
        ScrollTrigger.refresh();

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
        '.about-text p:not(.section-tag)', '.about-img',
        '.video-wrap',
        '.gallery-grid',
        '.contact-backdrop-grid',
        '.contact-form',
    ].join(', '));

    const to  = { force3D: true };
    const stl = gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top 82%', once: true }
    });

    if (tag)           stl.fromTo(tag,     { y: 18, autoAlpha: 0 }, { ...to, y: 0, autoAlpha: 1, duration: 0.5, ease: 'power2.out' });
    if (titles.length) stl.fromTo(titles,  { y: 28, autoAlpha: 0 }, { ...to, y: 0, autoAlpha: 1, duration: 0.6, ease: 'power2.out', stagger: 0.08 }, '-=0.3');
    if (divider)       stl.fromTo(divider, { scaleX: 0 },           { ...to, scaleX: 1, transformOrigin: 'left center', duration: 0.5, ease: 'power2.out' }, '-=0.25');
    if (body.length)   stl.fromTo(body,    { y: 36, autoAlpha: 0 }, { ...to, y: 0, autoAlpha: 1, duration: 0.7, ease: 'power2.out', stagger: 0.12 }, '-=0.3');
});

// Director cards fire as soon as .directors enters the viewport from below,
// guaranteed to be after the section content above has already animated.
const directorCards = document.querySelectorAll('.director-card');
if (directorCards.length) {
    gsap.fromTo(directorCards,
        { y: 36, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power2.out', stagger: 0.15, force3D: true,
          scrollTrigger: { trigger: '.directors', start: 'top 60%', once: true } }
    );
}


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

function playPromo() {
    const video = document.getElementById('promo-video');
    const btn   = document.querySelector('.play-btn');
    if (!video) return;
    video.controls = true;
    video.play();
    btn.classList.add('hidden');
}
// Gallery — Slick Slider
$(function () {
    $('#gallerySlider').slick({
        slidesToShow:   1,
        slidesToScroll: 1,
        infinite:       false,
        dots:           true,
        appendDots:     $('#galleryDots'),
        arrows:         false,
        swipeToSlide:   true,
        speed:          450,
        cssEase:        'ease',
        mobileFirst:    true,
        responsive: [
            {
                breakpoint: 1600,
                settings: { slidesToShow: 2 }
            },
            {
                breakpoint: 1024,
                settings: { slidesToShow: 2 }
            }
        ]
    });
});

// Blur gallery as contact slides over it
gsap.to('#gallery', {
    filter: 'blur(8px)',
    ease: 'none',
    scrollTrigger: {
        trigger: '#contact',
        start: 'top 60%',
        end:   'top 10%',
        scrub: 1.5,
    }
});

// Lightbox
(function () {
    // Collect original (non-cloned) items only — Slick clones slides for infinite
    const imgs = Array.from(document.querySelectorAll('#gallerySlider .gallery-item img'));
    if (!imgs.length) return;

    // Build DOM
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-hidden', 'true');
    lb.innerHTML = `
        <div class="lb-overlay"></div>
        <span class="lb-counter"></span>
        <button class="lb-close" aria-label="Cerrar">✕</button>
        <button class="lb-prev" aria-label="Anterior">‹</button>
        <button class="lb-next" aria-label="Siguiente">›</button>
        <figure class="lb-figure">
            <img class="lb-img" src="" alt="">
            <figcaption class="lb-caption"></figcaption>
        </figure>`;
    document.body.appendChild(lb);

    const lbImg     = lb.querySelector('.lb-img');
    const lbCaption = lb.querySelector('.lb-caption');
    const lbCounter = lb.querySelector('.lb-counter');
    const lbPrev    = lb.querySelector('.lb-prev');
    const lbNext    = lb.querySelector('.lb-next');

    let current = 0;

    function show(idx) {
        current = idx;
        const img   = imgs[idx];
        const title = img.getAttribute('title') || '';
        lbImg.classList.add('is-loading');
        const tmp = new Image();
        tmp.onload = () => { lbImg.src = tmp.src; lbImg.classList.remove('is-loading'); };
        tmp.src = img.src;
        lbImg.alt       = img.alt;
        lbCaption.textContent = title;
        lbCaption.hidden      = !title;
        lbCounter.textContent = `${idx + 1} / ${imgs.length}`;
        lbPrev.disabled = idx === 0;
        lbNext.disabled = idx === imgs.length - 1;
    }

    function open(idx) {
        show(idx);
        lb.classList.add('is-open');
        lb.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        lb.classList.remove('is-open');
        lb.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Distinguish click from drag — ignore if pointer moved > 5px
    let dragStartX = 0;
    let dragged    = false;
    document.getElementById('gallerySlider').addEventListener('pointerdown', e => {
        dragStartX = e.clientX;
        dragged    = false;
    });
    document.getElementById('gallerySlider').addEventListener('pointermove', e => {
        if (Math.abs(e.clientX - dragStartX) > 5) dragged = true;
    });

    // Click on gallery items
    imgs.forEach((img, i) => {
        img.closest('.gallery-item').addEventListener('click', () => {
            if (dragged) return;
            open(i);
        });
    });

    lb.querySelector('.lb-overlay').addEventListener('click', close);
    lb.querySelector('.lb-close').addEventListener('click', close);
    lbPrev.addEventListener('click', () => { if (current > 0) show(current - 1); });
    lbNext.addEventListener('click', () => { if (current < imgs.length - 1) show(current + 1); });

    document.addEventListener('keydown', e => {
        if (!lb.classList.contains('is-open')) return;
        if (e.key === 'Escape')      close();
        if (e.key === 'ArrowLeft')   lbPrev.disabled || show(current - 1);
        if (e.key === 'ArrowRight')  lbNext.disabled || show(current + 1);
    });
})();

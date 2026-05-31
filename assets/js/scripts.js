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
function seededRand(seed) {
    let s = seed;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function initLeopardTransition() {
    const container = document.getElementById('bg-leopard');
    if (!container) return [];
    const rng = seededRand(42);
    const W = window.innerWidth, H = window.innerHeight;
    const count = 44;

    // Los dos blobs CSS están en top-left y bottom-right — usamos esas posiciones como origen
    const origins = [
        { x: 0.15 * W, y: 0.20 * H, color: 'rgba(192,64,224,0.82)' },
        { x: 0.80 * W, y: 0.75 * H, color: 'rgba(0,201,177,0.72)'  },
    ];

    // Variantes de border-radius para formas orgánicas (no simétricas)
    const shapes = [
        '62% 38% 55% 45% / 52% 58% 42% 48%',
        '44% 56% 38% 62% / 60% 42% 58% 40%',
        '70% 30% 48% 52% / 45% 60% 40% 55%',
        '38% 62% 60% 40% / 55% 40% 60% 45%',
        '55% 45% 70% 30% / 40% 65% 35% 60%',
    ];

    const data = [];
    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'leopard-spot';

        // Posición final dispersa por la pantalla
        const fx = (4 + rng() * 92) / 100 * W;
        const fy = (4 + rng() * 92) / 100 * H;
        const fw = 18 + rng() * 30;
        const fh = fw * (0.42 + rng() * 0.46);
        const rot = rng() * 160 - 80;

        // Posición inicial: cerca del blob de origen con algo de spread
        const orig = origins[i < count * 0.55 ? 0 : 1];
        const spread = Math.min(W, H) * 0.14;
        const ix = orig.x + (rng() - 0.5) * spread * 2.4;
        const iy = orig.y + (rng() - 0.5) * spread * 2;

        el.style.cssText = `position:absolute;left:${fx.toFixed(1)}px;top:${fy.toFixed(1)}px;width:${fw.toFixed(1)}px;height:${fh.toFixed(1)}px;border-radius:${shapes[i % shapes.length]};background:#0d0a04;transform-origin:center;will-change:transform,opacity;`;
        container.appendChild(el);
        data.push({ el, xOff: ix - fx, yOff: iy - fy, rot, color: orig.color });
    }
    return data;
}

// Nav scroll
window.addEventListener('scroll', () => {
    document.querySelector('header nav').classList.toggle('scrolled', window.scrollY > 80);
}, { passive: true });

// GSAP
gsap.registerPlugin(ScrollTrigger);

const spotData = initLeopardTransition();
const spotEls  = spotData.map(d => d.el);

// Estado inicial: grandes, desplazados al origen del blob
gsap.set(spotEls, {
    x:        (i) => spotData[i].xOff,
    y:        (i) => spotData[i].yOff,
    scale:    4.2,
    rotation: (i) => spotData[i].rot,
    opacity:  0,
    force3D:  true,
});

const tl = gsap.timeline({
    scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end:   'bottom -40%',
        scrub: 3,
    }
});

tl
    .to('.bg-blobs', { opacity: 0.06, ease: 'power1.in'  }, 0)
    .to('.bg-tint',  { opacity: 1,    ease: 'power1.out' }, 0)
    .to(spotEls, {
        x:       0,
        y:       0,
        scale:   1,
        opacity: 1,
        ease:    'power2.inOut',
        force3D: true,
        stagger: { each: 0.01, from: 'random' },
    }, 0);

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
        '.contact-grid',
    ].join(', '));

    const stl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none none',
        }
    });

    if (tag)    stl.from(tag,     { y: 18, opacity: 0, duration: 0.5, ease: 'power2.out' });
    if (titles.length) stl.from(titles, { y: 28, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08 }, '-=0.3');
    if (divider) stl.from(divider, { scaleX: 0, transformOrigin: 'left center', duration: 0.5, ease: 'power2.out' }, '-=0.25');
    if (body.length) stl.from(body, { y: 36, opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.12 }, '-=0.3');
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
    .then(r => r.json())
    .then(data => {
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
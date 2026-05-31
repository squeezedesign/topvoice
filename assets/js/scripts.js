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
// Show nav background + logo after scrolling past hero
window.addEventListener('scroll', () => {
    document.querySelector('header nav').classList.toggle('scrolled', window.scrollY > 80);
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
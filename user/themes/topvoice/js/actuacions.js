// Actuacions page: format filter and a per-concert viewer for photos and
// YouTube videos. Loaded after common.js, without jQuery, GSAP or Slick.

(function () {
    const items = Array.from(document.querySelectorAll('.arch-item'));
    if (!items.length) return;

    // Format filter
    const pills = Array.from(document.querySelectorAll('.arch-pill'));
    const empty = document.querySelector('.arch-empty');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            const format = pill.dataset.filter;
            pills.forEach(p => p.setAttribute('aria-pressed', String(p === pill)));
            let shown = 0;
            items.forEach(item => {
                const match = !format || item.dataset.format === format;
                item.hidden = !match;
                if (match) shown++;
            });
            if (empty) empty.hidden = shown > 0;
        });
    });

    // Viewer: same markup and .lb-* styles as the home page gallery
    const t = window.ARCH_I18N || {};
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-hidden', 'true');
    lb.innerHTML = `
        <div class="lb-overlay"></div>
        <span class="lb-counter"></span>
        <button class="lb-close" aria-label="${t.close || 'Tanca'}">✕</button>
        <button class="lb-prev" aria-label="${t.prev || 'Anterior'}">‹</button>
        <button class="lb-next" aria-label="${t.next || 'Següent'}">›</button>
        <figure class="lb-figure">
            <div class="lb-media"></div>
            <figcaption class="lb-caption"></figcaption>
        </figure>`;
    document.body.appendChild(lb);

    const lbMedia   = lb.querySelector('.lb-media');
    const lbCaption = lb.querySelector('.lb-caption');
    const lbCounter = lb.querySelector('.lb-counter');
    const lbPrev    = lb.querySelector('.lb-prev');
    const lbNext    = lb.querySelector('.lb-next');

    let group   = [];
    let current = 0;
    let opener  = null;

    function show(idx) {
        current = idx;
        const btn = group[idx];
        // Emptying the container also stops a playing video
        lbMedia.innerHTML = '';
        if (btn.dataset.type === 'video') {
            const wrap = document.createElement('div');
            wrap.className = 'lb-video';
            const iframe = document.createElement('iframe');
            iframe.src   = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(btn.dataset.id) + '?autoplay=1&rel=0';
            iframe.allow = 'autoplay; fullscreen; picture-in-picture';
            iframe.title = btn.getAttribute('aria-label') || '';
            wrap.appendChild(iframe);
            lbMedia.appendChild(wrap);
        } else {
            const img = document.createElement('img');
            img.className = 'lb-img is-loading';
            img.alt = btn.querySelector('img') ? btn.querySelector('img').alt : '';
            img.onload = () => img.classList.remove('is-loading');
            img.src = btn.dataset.full;
            lbMedia.appendChild(img);
        }
        const caption = btn.dataset.caption || '';
        lbCaption.textContent = caption;
        lbCaption.hidden      = !caption;
        lbCounter.textContent = group.length > 1 ? `${idx + 1} / ${group.length}` : '';
        lbPrev.hidden = lbNext.hidden = group.length < 2;
        lbPrev.disabled = idx === 0;
        lbNext.disabled = idx === group.length - 1;
    }

    function open(btn) {
        group  = Array.from(btn.closest('.arch-gallery').querySelectorAll('.arch-thumb'));
        opener = btn;
        show(group.indexOf(btn));
        lb.classList.add('is-open');
        lb.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        lb.querySelector('.lb-close').focus();
    }

    function close() {
        lb.classList.remove('is-open');
        lb.setAttribute('aria-hidden', 'true');
        lbMedia.innerHTML = '';
        document.body.style.overflow = '';
        if (opener) opener.focus();
    }

    document.querySelectorAll('.arch-thumb').forEach(btn => {
        btn.addEventListener('click', () => open(btn));
    });

    lb.querySelector('.lb-overlay').addEventListener('click', close);
    lb.querySelector('.lb-close').addEventListener('click', close);
    lbPrev.addEventListener('click', () => { if (current > 0) show(current - 1); });
    lbNext.addEventListener('click', () => { if (current < group.length - 1) show(current + 1); });

    document.addEventListener('keydown', e => {
        if (!lb.classList.contains('is-open')) return;
        if (e.key === 'Escape')     close();
        if (e.key === 'ArrowLeft')  lbPrev.disabled || show(current - 1);
        if (e.key === 'ArrowRight') lbNext.disabled || show(current + 1);
    });
})();

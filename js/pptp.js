(function () {
    if (!document.body.classList.contains('pptp-story')) return;

    // ---- reveal on scroll ----
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        var ro = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
        reveals.forEach(function (el) { ro.observe(el); });
    } else {
        reveals.forEach(function (el) { el.classList.add('is-in'); });
    }

    // ---- chapter rail ----
    var links = {};
    document.querySelectorAll('.pptp-rail a[data-rail]').forEach(function (a) { links[a.getAttribute('data-rail')] = a; });
    var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-chapter]'));
    function setActive(id) {
        Object.keys(links).forEach(function (k) { links[k].classList.toggle('is-active', k === id); });
    }
    function onScroll() {
        var mid = window.innerHeight * 0.4, current = chapters[0];
        chapters.forEach(function (c) { if (c.getBoundingClientRect().top <= mid) current = c; });
        if (current) setActive(current.id);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    // ---- smooth in-page links (hash only; case-study.js skips them) ----
    document.addEventListener('click', function (e) {
        var a = e.target.closest('a[href^="#"]');
        if (!a || a.getAttribute('href').length < 2) return;
        var t = document.getElementById(a.getAttribute('href').slice(1));
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', a.getAttribute('href'));
    });

    // ---- autoplay only while visible ----
    var vids = document.querySelectorAll('video.pptp-autoplay');
    if ('IntersectionObserver' in window) {
        var vo = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                var v = e.target;
                if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
                else v.pause();
            });
        }, { threshold: 0.25 });
        vids.forEach(function (v) { v.muted = true; vo.observe(v); });
    }

    // ---- lightbox ----
    var box = document.getElementById('pptp-lightbox');
    if (!box) return;
    var img = box.querySelector('[data-lightbox-img]');
    var cap = box.querySelector('[data-lightbox-caption]');
    var prev = box.querySelector('[data-lightbox-prev]');
    var next = box.querySelector('[data-lightbox-next]');
    var items = [], idx = 0, lastFocus = null;

    function groupItems(group) {
        return Array.prototype.slice.call(document.querySelectorAll('[data-lightbox-open][data-lightbox-group="' + group + '"]'));
    }
    function show(i) {
        idx = (i + items.length) % items.length;
        var el = items[idx];
        img.src = el.getAttribute('data-src');
        img.alt = el.querySelector('img') ? el.querySelector('img').alt : '';
        cap.textContent = (el.getAttribute('data-caption') || '') + (items.length > 1 ? '  ·  ' + (idx + 1) + ' / ' + items.length : '');
        prev.hidden = next.hidden = items.length < 2;
    }
    function open(el) {
        items = groupItems(el.getAttribute('data-lightbox-group'));
        lastFocus = el;
        box.hidden = false;
        document.body.classList.add('pptp-lightbox-open');
        show(items.indexOf(el));
        box.querySelector('[data-lightbox-close]').focus();
    }
    function close() {
        box.hidden = true;
        img.removeAttribute('src');
        document.body.classList.remove('pptp-lightbox-open');
        if (lastFocus) lastFocus.focus();
    }

    document.addEventListener('click', function (e) {
        var el = e.target.closest('[data-lightbox-open]');
        if (el) { e.preventDefault(); open(el); return; }
        if (box.hidden) return;
        if (e.target.closest('[data-lightbox-close]') || e.target === box) close();
        else if (e.target.closest('[data-lightbox-prev]')) show(idx - 1);
        else if (e.target.closest('[data-lightbox-next]')) show(idx + 1);
    });
    document.addEventListener('keydown', function (e) {
        if (box.hidden) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') show(idx - 1);
        else if (e.key === 'ArrowRight') show(idx + 1);
    });
})();

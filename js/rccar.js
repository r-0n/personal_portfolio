(function () {
    if (!document.body.classList.contains('rccar-story')) return;

    /* ---- reveal ---- */
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) e.target.classList.add('is-in');
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    document.querySelectorAll('.rccar-story .reveal').forEach(function (el) {
        io.observe(el);
    });

    /* ---- chapter rail ---- */
    var chapters = Array.prototype.slice.call(
        document.querySelectorAll('.rccar-rail a[data-chapter]')
    );
    var sections = chapters.map(function (a) {
        return document.getElementById(a.getAttribute('data-chapter'));
    }).filter(Boolean);

    function setActive(id) {
        chapters.forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('data-chapter') === id);
        });
    }

    if (sections.length) {
        var chapterIo = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) setActive(e.target.id);
            });
        }, { threshold: 0.28, rootMargin: '-20% 0px -45% 0px' });
        sections.forEach(function (s) { chapterIo.observe(s); });
    }

    /* ---- shared lightbox across image groups ---- */
    (function lightboxSystem() {
        var lb = document.getElementById('rccar-lightbox');
        if (!lb) return;

        var lbImg = lb.querySelector('[data-lightbox-img]');
        var lbCap = lb.querySelector('[data-lightbox-caption]');
        var groups = {};
        var activeGroup = null;
        var activeIndex = 0;
        var lastFocus = null;

        document.querySelectorAll('[data-lightbox-open]').forEach(function (btn) {
            var group = btn.getAttribute('data-lightbox-group') || 'default';
            if (!groups[group]) groups[group] = [];
            var thumb = btn.querySelector('img');
            var index = groups[group].length;
            btn.setAttribute('data-index', String(index));
            groups[group].push({
                src: btn.getAttribute('data-src'),
                alt: thumb ? thumb.alt : '',
                caption: btn.getAttribute('data-caption') || '',
                btn: btn
            });
        });

        function paint() {
            var items = groups[activeGroup];
            if (!items || !items[activeIndex] || !lbImg) return;
            var item = items[activeIndex];
            lbImg.src = item.src;
            lbImg.alt = item.alt;
            if (lbCap) lbCap.textContent = item.caption;
        }

        function syncCarousel() {
            if (activeGroup !== 'concept') return;
            var root = document.querySelector('[data-concept-carousel]');
            if (!root) return;
            root.querySelectorAll('.rccar-carousel-slide').forEach(function (s, idx) {
                s.classList.toggle('is-on', idx === activeIndex);
            });
        }

        function open(group, index) {
            if (!groups[group] || !groups[group].length) return;
            activeGroup = group;
            activeIndex = (index + groups[group].length) % groups[group].length;
            lastFocus = document.activeElement;
            paint();
            syncCarousel();
            lb.hidden = false;
            document.body.classList.add('rccar-lightbox-open');
            var closeBtn = lb.querySelector('.rccar-lightbox-close');
            if (closeBtn) closeBtn.focus();
        }

        function close() {
            lb.hidden = true;
            document.body.classList.remove('rccar-lightbox-open');
            if (lbImg) {
                lbImg.removeAttribute('src');
                lbImg.alt = '';
            }
            activeGroup = null;
            if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
        }

        function step(delta) {
            if (!activeGroup || !groups[activeGroup]) return;
            var total = groups[activeGroup].length;
            activeIndex = (activeIndex + delta + total) % total;
            paint();
            syncCarousel();
        }

        Object.keys(groups).forEach(function (group) {
            groups[group].forEach(function (item, idx) {
                item.btn.addEventListener('click', function () {
                    open(group, idx);
                });
            });
        });

        lb.querySelectorAll('[data-lightbox-close]').forEach(function (el) {
            el.addEventListener('click', close);
        });

        var lbPrev = lb.querySelector('[data-lightbox-prev]');
        var lbNext = lb.querySelector('[data-lightbox-next]');
        if (lbPrev) lbPrev.addEventListener('click', function (e) {
            e.stopPropagation();
            step(-1);
        });
        if (lbNext) lbNext.addEventListener('click', function (e) {
            e.stopPropagation();
            step(1);
        });

        document.addEventListener('keydown', function (e) {
            if (lb.hidden) return;
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowLeft') step(-1);
            if (e.key === 'ArrowRight') step(1);
        });

        window.rccarLightbox = { open: open, step: step, close: close };
    })();

    /* ---- concept carousel ---- */
    (function conceptCarousel() {
        var root = document.querySelector('[data-concept-carousel]');
        if (!root) return;

        var slides = Array.prototype.slice.call(root.querySelectorAll('.rccar-carousel-slide'));
        var prevBtn = root.querySelector('[data-carousel-prev]');
        var nextBtn = root.querySelector('[data-carousel-next]');
        var i = 0;
        var total = slides.length;
        if (!total) return;

        function show(n) {
            i = (n + total) % total;
            slides.forEach(function (s, idx) {
                s.classList.toggle('is-on', idx === i);
            });
        }

        if (prevBtn) prevBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            show(i - 1);
        });
        if (nextBtn) nextBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            show(i + 1);
        });

        document.addEventListener('keydown', function (e) {
            var lb = document.getElementById('rccar-lightbox');
            if (lb && !lb.hidden) return;
            if (!root.contains(document.activeElement) && document.activeElement !== root) return;
            if (e.key === 'ArrowLeft') show(i - 1);
            if (e.key === 'ArrowRight') show(i + 1);
        });

        show(0);
    })();

    /* ---- muted autoplay for all rccar videos when visible ---- */
    (function autoplayVideos() {
        var vids = Array.prototype.slice.call(document.querySelectorAll('.rccar-story video.rccar-autoplay'));
        if (!vids.length) return;

        vids.forEach(function (vid) {
            function tryPlay() {
                vid.muted = true;
                var p = vid.play();
                if (p && typeof p.catch === 'function') p.catch(function () {});
            }

            var vio = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) tryPlay();
                    else vid.pause();
                });
            }, { threshold: 0.35 });
            vio.observe(vid);
            tryPlay();
        });
    })();

    /* ---- hand-tracking demo: slider + mouse / touch ---- */
    (function gestureDemo() {
        var slider = document.getElementById('demo-slider');
        var track = document.getElementById('demo-track');
        var hand = document.getElementById('demo-hand');
        var bands = Array.prototype.slice.call(document.querySelectorAll('.rccar-demo-band'));
        var regionEl = document.getElementById('demo-region');
        var labelEl = document.getElementById('demo-label');
        var valueEl = document.getElementById('demo-value');
        var steerEl = document.getElementById('demo-steer');

        if (!slider || !bands.length || !track) return;

        var REGIONS = [
            { max: 0.2, label: 'LEFT2', plain: 'Hard left', value: -1, steer: 'Left' },
            { max: 0.4, label: 'LEFT1', plain: 'Soft left', value: -0.5, steer: 'Left' },
            { max: 0.6, label: 'CENTER', plain: 'Center', value: 0, steer: 'Neutral' },
            { max: 0.8, label: 'RIGHT1', plain: 'Soft right', value: 0.5, steer: 'Right' },
            { max: 1.01, label: 'RIGHT2', plain: 'Hard right', value: 1, steer: 'Right' }
        ];

        function classify(norm) {
            for (var r = 0; r < REGIONS.length; r++) {
                if (norm < REGIONS[r].max) return { index: r, meta: REGIONS[r] };
            }
            return { index: REGIONS.length - 1, meta: REGIONS[REGIONS.length - 1] };
        }

        function update(raw) {
            var n = Math.max(0, Math.min(100, Number(raw))) / 100;
            var hit = classify(n);

            bands.forEach(function (b, idx) {
                b.classList.toggle('is-hot', idx === hit.index);
            });

            if (hand) hand.style.left = (n * 100) + '%';

            if (regionEl) regionEl.textContent = hit.meta.label;
            if (labelEl) labelEl.textContent = hit.meta.plain;
            if (valueEl) valueEl.textContent = String(hit.meta.value);
            if (steerEl) steerEl.textContent = hit.meta.steer;

            slider.value = String(Math.round(n * 100));
            slider.setAttribute('aria-valuenow', String(Math.round(n * 100)));
            slider.setAttribute(
                'aria-valuetext',
                hit.meta.plain + ', value ' + hit.meta.value + ', ' + hit.meta.steer
            );
        }

        function positionFromEvent(e) {
            var rect = track.getBoundingClientRect();
            var clientX = e.clientX;
            if (e.touches && e.touches[0]) clientX = e.touches[0].clientX;
            if (rect.width <= 0) return;
            var pct = ((clientX - rect.left) / rect.width) * 100;
            update(pct);
        }

        slider.addEventListener('input', function () {
            update(slider.value);
        });

        track.addEventListener('pointermove', function (e) {
            positionFromEvent(e);
        });

        track.addEventListener('pointerdown', function (e) {
            track.setPointerCapture(e.pointerId);
            positionFromEvent(e);
        });

        track.addEventListener('touchmove', function (e) {
            if (e.cancelable) e.preventDefault();
            positionFromEvent(e);
        }, { passive: false });

        update(slider.value);
    })();
})();

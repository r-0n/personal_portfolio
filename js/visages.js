(function () {
    if (!document.body.classList.contains('visage-story')) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function syncAccent() {
        var c = getComputedStyle(document.querySelector('.color') || document.body).color;
        if (c) document.body.style.setProperty('--accent', c);
    }
    document.querySelectorAll('.color-changer a').forEach(function (a) {
        a.addEventListener('click', function () { setTimeout(syncAccent, 40); });
    });
    syncAccent();

    /* ---- reveal + chapter rail ---- */
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) e.target.classList.add('is-in');
        });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    requestAnimationFrame(function () {
        document.querySelectorAll('.reveal').forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (r.top < window.innerHeight * 0.92 && r.bottom > 0) el.classList.add('is-in');
        });
    });

    var railLinks = document.querySelectorAll('.visage-rail a');
    var chapterIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            var id = e.target.id;
            railLinks.forEach(function (a) {
                a.classList.toggle('is-active', a.getAttribute('data-chapter') === id);
            });
        });
    }, { threshold: 0.35 });
    document.querySelectorAll('[id].chapter, #hero').forEach(function (s) { chapterIo.observe(s); });

    /* ---- hero: video → photo → photo ---- */
    (function heroRotate() {
        var stage = document.querySelector('.hero-stage');
        var frames = document.querySelectorAll('.hero-frame');
        var dots = document.querySelectorAll('.hero-dots button');
        if (!stage || frames.length < 2) return;
        var i = 0;
        var timer = null;
        var wrap = document.getElementById('hero-video-wrap');
        var poster = document.getElementById('hero-yt-poster');
        var yt = document.getElementById('hero-yt');
        var ytSrc = yt && (yt.getAttribute('data-src') || '');

        function playYoutube() {
            if (!wrap || !yt || !ytSrc) return;
            if (!yt.getAttribute('src')) yt.src = ytSrc;
            wrap.classList.add('is-playing');
            stage.classList.add('is-playing-video');
        }

        function show(n) {
            i = ((n % frames.length) + frames.length) % frames.length;
            frames.forEach(function (f, idx) {
                f.classList.toggle('is-active', idx === i);
            });
            dots.forEach(function (d) {
                d.classList.toggle('is-on', String(i) === d.getAttribute('data-go'));
            });
            stage.setAttribute('data-slide', String(i));
            if (!frames[i].classList.contains('is-video')) {
                stage.classList.remove('is-playing-video');
            } else if (wrap && wrap.classList.contains('is-playing')) {
                stage.classList.add('is-playing-video');
            }
            arm();
        }

        function arm() {
            if (timer) clearTimeout(timer);
            if (reduce) return;
            var wait = frames[i].classList.contains('is-video') ? 16000 : 5500;
            timer = setTimeout(function () { show(i + 1); }, wait);
        }

        // muted autoplay (Chrome-friendly); poster remains as click fallback
        playYoutube();

        if (poster) {
            poster.addEventListener('click', function () {
                playYoutube();
                show(0);
                if (timer) clearTimeout(timer);
                timer = setTimeout(function () { show(1); }, 18000);
            });
        }

        dots.forEach(function (d) {
            d.addEventListener('click', function () {
                var n = parseInt(d.getAttribute('data-go'), 10);
                if (!isNaN(n)) show(n);
            });
        });

        show(0);
    })();

    /* ---- biology media height tracks writeup ---- */
    (function biologyHeight() {
        var copy = document.querySelector('.biology-copy');
        var media = document.querySelector('.biology-media');
        if (!copy || !media) return;

        function sync() {
            if (window.matchMedia('(max-width: 980px)').matches) {
                media.style.height = '';
                return;
            }
            media.style.height = copy.offsetHeight + 'px';
        }
        sync();
        window.addEventListener('resize', sync);
        if (window.ResizeObserver) new ResizeObserver(sync).observe(copy);
    })();

    /* ---- conclusion video: muted autoplay when in view ---- */
    (function conclusionVideo() {
        var wrap = document.getElementById('conclusion-video-wrap');
        var vid = document.getElementById('conclusion-video');
        if (!wrap || !vid) return;

        function tryPlay() {
            vid.muted = true;
            var p = vid.play();
            if (p && typeof p.catch === 'function') p.catch(function () {});
        }

        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) tryPlay();
                    else vid.pause();
                });
            }, { threshold: 0.25 });
            io.observe(wrap);
        } else {
            tryPlay();
        }
        vid.addEventListener('loadeddata', tryPlay);
    })();

    /* ---- fabrication video autoplay when visible ---- */
    (function fabVideo() {
        var wrap = document.querySelector('.fab-video');
        var vid = document.getElementById('fab-process-video');
        if (!wrap || !vid) return;

        function useFallback() {
            wrap.classList.add('is-fallback');
            var embed = document.getElementById('fab-process-embed');
            if (embed && !embed.getAttribute('src')) {
                embed.src = embed.getAttribute('data-src') || '';
            }
        }

        function tryPlay() {
            if (wrap.classList.contains('is-fallback')) return;
            vid.muted = true;
            var p = vid.play();
            if (p && typeof p.catch === 'function') {
                p.catch(function () { useFallback(); });
            }
        }

        vid.addEventListener('error', useFallback);
        // empty/corrupt local file or missing source
        if (!vid.currentSrc && !vid.getAttribute('src')) useFallback();

        var ioFab = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) tryPlay();
            });
        }, { threshold: 0.2 });
        ioFab.observe(wrap);

        vid.addEventListener('loadeddata', tryPlay);
        // if metadata never arrives, fall back after a beat
        setTimeout(function () {
            if (vid.readyState < 2) useFallback();
            else tryPlay();
        }, 1800);
    })();

    /* ---- lightbox gallery ---- */
    (function lightbox() {
        var lb = document.getElementById('visage-lightbox');
        if (!lb) return;
        var img = lb.querySelector('img');
        var cap = lb.querySelector('figcaption');
        var items = [];
        var index = 0;

        function collect(root) {
            return Array.prototype.map.call(root.querySelectorAll('[data-full]'), function (el) {
                return {
                    src: el.getAttribute('data-full'),
                    caption: el.getAttribute('data-caption') || '',
                    alt: (el.querySelector('img') && el.querySelector('img').alt) || ''
                };
            });
        }

        function open(list, i) {
            items = list;
            index = i;
            show();
            lb.hidden = false;
            document.body.style.overflow = 'hidden';
            lb.querySelector('.lb-close').focus();
        }

        function close() {
            lb.hidden = true;
            document.body.style.overflow = '';
        }

        function show() {
            var item = items[index];
            if (!item) return;
            img.src = item.src;
            img.alt = item.alt;
            cap.textContent = item.caption;
        }

        function step(dir) {
            if (!items.length) return;
            index = (index + dir + items.length) % items.length;
            show();
        }

        document.querySelectorAll('[data-lightbox]').forEach(function (root) {
            var list = collect(root);
            root.querySelectorAll('[data-full]').forEach(function (el, idx) {
                el.addEventListener('click', function () { open(list, idx); });
            });
        });

        lb.querySelector('.lb-close').addEventListener('click', close);
        lb.querySelector('.lb-prev').addEventListener('click', function () { step(-1); });
        lb.querySelector('.lb-next').addEventListener('click', function () { step(1); });
        lb.addEventListener('click', function (e) {
            if (e.target === lb) close();
        });
        window.addEventListener('keydown', function (e) {
            if (lb.hidden) return;
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowLeft') step(-1);
            if (e.key === 'ArrowRight') step(1);
        });
    })();
})();

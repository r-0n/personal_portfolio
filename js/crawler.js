(function () {
    if (!document.body.classList.contains('crawler-story')) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function syncAccent() {
        var c = getComputedStyle(document.querySelector('.color') || document.body).color;
        if (c) document.body.style.setProperty('--accent', c);
    }
    document.querySelectorAll('.color-changer a').forEach(function (a) {
        a.addEventListener('click', function () { setTimeout(syncAccent, 40); });
    });
    syncAccent();

    /* ---- reveal ---- */
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

    /* ---- chapter rail ---- */
    var railLinks = document.querySelectorAll('.crawler-rail a');
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

    /* ---- hero rotate ---- */
    (function heroRotate() {
        var stage = document.querySelector('.hero-stage');
        var frames = document.querySelectorAll('.hero-frame');
        var dots = document.querySelectorAll('.hero-dots button');
        if (!stage || frames.length < 2) return;
        var i = 0;
        var timer = null;

        function show(n) {
            i = ((n % frames.length) + frames.length) % frames.length;
            frames.forEach(function (f, idx) {
                f.classList.toggle('is-active', idx === i);
            });
            dots.forEach(function (d) {
                d.classList.toggle('is-on', String(i) === d.getAttribute('data-go'));
            });
            stage.setAttribute('data-slide', String(i));
            arm();
        }

        function arm() {
            if (timer) clearTimeout(timer);
            if (reduce) return;
            timer = setTimeout(function () { show(i + 1); }, 5500);
        }

        dots.forEach(function (d) {
            d.addEventListener('click', function () {
                var n = parseInt(d.getAttribute('data-go'), 10);
                if (!isNaN(n)) show(n);
            });
        });

        show(0);
    })();

    /* ---- muted autoplay when in view ---- */
    (function autoplayInView() {
        var videos = document.querySelectorAll('video.autoplay-inview');
        if (!videos.length) return;

        function tryPlay(v) {
            if (reduce) return;
            var p = v.play();
            if (p && typeof p.catch === 'function') p.catch(function () {});
        }

        if (!('IntersectionObserver' in window)) {
            videos.forEach(tryPlay);
            return;
        }

        var vio = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                var v = e.target;
                if (e.isIntersecting) tryPlay(v);
                else v.pause();
            });
        }, { threshold: 0.35 });

        videos.forEach(function (v) {
            v.muted = true;
            vio.observe(v);
        });
    })();

    /* ---- design carousel ---- */
    (function designCarousel() {
        var root = document.querySelector('[data-design-carousel]');
        if (!root) return;

        var slides = Array.prototype.slice.call(root.querySelectorAll('[data-slide]'));
        var thumbsWrap = root.querySelector('[data-carousel-thumbs]');
        var countEl = root.querySelector('[data-carousel-count]');
        var prevBtn = root.querySelector('[data-carousel-prev]');
        var nextBtn = root.querySelector('[data-carousel-next]');
        if (slides.length < 2) return;

        var PHOTO_MS = 4200;
        var VIDEO_FALLBACK_MS = 14000;
        var i = 0;
        var timer = null;
        var paused = false;
        var inView = false;
        var thumbs = [];
        var onVideoEnded = null;

        function pad(n) {
            return (n < 10 ? '0' : '') + n;
        }

        function activeVideo() {
            return slides[i].querySelector('video');
        }

        function detachVideoEnded() {
            slides.forEach(function (slide) {
                var v = slide.querySelector('video');
                if (v && onVideoEnded) v.removeEventListener('ended', onVideoEnded);
            });
            onVideoEnded = null;
        }

        function stopVideos() {
            detachVideoEnded();
            slides.forEach(function (slide) {
                var v = slide.querySelector('video');
                if (!v) return;
                v.pause();
                try { v.currentTime = 0; } catch (err) {}
            });
        }

        function clearTimer() {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            root.classList.remove('is-ticking');
            root.style.removeProperty('--carousel-dwell');
        }

        function arm() {
            clearTimer();
            detachVideoEnded();
            if (reduce || paused || !inView) return;

            var video = activeVideo();
            var dwell = PHOTO_MS;

            if (video) {
                video.muted = true;
                video.loop = false;
                var p = video.play();
                if (p && typeof p.catch === 'function') p.catch(function () {});
                dwell = (isFinite(video.duration) && video.duration > 0)
                    ? Math.min(video.duration * 1000 + 250, VIDEO_FALLBACK_MS)
                    : VIDEO_FALLBACK_MS;

                onVideoEnded = function () {
                    clearTimer();
                    if (!paused && inView) go(i + 1);
                };
                video.addEventListener('ended', onVideoEnded);
            }

            root.style.setProperty('--carousel-dwell', dwell + 'ms');
            void root.offsetWidth;
            root.classList.add('is-ticking');
            timer = setTimeout(function () { go(i + 1); }, dwell);
        }

        function go(n) {
            var prev = i;
            i = ((n % slides.length) + slides.length) % slides.length;

            slides.forEach(function (slide, idx) {
                slide.classList.remove('is-active', 'is-exit');
                if (idx === prev && prev !== i) slide.classList.add('is-exit');
                if (idx === i) slide.classList.add('is-active');
            });

            thumbs.forEach(function (btn, idx) {
                btn.classList.toggle('is-on', idx === i);
                btn.setAttribute('aria-selected', idx === i ? 'true' : 'false');
            });

            if (thumbs[i] && thumbsWrap) {
                var thumb = thumbs[i];
                var left = thumb.offsetLeft - thumbsWrap.clientWidth / 2 + thumb.clientWidth / 2;
                thumbsWrap.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' });
            }

            if (countEl) {
                countEl.textContent = pad(i + 1) + ' / ' + pad(slides.length);
            }

            stopVideos();
            arm();
        }

        // build thumbs
        slides.forEach(function (slide, idx) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('aria-label', 'Go to slide ' + (idx + 1));
            btn.setAttribute('aria-selected', 'false');

            var media = slide.querySelector('img, video');
            if (media && media.tagName === 'IMG') {
                var img = document.createElement('img');
                img.src = media.currentSrc || media.src;
                img.alt = '';
                btn.appendChild(img);
            } else if (media && media.tagName === 'VIDEO') {
                var mark = document.createElement('span');
                mark.textContent = '▶';
                mark.style.cssText = 'display:grid;place-items:center;height:100%;font-size:11px;color:whitesmoke;opacity:.8';
                btn.appendChild(mark);
            }

            btn.addEventListener('click', function () { go(idx); });
            thumbsWrap.appendChild(btn);
            thumbs.push(btn);
        });

        if (prevBtn) prevBtn.addEventListener('click', function () { go(i - 1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { go(i + 1); });

        root.addEventListener('mouseenter', function () {
            paused = true;
            clearTimer();
        });
        root.addEventListener('mouseleave', function () {
            paused = false;
            arm();
        });

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                inView = e.isIntersecting;
                if (inView) arm();
                else {
                    clearTimer();
                    stopVideos();
                }
            });
        }, { threshold: 0.35 });
        io.observe(root);

        go(0);
    })();
})();

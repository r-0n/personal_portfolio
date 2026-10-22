(function () {
    if (!document.body.classList.contains('ellipse-story')) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- dock rail + color changer ---- */
    (function mountDock() {
        function clearBodyTransform() {
            document.body.style.transform = 'none';
        }

        function place() {
            var rail = document.querySelector('.ellipse-rail');
            var changer = document.querySelector('.color-changer');
            if (!rail || !changer) return false;
            if (document.querySelector('.ellipse-dock')) {
                clearBodyTransform();
                return true;
            }
            var dock = document.createElement('div');
            dock.className = 'ellipse-dock';
            dock.setAttribute('aria-label', 'Page tools');
            document.body.appendChild(dock);
            dock.appendChild(changer);
            dock.appendChild(rail);
            clearBodyTransform();
            return true;
        }

        if (!place()) {
            var tries = 0;
            var id = setInterval(function () {
                tries += 1;
                if (place() || tries > 40) clearInterval(id);
            }, 50);
        }
        window.addEventListener('load', clearBodyTransform);
        setTimeout(clearBodyTransform, 600);
    })();

    function syncAccent() {
        var c = getComputedStyle(document.querySelector('.color') || document.body).color;
        if (c) document.body.style.setProperty('--accent', c);
    }
    document.querySelectorAll('.color-changer a').forEach(function (a) {
        a.addEventListener('click', function () { setTimeout(syncAccent, 40); });
    });
    setTimeout(function () {
        document.querySelectorAll('.color-changer a').forEach(function (a) {
            a.addEventListener('click', function () { setTimeout(syncAccent, 40); });
        });
        syncAccent();
    }, 120);
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
    var railLinks = document.querySelectorAll('.ellipse-rail a');
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

    /* ---- muted autoplay when in view ---- */
    (function autoplayInView() {
        var videos = document.querySelectorAll('video.autoplay-inview');
        if (!videos.length) return;

        function tryPlay(v) {
            if (reduce) return;
            v.muted = true;
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

    /* ---- iteration video slots (show drop-zone until file loads) ---- */
    (function iterMedia() {
        document.querySelectorAll('[data-iter-media]').forEach(function (figure) {
            var frame = figure.querySelector('.iter-media-frame');
            var video = figure.querySelector('[data-iter-video]');
            if (!frame || !video) return;

            function markEmpty(empty) {
                frame.classList.toggle('is-empty', !!empty);
            }

            markEmpty(true);

            video.addEventListener('loadeddata', function () {
                if (video.videoWidth > 0) markEmpty(false);
            });
            video.addEventListener('error', function () { markEmpty(true); });

            if (video.readyState >= 2 && video.videoWidth > 0) markEmpty(false);
        });
    })();
})();

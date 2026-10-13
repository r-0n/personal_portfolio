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
})();

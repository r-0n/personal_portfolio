(function () {
    var BASE = document.body.getAttribute('data-base') || '../';
    var THEME_KEY = 'r0n-theme-color';

    function applySavedTheme() {
        var attr = localStorage.getItem(THEME_KEY);
        if (!attr) return;
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = BASE + 'css/' + attr + '.css';
        document.head.appendChild(link);
    }

    function chromeTop() {
        return '' +
            '<div class="cursor"></div>' +
            '<div id="navigation-bar">' +
            '  <a href="' + BASE + 'index.html#header"><img src="' + BASE + 'images/logo-no-background.png" alt="logo"></a>' +
            '  <div class="nav-actions">' +
            '    <a href="' + BASE + 'index.html#portfolio" class="capstone-link case-back-link">' +
            '      <span class="capstone-label">← Portfolio <span class="color">Hub</span></span>' +
            '    </a>' +
            '    <div class="menubar"><span class="first-span"></span><span class="second-span"></span><span class="third-span"></span></div>' +
            '  </div>' +
            '</div>' +
            '<div id="navigation-content">' +
            '  <div class="logo"><img src="' + BASE + 'images/logo-no-background.png" alt="logo"></div>' +
            '  <div class="navigation-close"><span class="close-first"></span><span class="close-second"></span></div>' +
            '  <div class="navigation-links">' +
            '    <a href="' + BASE + 'index.html#header">HOME</a>' +
            '    <a href="' + BASE + 'index.html#portfolio">PORTFOLIO</a>' +
            '    <a href="' + BASE + 'index.html#blog">PROJECTS</a>' +
            '    <a href="' + BASE + 'index.html#guitar">ACOUSTIC SESSIONS</a>' +
            '    <a href="' + BASE + 'index.html#about">ABOUT</a>' +
            '    <a href="' + BASE + 'index.html#contact">CONTACT</a>' +
            '  </div>' +
            '</div>' +
            '<div class="color-changer">' +
            '  <div class="color-panel"><img src="' + BASE + 'images/gear.png" alt=""></div>' +
            '  <div class="color-selector"><div class="heading">Custom Colors</div><div class="colors"><ul>' +
            '    <li><a href="#0" class="color-red" title="color-red"></a></li>' +
            '    <li><a href="#0" class="color-purple" title="color-purple"></a></li>' +
            '    <li><a href="#0" class="color-malt" title="color-malt"></a></li>' +
            '    <li><a href="#0" class="color-green" title="color-green"></a></li>' +
            '    <li><a href="#0" class="color-blue" title="color-blue"></a></li>' +
            '    <li><a href="#0" class="color-orange" title="color-orange"></a></li>' +
            '  </ul></div></div></div>';
    }

    function chromeBottom() {
        return '<div class="footer"><div class="footer-text"><img src="' + BASE + 'images/copyright.png" alt="" class="images" height="14"> r-0n</div></div>';
    }

    function mountChrome() {
        var top = document.getElementById('case-chrome-top');
        var bottom = document.getElementById('case-chrome-bottom');
        if (top) top.innerHTML = chromeTop();
        if (bottom) bottom.innerHTML = chromeBottom();
    }

    function bindChrome() {
        var panel = document.querySelector('.color-panel');
        if (panel) {
            panel.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector('.color-changer').classList.toggle('color-changer-active');
            });
        }
        document.querySelectorAll('.colors a').forEach(function (a) {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                var attr = a.getAttribute('title');
                localStorage.setItem(THEME_KEY, attr);
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = BASE + 'css/' + attr + '.css';
                document.head.appendChild(link);
            });
        });
        var menubar = document.querySelector('.menubar');
        var nav = document.getElementById('navigation-content');
        var close = document.querySelector('.navigation-close');
        if (menubar && nav) {
            nav.style.transform = 'translateY(-100%)';
            menubar.addEventListener('click', function () {
                nav.style.transition = 'transform .55s ease';
                nav.style.transform = 'translateY(0)';
            });
        }
        if (close && nav) {
            close.addEventListener('click', function () {
                nav.style.transform = 'translateY(-100%)';
            });
        }
    }

    function bindTransitions() {
        document.addEventListener('click', function (e) {
            var a = e.target.closest('a[href]');
            if (!a) return;
            var href = a.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
            if (a.target === '_blank' || href.indexOf('://') !== -1) return;
            e.preventDefault();
            // Normal navigation: every page is a history entry, so Back retraces
            // the visitor's steps (project -> project -> hub -> ...).
            document.body.classList.add('is-leaving');
            setTimeout(function () {
                window.location.href = href;
            }, 260);
        });
        // If the browser brings this page back from its back-forward cache, the
        // faded-out state is still on <body>; clear it so the page is visible.
        window.addEventListener('pageshow', function (e) {
            if (e.persisted) document.body.classList.remove('is-leaving');
        });
    }

    function bindCompare() {
        var box = document.querySelector('.compare');
        if (!box) return;
        var overlay = box.querySelector('.compare-overlay');
        var handle = box.querySelector('.compare-handle');
        function setPos(clientX) {
            var rect = box.getBoundingClientRect();
            var pct = Math.min(96, Math.max(4, ((clientX - rect.left) / rect.width) * 100));
            overlay.style.width = pct + '%';
            handle.style.left = pct + '%';
        }
        var drag = false;
        box.addEventListener('pointerdown', function (e) {
            drag = true;
            box.setPointerCapture(e.pointerId);
            setPos(e.clientX);
        });
        box.addEventListener('pointermove', function (e) {
            if (drag) setPos(e.clientX);
        });
        box.addEventListener('pointerup', function () { drag = false; });
    }

    function bindTabs() {
        var tabs = document.querySelectorAll('.process-tab');
        if (!tabs.length) return;
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                tabs.forEach(function (t) { t.classList.remove('is-active'); });
                document.querySelectorAll('.process-stage').forEach(function (s) { s.classList.remove('is-active'); });
                tab.classList.add('is-active');
                var stage = document.getElementById(tab.getAttribute('data-stage'));
                if (stage) stage.classList.add('is-active');
            });
        });
    }

    function enhancePagers() {
        document.querySelectorAll('.case-pager a').forEach(function (a) {
            if (a.dataset.enhanced === '1') return;
            var small = a.querySelector('small');
            var dir = small ? small.textContent.trim() : (a.classList.contains('next') ? 'Next' : 'Previous');
            var title = '';
            a.childNodes.forEach(function (n) {
                if (n.nodeType === 3) title += n.textContent;
            });
            title = title.replace(/\s+/g, ' ').trim();
            if (!title) {
                var strong = a.querySelector('.pager-name, strong');
                title = strong ? strong.textContent.trim() : a.textContent.replace(dir, '').trim();
            }
            var isNext = a.classList.contains('next');
            a.innerHTML =
                '<span class="pager-arrow" aria-hidden="true">' + (isNext ? '→' : '←') + '</span>' +
                '<span class="pager-copy">' +
                '<small>' + dir + '</small>' +
                '<strong class="pager-name">' + title + '</strong>' +
                '</span>';
            a.dataset.enhanced = '1';
        });
    }

    applySavedTheme();
    mountChrome();
    bindChrome();
    bindTransitions();
    bindCompare();
    bindTabs();
    enhancePagers();
})();

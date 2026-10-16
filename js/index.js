$(window).on('load', function() {
    // Resume where the visitor left off: URL hash first (Back from a project
    // page, shared link), then the section remembered for this tab, else Home.
    var initial = window.location.hash.substring(1) ||
                  sessionStorage.getItem(SECTION_KEY) || 'header';
    if (!document.getElementById(initial)) initial = 'header';
    rememberSection(initial);
    // Keep the address bar canonical: Home has no hash, sections carry theirs.
    history.replaceState({ section: initial }, '', initial === 'header' ? BASE_URL : BASE_URL + '#' + initial);

    gsap.to('#loader', 1, { y: "-100%" });
    gsap.to('#loader', 1, { opacity: 0 });
    gsap.to('#loader', 0, { display: "none", delay: 1 });
    if (initial !== 'header') gsap.set('#header', { display: "none" }); // Home is visible by default in CSS
    gsap.to('#' + initial, 0, { display: "block", delay: 1 });
    gsap.to('#navigation-content', 0, { display: "none" });
    gsap.to('#navigation-content', 0, { display: "flex", delay: 1 });

    if (initial === 'header') {
        setTimeout(function() {
            if (typeof window.refreshHomeParticles === 'function') window.refreshHomeParticles();
        }, 1050);
    } else {
        setTimeout(function() { restoreScroll(initial); }, 1050);
    }
})
$(function() {
    var savedTheme = localStorage.getItem('r0n-theme-color');
    if (savedTheme) {
        $('head').append('<link rel="stylesheet" href="css/' + savedTheme + '.css">');
    }
    $('.color-panel').on("click", function(e) {
        e.preventDefault();
        $('.color-changer').toggleClass('color-changer-active');
    });
    $('.colors a').on("click", function(e) {
        e.preventDefault();
        var attr = $(this).attr("title");
        console.log(attr);
        localStorage.setItem('r0n-theme-color', attr);
        $('head').append('<link rel="stylesheet" href="css/' + attr + '.css">');
    });
});
// ---- Category filters (Projects, Portfolio hub, Acoustic Sessions) ----
// The active filter of each group is remembered for the tab, so coming back
// from a project page (or Back/Forward) shows the same selection.
var FILTER_GROUPS = [
    { bar: '.project-filters',   items: '.project-group', mode: 'fade' },
    { bar: '.portfolio-filters', items: '.hub-card',      mode: 'class' },
    { bar: '.guitar-filters',    items: '.music-group',   mode: 'fade' }
];

function applyFilter(group, filter, animate) {
    var $bar = $(group.bar);
    if (!$bar.length) return;
    $bar.find('.filter-btn').removeClass('filter-active')
        .filter('[data-filter="' + filter + '"]').addClass('filter-active');

    var $all = $(group.items);
    var $match = filter === 'all' ? $all : $all.filter('[data-category="' + filter + '"]');
    if (group.mode === 'class') {
        $all.addClass('hub-hidden');
        $match.removeClass('hub-hidden');
    } else if (animate) {
        $all.stop(true, true).hide();
        $match.fadeIn(350);
    } else {
        $all.hide();
        $match.show();
    }
}

$(function() {
    FILTER_GROUPS.forEach(function(group) {
        var key = 'r0n-filter:' + group.bar;
        var saved = sessionStorage.getItem(key);
        if (saved && $(group.bar).find('[data-filter="' + saved + '"]').length) {
            applyFilter(group, saved, false);
        }
        $(group.bar).on('click', '.filter-btn', function() {
            var filter = $(this).data('filter');
            sessionStorage.setItem(key, filter);
            applyFilter(group, filter, true);
        });
    });
});
$(function() {
    $('.menubar').on('click', function() {
        gsap.to('#navigation-content', .6, { y: 0 });
    })
    $('.navigation-close').on('click', function() {
        gsap.to('#navigation-content', .6, { y: "-100%" });
    });
});

$(function() {
    var TxtRotate = function(el, toRotate, period) {
        this.toRotate = toRotate;
        this.el = el;
        this.loopNum = 0;
        this.period = parseInt(period, 10) || 2000;
        this.txt = '';
        this.tick();
        this.isDeleting = false;
    };

    TxtRotate.prototype.tick = function() {
        var i = this.loopNum % this.toRotate.length;
        var fullTxt = this.toRotate[i];

        if (this.isDeleting) {
            this.txt = fullTxt.substring(0, this.txt.length - 1);
        } else {
            this.txt = fullTxt.substring(0, this.txt.length + 1);
        }

        this.el.innerHTML = '<span class="wrap">' + this.txt + '</span>';

        var that = this;
        var delta = 200 - Math.random() * 100;

        if (this.isDeleting) { delta /= 2; }

        if (!this.isDeleting && this.txt === fullTxt) {
            delta = this.period;
            this.isDeleting = true;
        } else if (this.isDeleting && this.txt === '') {
            this.isDeleting = false;
            this.loopNum++;
            delta = 100;
        }

        setTimeout(function() {
            that.tick();
        }, delta);
    };

    window.onload = function() {
        var elements = document.getElementsByClassName('txt-rotate');
        for (var i = 0; i < elements.length; i++) {
            var toRotate = elements[i].getAttribute('data-rotate');
            var period = elements[i].getAttribute('data-period');
            if (toRotate) {
                new TxtRotate(elements[i], JSON.parse(toRotate), period);
            }
        }
        // INJECT CSS
        var css = document.createElement("style");
        css.type = "text/css";
        css.innerHTML = ".txt-rotate > .wrap { border-right: 0em solid #666 ; }";
        document.body.appendChild(css);
    };
})
// ---- Section routing & session persistence ----
// Every section visit is a real history entry, so Back/Forward retrace the
// visitor's steps. The current section, scroll position and filters survive
// trips to project pages (and reloads) via sessionStorage.
var BASE_URL = window.location.pathname + window.location.search;
var SECTION_KEY = 'r0n-section';
var SCROLL_KEY = 'r0n-scroll:';

// We restore scroll ourselves once the section is visible.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function sectionFromHash() {
    var hash = window.location.hash.substring(1);
    return (hash && hash !== 'header') ? hash : 'header';
}

function rememberSection(sectionId) {
    sessionStorage.setItem(SECTION_KEY, sectionId);
}

function saveScroll(sectionId) {
    sessionStorage.setItem(SCROLL_KEY + sectionId, String(window.pageYOffset || 0));
}

function restoreScroll(sectionId) {
    var y = parseInt(sessionStorage.getItem(SCROLL_KEY + sectionId), 10);
    window.scrollTo(0, isNaN(y) ? 0 : y);
}

// Update history, then render.
function navigateToSection(sectionId) {
    if (sectionId === '') sectionId = 'header';
    var current = sectionFromHash();
    saveScroll(current);
    var url = sectionId === 'header' ? BASE_URL : BASE_URL + '#' + sectionId;
    if (sectionId === current) {
        history.replaceState({ section: sectionId }, '', url); // re-selecting: no duplicate entry
    } else {
        history.pushState({ section: sectionId }, '', url);
    }
    showSection(sectionId);
}

// Render a section without touching history (used by Back/Forward).
function showSection(sectionId, keepScroll) {
    rememberSection(sectionId);
    // Hide all sections
    gsap.to('#navigation-content', 0, { display: "none", delay: .7 });
    gsap.to('#navigation-content', 0, { y: '-100%', delay: .7 });
    gsap.to('#header', 0, { display: "none" });
    gsap.to('#about', 0, { display: "none" });
    gsap.to('#blog', 0, { display: "none" });
    gsap.to('#portfolio', 0, { display: "none" });
    gsap.to('#contact', 0, { display: "none" });
    gsap.to('#guitar', 0, { display: "none" });
    gsap.to('#breaker', 0, { display: "block" });
    gsap.to('#breaker-two', 0, { display: "block", delay: .1 });
    gsap.to('#breaker', 0, { display: "none", delay: 2 });
    gsap.to('#breaker-two', 0, { display: "none", delay: 2 });
    
    // Show target section
    if (sectionId === 'header' || sectionId === '') {
        gsap.to('#header', 0, { display: "block", delay: .7 });
        // particles.js canvas dies while #header is display:none (esp. after resize
        // on non-laptop viewports). Rebuild it once Home is visible again.
        setTimeout(function() {
            if (typeof window.refreshHomeParticles === 'function') {
                window.refreshHomeParticles();
            }
        }, 750);
    } else {
        gsap.to('#' + sectionId, 0, { display: "block", delay: .7 });
    }
    // Back/Forward returns to the spot the visitor was reading; a fresh
    // navigation starts the section from the top.
    setTimeout(function() {
        if (keepScroll) restoreScroll(sectionId); else window.scrollTo(0, 0);
    }, 720);
    gsap.to('#navigation-content', 0, { display: 'flex', delay: 2 });
}

// Leaving for a project page (or closing the tab): remember where we were so
// Back / reopening lands on the same section at the same scroll position.
$(window).on('pagehide', function() {
    saveScroll(sectionFromHash());
});

// Back-forward cache: the browser restored this page from memory with its DOM
// intact, so only the particles canvas (killed while hidden) needs a nudge.
$(window).on('pageshow', function(e) {
    if (e.originalEvent && e.originalEvent.persisted) {
        rememberSection(sectionFromHash());
        if (sectionFromHash() === 'header' && typeof window.refreshHomeParticles === 'function') {
            window.refreshHomeParticles();
        }
    }
});

// Browser Back/Forward between sections.
$(window).on('popstate', function() {
    saveScroll(sessionStorage.getItem(SECTION_KEY) || 'header');
    showSection(sectionFromHash(), true);
});

$(function() {

    $('#about-link').on('click', function(e) {
        e.preventDefault();
        navigateToSection('about');
    })
    $('#contact-link').on('click', function(e) {
        e.preventDefault();
        navigateToSection('contact');
    })
    $('#portfolio-link').on('click', function(e) {
        e.preventDefault();
        navigateToSection('portfolio');
    })
    $('#blog-link').on('click', function(e) {
        e.preventDefault();
        navigateToSection('blog');
    })
    $('#project-link').on('click', function(e) {
        e.preventDefault();
        navigateToSection('blog');
    })

    //for guitar(acoustic sessions) post 

    $('#guitar-link').on('click', function(e) {
        e.preventDefault();
        navigateToSection('guitar');
    })

    $('#home-link').on('click', function(e) {
        e.preventDefault();
        navigateToSection('header');
    })



})
$(function() {
    var body = document.querySelector('body');
    var $cursor = $('.cursor')

    function cursormover(e) {

        gsap.to($cursor, {
            x: e.clientX,
            y: e.clientY,
            stagger: .002
        })
    }

    function cursorhover(e) {
        gsap.to($cursor, {
            scale: 1.4,
            opacity: 1
        })

    }

    function cursor(e) {
        gsap.to($cursor, {
            scale: 1,
            opacity: .6
        })
    }
    $(window).on('mousemove', cursormover);
    $('.menubar').hover(cursorhover, cursor);
    $('a').hover(cursorhover, cursor);
    $('.navigation-close').hover(cursorhover, cursor);

})

// Hub cover videos: muted autoplay + loop while in view
$(function() {
    var videos = document.querySelectorAll('video.hub-autoplay');
    if (!videos.length) return;

    function tryPlay(v) {
        v.muted = true;
        var p = v.play();
        if (p && typeof p.catch === 'function') p.catch(function() {});
    }

    if (!('IntersectionObserver' in window)) {
        videos.forEach(tryPlay);
        return;
    }

    var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
            var v = e.target;
            if (e.isIntersecting) tryPlay(v);
            else v.pause();
        });
    }, { threshold: 0.35 });

    videos.forEach(function(v) {
        v.muted = true;
        v.loop = true;
        io.observe(v);
    });
});
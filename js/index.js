$(window).on('load', function() {
    gsap.to('#loader', 1, { y: "-100%" });
    gsap.to('#loader', 1, { opacity: 0 });
    gsap.to('#loader', 0, { display: "none", delay: 1 });
    gsap.to('#header', 0, { display: "block", delay: 1 })
    gsap.to('#navigation-content', 0, { display: "none" });
    gsap.to('#navigation-content', 0, { display: "flex", delay: 1 });
})
$(function() {
    $('.color-panel').on("click", function(e) {
        e.preventDefault();
        $('.color-changer').toggleClass('color-changer-active');
    });
    $('.colors a').on("click", function(e) {
        e.preventDefault();
        var attr = $(this).attr("title");
        console.log(attr);
        $('head').append('<link rel="stylesheet" href="css/' + attr + '.css">');
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
// History persistence function
function navigateToSection(sectionId) {
    // Store current section in sessionStorage
    sessionStorage.setItem('lastSection', sectionId);
    // Update URL hash
    window.location.hash = sectionId;
    
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
    } else {
        gsap.to('#' + sectionId, 0, { display: "block", delay: .7 });
    }
    gsap.to('#navigation-content', 0, { display: 'flex', delay: 2 });
}

// Restore last visited section on page load
$(window).on('load', function() {
    var hash = window.location.hash.substring(1);
    var lastSection = sessionStorage.getItem('lastSection');
    
    // If there's a hash, use it; otherwise use lastSection; otherwise default to header
    var targetSection = hash || lastSection || 'header';
    
    if (targetSection && targetSection !== 'header') {
        // Small delay to ensure GSAP is loaded
        setTimeout(function() {
            navigateToSection(targetSection);
        }, 100);
    }
});

// Handle browser back/forward buttons
$(window).on('hashchange', function() {
    var hash = window.location.hash.substring(1);
    if (hash) {
        navigateToSection(hash);
    } else {
        navigateToSection('header');
    }
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
/* -----------------------------------------------
/* Home page particles motion
/* Re-inits safely when returning to Home after
/* other sections hide #header (display:none).
/* ----------------------------------------------- */

window.HOME_PARTICLES_CONFIG = {
    "particles": {
        "number": {
            "value": 160,
            "density": {
                "enable": true,
                "value_area": 900
            }
        },
        "color": {
            "value": "#FF0000"
        },
        "shape": {
            "type": "circle",
            "stroke": {
                "width": 0,
                "color": "#FFFFFF"
            },
            "polygon": {
                "nb_sides": 8
            },
            "image": {
                "src": "img/github.svg",
                "width": 100,
                "height": 100
            }
        },
        "opacity": {
            "value": 0.5,
            "random": false,
            "anim": {
                "enable": false,
                "speed": 1,
                "opacity_min": 0.1,
                "sync": false
            }
        },
        "size": {
            "value": 5,
            "random": true,
            "anim": {
                "enable": false,
                "speed": 40,
                "size_min": 0.1,
                "sync": false
            }
        },
        "line_linked": {
            "enable": true,
            "distance": 150,
            "color": "#ffffff",
            "opacity": 0.4,
            "width": 1
        },
        "move": {
            "enable": true,
            "speed": 6,
            "direction": "none",
            "random": false,
            "straight": false,
            "out_mode": "out",
            "attract": {
                "enable": false,
                "rotateX": 600,
                "rotateY": 1200
            }
        }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": {
                "enable": true,
                "mode": "repulse"
            },
            "onclick": {
                "enable": true,
                "mode": "push"
            },
            "resize": true
        },
        "modes": {
            "grab": {
                "distance": 400,
                "line_linked": {
                    "opacity": 1
                }
            },
            "bubble": {
                "distance": 400,
                "size": 40,
                "duration": 2,
                "opacity": 8,
                "speed": 3
            },
            "repulse": {
                "distance": 200
            },
            "push": {
                "particles_nb": 4
            },
            "remove": {
                "particles_nb": 2
            }
        }
    },
    "retina_detect": true,
    "config_demo": {
        "hide_card": false
    }
};

window.destroyHomeParticles = function() {
    try {
        if (window.pJSDom && window.pJSDom.length) {
            for (var i = 0; i < window.pJSDom.length; i++) {
                var inst = window.pJSDom[i];
                if (!inst || !inst.pJS) continue;
                if (inst.pJS.fn) {
                    if (inst.pJS.fn.drawAnimFrame) {
                        cancelAnimationFrame(inst.pJS.fn.drawAnimFrame);
                    }
                    if (inst.pJS.fn.checkAnimFrame) {
                        cancelAnimationFrame(inst.pJS.fn.checkAnimFrame);
                    }
                }
                if (inst.pJS.canvas && inst.pJS.canvas.el && inst.pJS.canvas.el.parentNode) {
                    inst.pJS.canvas.el.parentNode.removeChild(inst.pJS.canvas.el);
                }
            }
        }
    } catch (e) {
        // ignore cleanup errors from a broken prior instance
    }
    window.pJSDom = [];

    var host = document.getElementById('particles');
    if (host) {
        var leftover = host.querySelectorAll('canvas.particles-js-canvas-el');
        for (var j = 0; j < leftover.length; j++) {
            leftover[j].parentNode.removeChild(leftover[j]);
        }
    }
};

window.initHomeParticles = function() {
    if (typeof particlesJS !== 'function') return;

    var host = document.getElementById('particles');
    var header = document.getElementById('header');
    if (!host || !header) return;

    // Don't init while Home is hidden — canvas would measure as 0x0
    var headerStyle = window.getComputedStyle(header);
    if (headerStyle.display === 'none' || header.offsetWidth === 0 || header.offsetHeight === 0) {
        return;
    }

    window.destroyHomeParticles();
    particlesJS('particles', window.HOME_PARTICLES_CONFIG);
};

window.refreshHomeParticles = function() {
    // Wait until #header is painted and has layout again
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            window.initHomeParticles();
        });
    });
};

// Initial load
window.initHomeParticles();

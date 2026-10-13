(function () {
    if (!document.body.classList.contains('carapace-story')) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var accent = function () {
        return getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#c70039';
    };

    /* ---- reveal + season rail ---- */
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) e.target.classList.add('is-in');
        });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    requestAnimationFrame(function () {
        document.querySelectorAll('.reveal').forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (r.top < window.innerHeight * 0.92 && r.bottom > 0) el.classList.add('is-in');
        });
    });

    var seasons = document.querySelectorAll('.annuli a');
    var seasonIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            var id = e.target.id;
            seasons.forEach(function (a) {
                a.classList.toggle('is-active', a.getAttribute('data-season') === id);
            });
        });
    }, { threshold: 0.45 });
    document.querySelectorAll('.season[id]').forEach(function (s) { seasonIo.observe(s); });

    function lightSection(id) {
        var s = document.getElementById(id);
        if (!s) return;
        s.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    }
    function onHash() {
        var id = (location.hash || '#origin').slice(1);
        lightSection(id);
    }
    window.addEventListener('hashchange', onHash);
    onHash();

    /* ---- carousels (final orbit + process strip) ---- */
    function makeCarousel(root, opts) {
        if (!root) return;
        var slides = Array.prototype.slice.call(root.querySelectorAll(opts.slide));
        if (!slides.length) return;
        var dotsHost = root.querySelector(opts.dots);
        var playBtn = root.querySelector('.orbit-play');
        var prevBtn = root.querySelector('.orbit-prev');
        var nextBtn = root.querySelector('.orbit-next');
        var stepEl = opts.step ? root.querySelector(opts.step) : null;
        var interval = parseInt(root.getAttribute('data-interval'), 10) || 4500;
        var i = 0;
        var playing = !reduce;
        var timer = null;
        var dragX = null;

        root.style.setProperty('--orbit-ms', interval + 'ms');
        if (dotsHost) {
            dotsHost.innerHTML = '';
            slides.forEach(function (_, idx) {
                var b = document.createElement('button');
                b.type = 'button';
                b.setAttribute('aria-label', 'Slide ' + (idx + 1));
                b.addEventListener('click', function () { go(idx, true); });
                dotsHost.appendChild(b);
            });
        }

        function paint() {
            var n = slides.length;
            slides.forEach(function (s, idx) {
                s.classList.remove('is-active', 'is-prev', 'is-next');
                if (idx === i) s.classList.add('is-active');
                else if (idx === (i - 1 + n) % n) s.classList.add('is-prev');
                else if (idx === (i + 1) % n) s.classList.add('is-next');
            });
            if (opts.onPaint) opts.onPaint(i, slides);
            if (dotsHost) {
                Array.prototype.forEach.call(dotsHost.children, function (d, idx) {
                    d.classList.toggle('is-active', idx === i);
                });
            }
            if (stepEl) {
                stepEl.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
            }
            root.classList.toggle('is-playing', playing);
            if (playBtn) {
                playBtn.classList.toggle('is-playing', playing);
                playBtn.setAttribute('aria-label', playing ? 'Pause slideshow' : 'Play slideshow');
                playBtn.textContent = playing ? '❚❚' : '▶';
            }
        }

        function clearTimer() {
            if (timer) { clearTimeout(timer); timer = null; }
        }

        function arm() {
            clearTimer();
            if (!playing || reduce) return;
            // restart progress bar
            root.classList.remove('is-playing');
            void root.offsetWidth;
            root.classList.add('is-playing');
            timer = setTimeout(function () { go(i + 1, false); }, interval);
        }

        function go(next, user) {
            i = ((next % slides.length) + slides.length) % slides.length;
            paint();
            if (user) playing = playing; // keep state
            arm();
        }

        function togglePlay() {
            playing = !playing;
            paint();
            arm();
        }

        if (prevBtn) prevBtn.addEventListener('click', function () { go(i - 1, true); });
        if (nextBtn) nextBtn.addEventListener('click', function () { go(i + 1, true); });
        if (playBtn) playBtn.addEventListener('click', togglePlay);

        var surface = root.querySelector(opts.surface) || root;
        surface.addEventListener('pointerdown', function (e) {
            if (e.target.closest('button')) return;
            dragX = e.clientX;
            surface.setPointerCapture(e.pointerId);
            clearTimer();
        });
        surface.addEventListener('pointerup', function (e) {
            if (dragX == null) return;
            var dx = e.clientX - dragX;
            dragX = null;
            if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1), true);
            else arm();
        });
        surface.addEventListener('pointercancel', function () { dragX = null; arm(); });
        root.addEventListener('mouseenter', function () { if (playing) clearTimer(); });
        root.addEventListener('mouseleave', function () { if (playing) arm(); });

        paint();
        arm();
    }

    makeCarousel(document.getElementById('final-carousel'), {
        slide: '.orbit-slide',
        dots: '.orbit-dots',
        surface: '.orbit-stage'
    });

    makeCarousel(document.getElementById('process-carousel'), {
        slide: '.process-slide',
        dots: '.process-dots',
        step: '#process-step',
        surface: '.process-viewport',
        onPaint: function (idx, slides) {
            var track = document.querySelector('#process-carousel .process-track');
            if (track) track.style.transform = 'translateX(' + (-idx * 100) + '%)';
            slides.forEach(function (s, j) {
                s.classList.toggle('is-active', j === idx);
            });
        }
    });

    /* ---- background field ---- */
    (function field() {
        var c = document.getElementById('shell-field');
        if (!c) return;
        var ctx = c.getContext('2d');
        var pts = [];
        function size() {
            c.width = window.innerWidth;
            c.height = window.innerHeight;
        }
        function seed() {
            pts = [];
            var n = Math.round((c.width * c.height) / 28000);
            for (var i = 0; i < n; i++) pts.push({ x: Math.random() * c.width, y: Math.random() * c.height });
        }
        function draw(t) {
            var w = c.width, h = c.height, col = accent();
            ctx.clearRect(0, 0, w, h);
            var step = 14;
            for (var y = 0; y < h; y += step) {
                for (var x = 0; x < w; x += step) {
                    var d1 = 1e9, d2 = 1e9;
                    for (var i = 0; i < pts.length; i++) {
                        var dx = pts[i].x - x, dy = pts[i].y - y;
                        var d = dx * dx + dy * dy;
                        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
                    }
                    var edge = Math.abs(Math.sqrt(d2) - Math.sqrt(d1));
                    if (edge < 1.8) {
                        ctx.fillStyle = col;
                        ctx.globalAlpha = 0.45;
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
            ctx.globalAlpha = 1;
            if (!reduce) {
                pts.forEach(function (p, i) {
                    p.x += Math.sin(t / 2400 + i) * 0.12;
                    p.y += Math.cos(t / 2600 + i * 0.7) * 0.12;
                });
            }
        }
        size(); seed();
        var last = 0;
        function loop(t) {
            if (t - last > 80) { draw(t); last = t; }
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
        window.addEventListener('resize', function () { size(); seed(); });
    })();

    /* ---- Lloyd's algorithm simulation ---- */
    (function pack() {
        var c = document.getElementById('relax-canvas');
        if (!c) return;
        var ctx = c.getContext('2d');
        var W = c.width, H = c.height;
        var N = 48;
        var pts = [];
        var ghosts = [];
        var centroids = [];
        var pass = 0;
        var anim = null;
        var readout = document.getElementById('pass-readout');
        var stats = document.getElementById('lloyd-stats');

        function seed() {
            if (anim) cancelAnimationFrame(anim);
            anim = null;
            pts = [];
            ghosts = [];
            centroids = [];
            for (var i = 0; i < N; i++) {
                pts.push({
                    x: 36 + Math.random() * (W - 72),
                    y: 36 + Math.random() * (H - 72)
                });
            }
            pass = 0;
            if (readout) readout.textContent = 'pass 0 / 4';
            if (stats) stats.textContent = N + ' sites · mean drift —';
            draw(null, 1);
        }

        function accumulate() {
            var step = 3;
            var cell = new Array(pts.length);
            for (var i = 0; i < pts.length; i++) cell[i] = { sx: 0, sy: 0, n: 0, minX: W, minY: H, maxX: 0, maxY: 0 };
            for (var y = 0; y < H; y += step) {
                for (var x = 0; x < W; x += step) {
                    var best = 0, d1 = 1e9, d2 = 1e9;
                    for (var i = 0; i < pts.length; i++) {
                        var dx = pts[i].x - x, dy = pts[i].y - y;
                        var d = dx * dx + dy * dy;
                        if (d < d1) { d2 = d1; d1 = d; best = i; }
                        else if (d < d2) d2 = d;
                    }
                    var c0 = cell[best];
                    c0.sx += x; c0.sy += y; c0.n++;
                    if (x < c0.minX) c0.minX = x;
                    if (y < c0.minY) c0.minY = y;
                    if (x > c0.maxX) c0.maxX = x;
                    if (y > c0.maxY) c0.maxY = y;
                }
            }
            return cell;
        }

        function draw(cell, t) {
            var col = accent();
            var step = 3;
            if (!cell) cell = accumulate();
            ctx.fillStyle = '#080808';
            ctx.fillRect(0, 0, W, H);

            for (var y = 0; y < H; y += step) {
                for (var x = 0; x < W; x += step) {
                    var best = 0, d1 = 1e9, d2 = 1e9;
                    for (var i = 0; i < pts.length; i++) {
                        var dx = pts[i].x - x, dy = pts[i].y - y;
                        var d = dx * dx + dy * dy;
                        if (d < d1) { d2 = d1; d1 = d; best = i; }
                        else if (d < d2) d2 = d;
                    }
                    var edge = Math.abs(Math.sqrt(d2) - Math.sqrt(d1));
                    var z = 1 - Math.min(1, Math.sqrt(d1) / 140);
                    if (edge < 1.8) {
                        ctx.fillStyle = col;
                        ctx.globalAlpha = 0.95;
                    } else {
                        var tone = 12 + z * 22 + (best % 5) * 2;
                        ctx.fillStyle = 'rgb(' + tone + ',' + tone + ',' + (tone + 2) + ')';
                        ctx.globalAlpha = 1;
                    }
                    ctx.fillRect(x, y, step, step);
                }
            }
            ctx.globalAlpha = 1;

            // ghost trails from previous sites
            for (var g = 0; g < ghosts.length; g++) {
                var gp = ghosts[g];
                var np = pts[g];
                if (!gp || !np) continue;
                ctx.strokeStyle = 'rgba(245,245,245,0.18)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(gp.x, gp.y);
                ctx.lineTo(np.x, np.y);
                ctx.stroke();
                ctx.fillStyle = 'rgba(245,245,245,0.25)';
                ctx.beginPath();
                ctx.arc(gp.x, gp.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // centroid markers
            for (var i = 0; i < centroids.length; i++) {
                var ct = centroids[i];
                if (!ct) continue;
                ctx.strokeStyle = colorWithAlpha(col, 0.55);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(ct.x - 4, ct.y);
                ctx.lineTo(ct.x + 4, ct.y);
                ctx.moveTo(ct.x, ct.y - 4);
                ctx.lineTo(ct.x, ct.y + 4);
                ctx.stroke();
            }

            // current sites
            for (var i = 0; i < pts.length; i++) {
                var p = pts[i];
                ctx.fillStyle = col;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(245,245,245,0.85)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }

            // HUD
            ctx.fillStyle = 'rgba(245,245,245,0.45)';
            ctx.font = '11px poppins, sans-serif';
            ctx.fillText('Lloyd relaxation · sites → cell centroids', 16, 22);
            ctx.fillText('pass ' + pass + ' / 4', 16, H - 16);
            return cell;
        }

        function colorWithAlpha(hex, a) {
            // accent is usually #rrggbb
            if (!hex || hex.charAt(0) !== '#' || hex.length < 7) return 'rgba(199,0,57,' + a + ')';
            var r = parseInt(hex.slice(1, 3), 16);
            var g = parseInt(hex.slice(3, 5), 16);
            var b = parseInt(hex.slice(5, 7), 16);
            return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
        }

        function computeCentroids(cell) {
            var out = [];
            var drift = 0, count = 0;
            for (var i = 0; i < pts.length; i++) {
                if (cell[i].n < 4) {
                    out[i] = { x: pts[i].x, y: pts[i].y };
                    continue;
                }
                var cx = cell[i].sx / cell[i].n;
                var cy = cell[i].sy / cell[i].n;
                // keep a soft margin inside the frame
                cx = Math.max(24, Math.min(W - 24, cx));
                cy = Math.max(24, Math.min(H - 24, cy));
                out[i] = { x: cx, y: cy };
                var dx = cx - pts[i].x, dy = cy - pts[i].y;
                drift += Math.sqrt(dx * dx + dy * dy);
                count++;
            }
            return { centroids: out, mean: count ? drift / count : 0 };
        }

        function animateTo(targets, meanDrift, done) {
            ghosts = pts.map(function (p) { return { x: p.x, y: p.y }; });
            centroids = targets;
            var start = null;
            var dur = reduce ? 0 : 520;
            function step(now) {
                if (start == null) start = now;
                var t = dur ? Math.min(1, (now - start) / dur) : 1;
                var e = t * (2 - t);
                for (var i = 0; i < pts.length; i++) {
                    pts[i].x = ghosts[i].x + (targets[i].x - ghosts[i].x) * e;
                    pts[i].y = ghosts[i].y + (targets[i].y - ghosts[i].y) * e;
                }
                draw(null, e);
                if (t < 1) {
                    anim = requestAnimationFrame(step);
                } else {
                    anim = null;
                    if (stats) stats.textContent = N + ' sites · mean drift ' + meanDrift.toFixed(1) + 'px';
                    if (done) done();
                }
            }
            if (dur === 0) {
                for (var i = 0; i < pts.length; i++) {
                    pts[i].x = targets[i].x;
                    pts[i].y = targets[i].y;
                }
                draw(null, 1);
                if (stats) stats.textContent = N + ' sites · mean drift ' + meanDrift.toFixed(1) + 'px';
                if (done) done();
            } else {
                anim = requestAnimationFrame(step);
            }
        }

        function lloydPass(done) {
            var cell = accumulate();
            var result = computeCentroids(cell);
            pass++;
            if (readout) readout.textContent = 'pass ' + pass + ' / 4';
            animateTo(result.centroids, result.mean, done);
        }

        function relaxFour() {
            if (anim) return;
            pass = 0;
            if (readout) readout.textContent = 'pass 0 / 4';
            var n = 0;
            function tick() {
                if (n >= 4) return;
                lloydPass(function () {
                    n++;
                    setTimeout(tick, reduce ? 0 : 180);
                });
            }
            tick();
        }

        seed();
        var reseed = document.getElementById('reseed');
        var relax = document.getElementById('relax');
        if (reseed) reseed.addEventListener('click', seed);
        if (relax) relax.addEventListener('click', relaxFour);
    })();

    /* ---- terrace builder ---- */
    (function stack() {
        var host = document.getElementById('growth-scute');
        var slider = document.getElementById('seasons');
        var count = document.getElementById('season-count');
        var extrude = document.getElementById('extrude');
        if (!host || !slider) return;

        function paint(n) {
            host.innerHTML = '';
            for (var i = 0; i < n; i++) {
                var ring = document.createElement('div');
                ring.className = 'growth-ring';
                var inset = (i / n) * 46;
                var t = i / Math.max(1, n - 1);
                var dark = 36 + t * 48;
                ring.style.setProperty('--inset', inset + '%');
                ring.style.setProperty('--z', (i * 20) + 'px');
                ring.style.setProperty('--fill', i === n - 1
                    ? 'color-mix(in srgb, var(--accent) 70%, #2a2a2a)'
                    : 'rgb(' + (dark + 36) + ',' + dark + ',' + Math.max(20, dark - 8) + ')');
                host.appendChild(ring);
            }
            if (count) count.textContent = String(n);
        }

        paint(parseInt(slider.value, 10));
        slider.addEventListener('input', function () { paint(parseInt(slider.value, 10)); });
        if (extrude) {
            extrude.addEventListener('change', function () {
                host.classList.toggle('is-extruded', extrude.checked);
            });
        }
    })();

    /* ---- pigment terrace: grey base → brown / yellow with height ---- */
    (function pigment() {
        var host = document.getElementById('pigment-scute');
        var scrub = document.getElementById('z-scrub');
        var chip = document.getElementById('z-chip');
        var swatches = document.querySelectorAll('#swatch-run i');
        if (!host || !scrub) return;
        var N = 8;
        var grey = [92, 92, 92];
        var brown = [92, 52, 28];
        var yellow = [255, 236, 140];

        function mix(a, b, t) {
            return [
                Math.round(a[0] + (b[0] - a[0]) * t),
                Math.round(a[1] + (b[1] - a[1]) * t),
                Math.round(a[2] + (b[2] - a[2]) * t)
            ];
        }
        function rgb(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }

        function paint() {
            var z = parseInt(scrub.value, 10) / 100;
            if (chip) chip.textContent = z.toFixed(2);
            host.innerHTML = '';
            for (var i = 0; i < N; i++) {
                var ring = document.createElement('div');
                ring.className = 'growth-ring';
                var inset = (i / N) * 46;
                var height = i / (N - 1);
                var target = mix(brown, yellow, height);
                var color = height <= z + 0.001 ? mix(grey, target, Math.min(1, z * 1.15)) : grey;
                ring.style.setProperty('--inset', inset + '%');
                ring.style.setProperty('--z', (i * 20) + 'px');
                ring.style.setProperty('--fill', rgb(color));
                host.appendChild(ring);
            }
            swatches.forEach(function (el, idx) {
                var h = idx / (swatches.length - 1);
                el.classList.toggle('is-lit', z > 0.02 && h <= z + 0.05);
            });
        }

        paint();
        scrub.addEventListener('input', paint);
    })();

    /* ---- hero: living terraced scute colony ---- */
    (function heroScute() {
        var c = document.getElementById('hero-scute');
        if (!c) return;
        var ctx = c.getContext('2d');
        var W = c.width, H = c.height;
        var N = 13;
        var pts = [];
        var lift = [];
        var shapes = [];
        var mx = 0.5, my = 0.5;
        var host = document.querySelector('.hero-copy') || c;
        var settle = 0;
        var accentRGB = { r: 199, g: 0, b: 57 };

        function rnd(a, b) { return a + Math.random() * (b - a); }

        function parseAccent() {
            var el = document.createElement('span');
            el.style.color = accent();
            document.body.appendChild(el);
            var cs = getComputedStyle(el).color;
            document.body.removeChild(el);
            var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(cs);
            if (m) accentRGB = { r: +m[1], g: +m[2], b: +m[3] };
        }

        function seed() {
            pts = [];
            lift = [];
            shapes = [];
            var cx = W * 0.5, cy = H * 0.52;
            for (var i = 0; i < N; i++) {
                var a = (i / N) * Math.PI * 2 + rnd(-0.25, 0.25);
                var r = i === 0 ? rnd(6, 24) : rnd(78, 215);
                pts.push({
                    x: cx + Math.cos(a) * r * rnd(0.5, 1.05),
                    y: cy + Math.sin(a) * r * rnd(0.48, 0.95)
                });
                lift.push(0);
                shapes.push({
                    sides: 5 + (i % 3),
                    rot: rnd(0, Math.PI),
                    seasons: 3 + (i % 3),
                    jagged: rnd(0.08, 0.22)
                });
            }
        }

        function nearestHalf(i) {
            var best = 1e9;
            for (var j = 0; j < pts.length; j++) {
                if (j === i) continue;
                var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
                var d = Math.sqrt(dx * dx + dy * dy) * 0.48;
                if (d < best) best = d;
            }
            return Math.max(18, Math.min(best, 110));
        }

        function lloydPass() {
            var step = 6, acc = [];
            for (var i = 0; i < pts.length; i++) acc.push({ sx: 0, sy: 0, n: 0 });
            for (var y = 48; y < H - 48; y += step) {
                for (var x = 48; x < W - 48; x += step) {
                    var best = 0, d1 = 1e9;
                    for (var i = 0; i < pts.length; i++) {
                        var dx = pts[i].x - x, dy = pts[i].y - y;
                        var d = dx * dx + dy * dy;
                        if (d < d1) { d1 = d; best = i; }
                    }
                    acc[best].sx += x; acc[best].sy += y; acc[best].n++;
                }
            }
            for (var i = 0; i < pts.length; i++) {
                if (acc[i].n < 4) continue;
                pts[i].x += (acc[i].sx / acc[i].n - pts[i].x) * 0.6;
                pts[i].y += (acc[i].sy / acc[i].n - pts[i].y) * 0.6;
            }
        }

        function scuteVerts(i, scale, t) {
            var p = pts[i], s = shapes[i];
            var R = nearestHalf(i) * scale;
            var verts = [];
            for (var k = 0; k < s.sides; k++) {
                var a = s.rot + (k / s.sides) * Math.PI * 2;
                var wobble = 1 + Math.sin(a * 3 + i + t * 0.4) * s.jagged;
                verts.push({
                    x: p.x + Math.cos(a) * R * wobble,
                    y: p.y + Math.sin(a) * R * wobble * 0.92
                });
            }
            return verts;
        }

        function path(verts, elev) {
            ctx.beginPath();
            for (var i = 0; i < verts.length; i++) {
                var x = verts[i].x, y = verts[i].y - elev;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();
        }

        var seamFrame = 0;
        var seamCache = null;

        function buildSeams() {
            var dots = [];
            var step = 6;
            for (var y = 40; y < H - 40; y += step) {
                for (var x = 40; x < W - 40; x += step) {
                    var d1 = 1e9, d2 = 1e9;
                    for (var i = 0; i < pts.length; i++) {
                        var dx = pts[i].x - x, dy = pts[i].y - y;
                        var d = dx * dx + dy * dy;
                        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
                    }
                    if (Math.abs(Math.sqrt(d2) - Math.sqrt(d1)) < 1.5) dots.push(x, y);
                }
            }
            seamCache = dots;
        }

        function draw(now) {
            var t = now * 0.001;
            ctx.clearRect(0, 0, W, H);
            var ar = accentRGB.r, ag = accentRGB.g, ab = accentRGB.b;

            var g = ctx.createRadialGradient(W * 0.5, H * 0.55, 10, W * 0.5, H * 0.55, W * 0.5);
            g.addColorStop(0, 'rgba(255,255,255,0.035)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);

            var px = mx * W, py = my * H;
            for (var i = 0; i < pts.length; i++) {
                var dx = pts[i].x - px, dy = pts[i].y - py;
                var d = Math.sqrt(dx * dx + dy * dy);
                lift[i] += (Math.max(0, 1 - d / 200) - lift[i]) * 0.1;
                if (!reduce && settle) {
                    pts[i].x += Math.sin(t * 0.65 + i * 1.4) * 0.1;
                    pts[i].y += Math.cos(t * 0.5 + i) * 0.08;
                }
            }

            var order = pts.map(function (_, i) { return i; })
                .sort(function (a, b) { return pts[a].y - pts[b].y; });

            for (var o = 0; o < order.length; o++) {
                var i = order[o];
                var s = shapes[i];
                var hot = lift[i];
                var base = 8 + hot * 26 + (reduce ? 0 : Math.sin(t * 1.3 + i) * 1.4);

                for (var tier = 0; tier < s.seasons; tier++) {
                    var scale = 1 - tier * (0.55 / s.seasons);
                    var elev = base + tier * (8 + hot * 5);
                    var verts = scuteVerts(i, scale, t);
                    var peak = tier === s.seasons - 1;

                    if (tier > 0) {
                        var prev = scuteVerts(i, 1 - (tier - 1) * (0.55 / s.seasons), t);
                        var elev0 = base + (tier - 1) * (8 + hot * 5);
                        for (var v = 0; v < verts.length; v++) {
                            var n = (v + 1) % verts.length;
                            ctx.beginPath();
                            ctx.moveTo(prev[v].x, prev[v].y - elev0);
                            ctx.lineTo(prev[n].x, prev[n].y - elev0);
                            ctx.lineTo(verts[n].x, verts[n].y - elev);
                            ctx.lineTo(verts[v].x, verts[v].y - elev);
                            ctx.closePath();
                            ctx.fillStyle = 'rgba(0,0,0,' + (0.2 + tier * 0.05) + ')';
                            ctx.fill();
                            ctx.strokeStyle = 'rgba(245,245,245,0.04)';
                            ctx.stroke();
                        }
                    }

                    path(verts, elev);
                    if (peak) {
                        ctx.fillStyle = 'rgba(' + ar + ',' + ag + ',' + ab + ',' + (0.05 + hot * 0.32 + (i === 0 ? 0.1 : 0)) + ')';
                        ctx.fill();
                    } else {
                        ctx.fillStyle = 'rgba(245,245,245,' + (0.015 + tier * 0.01) + ')';
                        ctx.fill();
                    }
                    ctx.strokeStyle = peak
                        ? (i === 0 || hot > 0.35
                            ? 'rgba(' + ar + ',' + ag + ',' + ab + ',' + (0.55 + hot * 0.4) + ')'
                            : 'rgba(245,245,245,' + (0.28 + hot * 0.4) + ')')
                        : 'rgba(245,245,245,' + (0.1 + tier * 0.05 + hot * 0.12) + ')';
                    ctx.lineWidth = peak ? (i === 0 ? 1.8 : 1.2) : 0.85;
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(pts[i].x, pts[i].y - base - s.seasons * 8, i === 0 ? 2.2 : 1.5, 0, Math.PI * 2);
                ctx.fillStyle = i === 0
                    ? 'rgba(' + ar + ',' + ag + ',' + ab + ',0.95)'
                    : 'rgba(245,245,245,' + (0.3 + hot * 0.55) + ')';
                ctx.fill();
            }

            if (++seamFrame % 8 === 0 || !seamCache) buildSeams();
            if (seamCache) {
                ctx.fillStyle = 'rgba(245,245,245,0.14)';
                for (var s = 0; s < seamCache.length; s += 2) {
                    ctx.fillRect(seamCache[s], seamCache[s + 1], 1.2, 1.2);
                }
            }

            if (!reduce) {
                var sweep = (Math.sin(t * 0.4) * 0.5 + 0.5) * 0.7 + 0.1;
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                var sg = ctx.createLinearGradient(0, H * sweep, W, H * (sweep + 0.18));
                sg.addColorStop(0, 'rgba(0,0,0,0)');
                sg.addColorStop(0.5, 'rgba(' + ar + ',' + ag + ',' + ab + ',0.09)');
                sg.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = sg;
                ctx.fillRect(0, 0, W, H);
                ctx.restore();
            }

            requestAnimationFrame(draw);
        }

        function onMove(e) {
            var r = host.getBoundingClientRect();
            mx = (e.clientX - r.left) / Math.max(1, r.width);
            my = (e.clientY - r.top) / Math.max(1, r.height);
            c.style.transform = 'translate(-50%, -50%) perspective(900px) rotateX(' +
                (18 + (0.5 - my) * 12) + 'deg) rotateZ(' + (-8 + (mx - 0.5) * 14) + 'deg)';
        }
        host.addEventListener('pointermove', onMove);

        seed();
        parseAccent();
        var passes = 0;
        function relaxIntro() {
            lloydPass();
            passes++;
            if (passes < 4) setTimeout(relaxIntro, 200);
            else settle = 1;
        }
        if (reduce) { for (var k = 0; k < 4; k++) lloydPass(); settle = 1; }
        else setTimeout(relaxIntro, 120);

        requestAnimationFrame(draw);

        // re-parse accent when theme chips change
        document.querySelectorAll('.color-changer a').forEach(function (a) {
            a.addEventListener('click', function () { setTimeout(parseAccent, 30); });
        });
    })();

})();

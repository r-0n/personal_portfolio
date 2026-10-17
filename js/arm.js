(function () {
    if (!document.body.classList.contains('arm-story')) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- dock rail + color changer ---- */
    (function mountDock() {
        function clearBodyTransform() {
            document.body.style.transform = 'none';
        }

        function place() {
            var rail = document.querySelector('.arm-rail');
            var changer = document.querySelector('.color-changer');
            if (!rail || !changer) return false;
            if (document.querySelector('.arm-dock')) {
                clearBodyTransform();
                return true;
            }
            var dock = document.createElement('div');
            dock.className = 'arm-dock';
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
    var railLinks = document.querySelectorAll('.arm-rail a');
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

    /* ---- fullscreen lightbox (image + video gallery nav) ---- */
    var openLightbox = null;
    (function lightbox() {
        var box = document.getElementById('arm-lightbox');
        if (!box) return;
        var img = box.querySelector('[data-arm-fs-img]') || box.querySelector('img');
        var video = box.querySelector('[data-arm-fs-video]');
        var cap = box.querySelector('figcaption');
        var countEl = box.querySelector('[data-arm-fs-count]');
        var closeBtn = box.querySelector('[data-arm-fs-close]');
        var prevBtn = box.querySelector('[data-arm-fs-prev]');
        var nextBtn = box.querySelector('[data-arm-fs-next]');
        var items = [];
        var index = 0;
        var onChange = null;

        function pad(n) {
            return (n < 10 ? '0' : '') + n;
        }

        function stopVideo() {
            if (!video) return;
            video.pause();
            video.removeAttribute('src');
            video.load();
            video.hidden = true;
        }

        function show(n) {
            if (!items.length) return;
            index = ((n % items.length) + items.length) % items.length;
            var item = items[index];
            var isVideo = item.type === 'video';

            if (isVideo && video) {
                img.hidden = true;
                img.removeAttribute('src');
                video.hidden = false;
                video.src = item.src;
                video.setAttribute('aria-label', item.alt || '');
                if (!reduce) {
                    var p = video.play();
                    if (p && typeof p.catch === 'function') p.catch(function () {});
                }
            } else {
                stopVideo();
                img.hidden = false;
                img.src = item.src;
                img.alt = item.alt || '';
            }

            cap.textContent = item.alt || '';
            if (countEl) {
                countEl.hidden = items.length < 2;
                countEl.textContent = pad(index + 1) + ' / ' + pad(items.length);
            }
            var multi = items.length > 1;
            if (prevBtn) prevBtn.hidden = !multi;
            if (nextBtn) nextBtn.hidden = !multi;
            if (typeof onChange === 'function') onChange(index);
        }

        function open(src, alt, gallery, startIndex, changeCb) {
            if (gallery && gallery.length) {
                items = gallery;
                index = typeof startIndex === 'number' ? startIndex : 0;
                onChange = changeCb || null;
            } else if (src) {
                items = [{ src: src, alt: alt || '', type: 'image' }];
                index = 0;
                onChange = null;
            } else {
                return;
            }
            box.hidden = false;
            document.body.classList.add('arm-fs-open');
            show(index);
            closeBtn.focus();
        }

        openLightbox = open;

        function close() {
            box.hidden = true;
            document.body.classList.remove('arm-fs-open');
            img.removeAttribute('src');
            img.hidden = false;
            stopVideo();
            items = [];
            onChange = null;
            if (prevBtn) prevBtn.hidden = true;
            if (nextBtn) nextBtn.hidden = true;
            if (countEl) countEl.hidden = true;
            document.dispatchEvent(new CustomEvent('arm-fs-close'));
        }

        document.querySelectorAll('[data-arm-fs]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-arm-fs');
                var source = id ? document.getElementById(id) : null;
                if (!source) return;
                open(source.currentSrc || source.src, source.alt || '');
            });
        });
        if (prevBtn) prevBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            show(index - 1);
        });
        if (nextBtn) nextBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            show(index + 1);
        });
        closeBtn.addEventListener('click', close);
        box.addEventListener('click', function (e) {
            if (e.target === box) close();
        });
        document.addEventListener('keydown', function (e) {
            if (box.hidden) return;
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowLeft') show(index - 1);
            if (e.key === 'ArrowRight') show(index + 1);
        });
    })();

    /* ---- shared media carousel (drawings + motion) ---- */
    function slideMedia(slide) {
        return slide.querySelector('video, img');
    }

    function mediaLabel(media) {
        if (!media) return '';
        return media.getAttribute('aria-label') || media.alt || '';
    }

    function mediaThumbSrc(media) {
        if (!media) return '';
        if (media.tagName === 'VIDEO') {
            return media.getAttribute('poster') || media.currentSrc || media.src || '';
        }
        return media.currentSrc || media.src || '';
    }

    function mediaGalleryItem(media) {
        if (!media) return { src: '', alt: '', type: 'image' };
        var isVideo = media.tagName === 'VIDEO';
        return {
            src: media.currentSrc || media.src || '',
            alt: mediaLabel(media),
            type: isVideo ? 'video' : 'image'
        };
    }

    function initCarousel(root, keys) {
        if (!root) return;

        var slides = Array.prototype.slice.call(root.querySelectorAll(keys.slide));
        var thumbsWrap = root.querySelector(keys.thumbs);
        var countEl = root.querySelector(keys.count);
        var labelEl = root.querySelector(keys.label);
        var prevBtn = root.querySelector(keys.prev);
        var nextBtn = root.querySelector(keys.next);
        var fsBtn = root.querySelector(keys.fs);
        if (slides.length < 2 || !thumbsWrap) return;

        var PHOTO_MS = 4500;
        var i = 0;
        var timer = null;
        var paused = false;
        var inView = false;
        var thumbs = [];
        var gallery = slides.map(function (slide) {
            return mediaGalleryItem(slideMedia(slide));
        });

        function pad(n) {
            return (n < 10 ? '0' : '') + n;
        }

        function clearTimer() {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        }

        function syncVideos() {
            slides.forEach(function (slide, idx) {
                var v = slide.querySelector('video');
                if (!v) return;
                if (idx === i && inView && !document.body.classList.contains('arm-fs-open')) {
                    v.muted = true;
                    if (!reduce) {
                        var p = v.play();
                        if (p && typeof p.catch === 'function') p.catch(function () {});
                    }
                } else {
                    v.pause();
                }
            });
        }

        function armTimer() {
            clearTimer();
            if (reduce || paused || !inView || document.body.classList.contains('arm-fs-open')) return;
            timer = setTimeout(function () { go(i + 1); }, PHOTO_MS);
        }

        function go(n, fromLightbox) {
            var prev = i;
            i = ((n % slides.length) + slides.length) % slides.length;

            slides.forEach(function (slide, idx) {
                slide.classList.remove('is-active', 'is-exit');
                if (idx === prev && prev !== i) slide.classList.add('is-exit');
                if (idx === i) slide.classList.add('is-active');
            });

            thumbs.forEach(function (btn, idx) {
                btn.classList.toggle('is-on', idx === i);
            });

            if (thumbs[i] && thumbsWrap) {
                var thumb = thumbs[i];
                var left = thumb.offsetLeft - thumbsWrap.clientWidth / 2 + thumb.clientWidth / 2;
                thumbsWrap.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' });
            }

            var media = slideMedia(slides[i]);
            if (countEl) countEl.textContent = pad(i + 1) + ' / ' + pad(slides.length);
            if (labelEl) labelEl.textContent = mediaLabel(media);
            syncVideos();
            if (!fromLightbox) armTimer();
        }

        slides.forEach(function (slide, idx) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('aria-label', 'Go to slide ' + (idx + 1));
            var src = mediaThumbSrc(slideMedia(slide));
            if (src) {
                var thumb = document.createElement('img');
                thumb.src = src;
                thumb.alt = '';
                btn.appendChild(thumb);
            }
            btn.addEventListener('click', function () { go(idx); });
            thumbsWrap.appendChild(btn);
            thumbs.push(btn);
        });

        if (prevBtn) prevBtn.addEventListener('click', function () { go(i - 1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { go(i + 1); });

        if (fsBtn) {
            fsBtn.addEventListener('click', function () {
                if (!openLightbox) return;
                openLightbox(null, null, gallery, i, function (idx) {
                    go(idx, true);
                });
            });
        }

        root.addEventListener('mouseenter', function () {
            paused = true;
            clearTimer();
        });
        root.addEventListener('mouseleave', function () {
            paused = false;
            armTimer();
        });

        var cio = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                inView = e.isIntersecting;
                if (inView) {
                    syncVideos();
                    armTimer();
                } else {
                    clearTimer();
                    syncVideos();
                }
            });
        }, { threshold: 0.3 });
        cio.observe(root);

        document.addEventListener('arm-fs-close', function () {
            syncVideos();
            armTimer();
        });

        go(0);
    }

    initCarousel(document.querySelector('[data-draw-carousel]'), {
        slide: '[data-draw-slide]',
        thumbs: '[data-draw-thumbs]',
        count: '[data-draw-count]',
        label: '[data-draw-label]',
        prev: '[data-draw-prev]',
        next: '[data-draw-next]',
        fs: '[data-draw-fs]'
    });

    initCarousel(document.querySelector('[data-media-carousel]'), {
        slide: '[data-media-slide]',
        thumbs: '[data-media-thumbs]',
        count: '[data-media-count]',
        label: '[data-media-label]',
        prev: '[data-media-prev]',
        next: '[data-media-next]',
        fs: '[data-media-fs]'
    });
})();

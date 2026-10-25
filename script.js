/* ==========================================================================
   script.js — behavior and motion.
   Sections:
     1  Theme toggle          7  3D card tilt
     2  Scroll reveal         8  Magnetic buttons
     3  Cursor spotlight      9  Back to top
     4  Reading progress     10  Smooth scroll
     5  Active nav link      11  Footer year
     6  Count-up stats       12  Preloader
                            13  Split-text reveal
                            14  Particle field
                            15  Custom cursor
                            16  Hero parallax
   Every effect degrades gracefully and respects prefers-reduced-motion.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia &&
                     window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     1. THEME TOGGLE
     ------------------------------------------------------------------------ */
  var STORAGE_KEY = 'site-theme';
  var toggle = document.getElementById('themeToggle');

  function applyTheme(theme) {
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
  }
  function savedTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function saveTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* session only */ }
  }

  var initial = savedTheme();
  if (!initial) {
    initial = window.matchMedia &&
              window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  applyTheme(initial);

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      saveTheme(next);
    });
  }

  /* ------------------------------------------------------------------------
     2. SCROLL REVEAL
     ------------------------------------------------------------------------ */
  var revealItems = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------------------------------
     3. CURSOR SPOTLIGHT
     Moves a large soft radial gradient to follow the pointer. Uses rAF so we
     only touch the DOM once per frame, and only on devices with a real mouse.
     ------------------------------------------------------------------------ */
  var spotlight = document.getElementById('spotlight');
  var hasFinePointer = window.matchMedia &&
                       window.matchMedia('(pointer: fine)').matches;

  if (spotlight && hasFinePointer && !reduceMotion) {
    var sx = window.innerWidth / 2, sy = window.innerHeight / 2;
    var cx = sx, cy = sy;
    var rafId = null;

    function loop() {
      // Ease toward the target for a trailing, weighted feel.
      cx += (sx - cx) * 0.12;
      cy += (sy - cy) * 0.12;
      spotlight.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      rafId = requestAnimationFrame(loop);
    }

    window.addEventListener('mousemove', function (e) {
      sx = e.clientX; sy = e.clientY;
      spotlight.classList.add('on');
      if (rafId === null) rafId = requestAnimationFrame(loop);
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      spotlight.classList.remove('on');
    });
  }

  /* ------------------------------------------------------------------------
     4. READING PROGRESS BAR
     ------------------------------------------------------------------------ */
  var progress = document.getElementById('progress');
  var toTop = document.getElementById('toTop');
  var ticking = false;

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;

    if (progress) progress.style.width = pct + '%';
    if (toTop) toTop.classList.toggle('show', doc.scrollTop > 600);

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------------
     5. ACTIVE NAV LINK
     ------------------------------------------------------------------------ */
  var sections = document.querySelectorAll('main section[id]');
  var navLinks = document.querySelectorAll('nav.links a');

  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute('id');
        navLinks.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ------------------------------------------------------------------------
     6. COUNT-UP STATS
     Counts from 0 to the target once the element is visible.
     ------------------------------------------------------------------------ */
  var counters = document.querySelectorAll('[data-count]');

  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1500;
    var start = null;

    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // easeOutExpo — fast start, gentle settle
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCounter);
    } else {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { countObserver.observe(el); });
    }
  }

  /* ------------------------------------------------------------------------
     7. 3D CARD TILT
     Rotates a card toward the pointer and moves its shine highlight.
     ------------------------------------------------------------------------ */
  if (hasFinePointer && !reduceMotion) {
    var MAX_TILT = 7; // degrees

    document.querySelectorAll('.tilt').forEach(function (card) {
      var rect = null;

      card.addEventListener('mouseenter', function () {
        rect = card.getBoundingClientRect();
        card.style.transition = 'transform .12s ease-out';
      });

      card.addEventListener('mousemove', function (e) {
        if (!rect) rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;   // 0..1
        var py = (e.clientY - rect.top) / rect.height;   // 0..1

        var ry = (px - 0.5) * 2 * MAX_TILT;   // rotateY from x
        var rx = (0.5 - py) * 2 * MAX_TILT;   // rotateX from y

        card.style.transform =
          'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' +
          ry.toFixed(2) + 'deg) translateY(-6px) scale(1.015)';

        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });

      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
        card.style.transform = '';
        rect = null;
      });
    });
  }

  /* ------------------------------------------------------------------------
     8. MAGNETIC BUTTONS
     The button drifts toward the cursor while hovered, then springs back.
     ------------------------------------------------------------------------ */
  if (hasFinePointer && !reduceMotion) {
    var PULL = 0.28; // how far it follows, as a fraction of cursor offset

    document.querySelectorAll('.magnetic').forEach(function (btn) {
      var rect = null;

      btn.addEventListener('mouseenter', function () {
        rect = btn.getBoundingClientRect();
      });

      btn.addEventListener('mousemove', function (e) {
        if (!rect) rect = btn.getBoundingClientRect();
        var dx = e.clientX - (rect.left + rect.width / 2);
        var dy = e.clientY - (rect.top + rect.height / 2);
        btn.style.transform =
          'translate(' + (dx * PULL).toFixed(1) + 'px,' + (dy * PULL).toFixed(1) + 'px)';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
        rect = null;
      });
    });
  }

  /* ------------------------------------------------------------------------
     9. BACK TO TOP
     ------------------------------------------------------------------------ */
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------------------------
     10. SMOOTH SCROLL WITH HEADER OFFSET
     ------------------------------------------------------------------------ */
  var HEADER_OFFSET = 76;

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var hash = link.getAttribute('href');
      if (!hash || hash === '#') return;

      var target;
      try { target = document.querySelector(hash); } catch (e) { return; }
      if (!target) return;

      event.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ------------------------------------------------------------------------
     11. FOOTER YEAR
     ------------------------------------------------------------------------ */
  var footer = document.querySelector('footer .wrap');
  if (footer) {
    footer.innerHTML = footer.innerHTML.replace(/\d{4}/, new Date().getFullYear());
  }

  /* ------------------------------------------------------------------------
     12. PRELOADER
     Counts 0-100, fills the bar, then slides two curtains apart. The body is
     locked while it runs so the page can't be scrolled behind it.
     ------------------------------------------------------------------------ */
  var preloader = document.getElementById('preloader');
  var preFill = document.getElementById('preFill');
  var preCount = document.getElementById('preCount');

  function finishPreloader() {
    if (!preloader) return;
    preloader.classList.add('done');
    document.body.classList.remove('locked');
    // Remove it from the tree once the curtains are clear.
    setTimeout(function () {
      if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
    }, 1000);
  }

  if (preloader) {
    if (reduceMotion) {
      finishPreloader();
    } else {
      document.body.classList.add('locked');
      var preStart = null;
      var PRE_MS = 1100;

      function preStep(ts) {
        if (preStart === null) preStart = ts;
        var p = Math.min((ts - preStart) / PRE_MS, 1);
        var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        var shown = Math.round(eased * 100);

        if (preFill) preFill.style.width = shown + '%';
        if (preCount) preCount.textContent = shown;

        if (p < 1) requestAnimationFrame(preStep);
        else finishPreloader();
      }
      requestAnimationFrame(preStep);
    }
  }

  /* ------------------------------------------------------------------------
     13. SPLIT-TEXT REVEAL
     Wraps each word of [data-split] in a span so they can rise in sequence.
     Nested inline elements (like the gradient span) are preserved.
     ------------------------------------------------------------------------ */
  function splitElement(el) {
    var index = 0;

    function walk(node, parent) {
      var children = Array.prototype.slice.call(node.childNodes);
      children.forEach(function (child) {
        if (child.nodeType === 3) { // text node
          var words = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          words.forEach(function (chunk) {
            if (chunk.trim() === '') {
              frag.appendChild(document.createTextNode(chunk));
            } else {
              var outer = document.createElement('span');
              outer.className = 'word';
              outer.style.setProperty('--wi', index++);
              var inner = document.createElement('span');
              inner.textContent = chunk;
              outer.appendChild(inner);
              frag.appendChild(outer);
            }
          });
          parent.replaceChild(frag, child);
        } else if (child.nodeType === 1) { // element node
          // Skip the gradient span: its text is transparent and painted by a
          // background-clip on the parent, which splitting would break.
          if (child.classList && child.classList.contains('grad')) return;
          walk(child, child);
        }
      });
    }

    walk(el, el);
  }

  if (!reduceMotion) {
    document.querySelectorAll('[data-split]').forEach(splitElement);
  }

  /* ------------------------------------------------------------------------
     14. PARTICLE FIELD
     A canvas constellation: drifting points, lines drawn between neighbours,
     and a gentle pull toward the pointer. Capped for performance.
     ------------------------------------------------------------------------ */
  var field = document.getElementById('field');

  if (field && !reduceMotion) {
    var ctx = field.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var W = 0, H = 0;
    var LINK_DIST = 132;
    var mouse = { x: -9999, y: -9999 };

    function sizeField() {
      W = window.innerWidth;
      H = window.innerHeight;
      field.width = Math.floor(W * dpr);
      field.height = Math.floor(H * dpr);
      field.style.width = W + 'px';
      field.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density scales with area, but stays bounded.
      var target = Math.round((W * H) / 16000);
      target = Math.max(28, Math.min(target, 110));

      particles = [];
      for (var i = 0; i < target; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.32,
          vy: (Math.random() - 0.5) * 0.32,
          r: Math.random() * 1.5 + 0.6
        });
      }
    }

    function accentRGB() {
      var v = getComputedStyle(root).getPropertyValue('--accent').trim();
      if (v.charAt(0) === '#') {
        var hex = v.slice(1);
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
      }
      return [224, 164, 74];
    }

    var rgb = accentRGB();
    var mouseBound = false;

    function drawField() {
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around the edges.
        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20;
        if (p.y > H + 20) p.y = -20;

        // Gentle attraction toward the pointer.
        var dxm = mouse.x - p.x;
        var dym = mouse.y - p.y;
        var dm = Math.sqrt(dxm * dxm + dym * dym);
        if (dm < 190 && dm > 0.001) {
          p.x += (dxm / dm) * 0.42;
          p.y += (dym / dm) * 0.42;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.55)';
        ctx.fill();

        // Link to nearby particles.
        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK_DIST) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            var a = (1 - d / LINK_DIST) * 0.22;
            ctx.strokeStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a.toFixed(3) + ')';
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(drawField);
    }

    sizeField();
    drawField();

    window.addEventListener('resize', function () {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeField();
    });

    if (hasFinePointer) {
      window.addEventListener('mousemove', function (e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }, { passive: true });
      document.addEventListener('mouseleave', function () {
        mouse.x = -9999; mouse.y = -9999;
      });
    }

    // Re-read the accent color when the theme flips.
    if (toggle) {
      toggle.addEventListener('click', function () {
        setTimeout(function () { rgb = accentRGB(); }, 60);
      });
    }
  }

  /* ------------------------------------------------------------------------
     15. CUSTOM CURSOR
     A dot that tracks exactly and a ring that lags behind. The ring grows
     over anything interactive.
     ------------------------------------------------------------------------ */
  var cursorDot = document.getElementById('cursorDot');
  var cursorRing = document.getElementById('cursorRing');

  if (cursorDot && cursorRing && hasFinePointer && !reduceMotion) {
    var dotX = 0, dotY = 0, ringX = 0, ringY = 0;

    window.addEventListener('mousemove', function (e) {
      dotX = e.clientX; dotY = e.clientY;
      document.body.classList.add('cursor-on');
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      document.body.classList.remove('cursor-on');
    });

    (function cursorLoop() {
      ringX += (dotX - ringX) * 0.16;
      ringY += (dotY - ringY) * 0.16;
      cursorDot.style.transform = 'translate(' + dotX + 'px,' + dotY + 'px) translate(-50%,-50%)';
      cursorRing.style.transform = 'translate(' + ringX.toFixed(2) + 'px,' + ringY.toFixed(2) + 'px) translate(-50%,-50%)';
      requestAnimationFrame(cursorLoop);
    })();

    // Grow the ring over interactive elements.
    document.querySelectorAll('a, button, .card, .work-item').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursorRing.classList.add('grow'); });
      el.addEventListener('mouseleave', function () { cursorRing.classList.remove('grow'); });
    });
  }

  /* ------------------------------------------------------------------------
     16. HERO PARALLAX
     The hero content drifts and fades slightly as you scroll past it.
     ------------------------------------------------------------------------ */
  var heroInner = document.getElementById('heroInner');
  var heroEl = document.getElementById('hero');

  if (heroInner && heroEl && !reduceMotion) {
    var parallaxQueued = false;

    function heroParallax() {
      var y = window.pageYOffset;
      var h = heroEl.offsetHeight || 1;
      if (y < h * 1.4) {
        var p = Math.min(y / h, 1);
        heroInner.style.transform = 'translateY(' + (p * 46).toFixed(1) + 'px)';
        heroInner.style.opacity = (1 - p * 0.75).toFixed(3);
      }
      parallaxQueued = false;
    }

    window.addEventListener('scroll', function () {
      if (!parallaxQueued) {
        parallaxQueued = true;
        requestAnimationFrame(heroParallax);
      }
    }, { passive: true });
  }

})();

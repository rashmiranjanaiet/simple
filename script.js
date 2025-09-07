// script.js — enhanced interactivity: reveals, tilt, custom cursor, form UX
(function () {
  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const nav = document.getElementById('nav');
  const yearEl = document.getElementById('year');
  const form = document.getElementById('contactForm');
  const feedback = document.getElementById('formFeedback');
  const resetBtn = document.getElementById('resetBtn');
  const submitBtn = document.getElementById('submitBtn');
  const cursor = document.getElementById('cursor');
  const cursorDot = cursor?.querySelector('.cursor-dot');
  const cursorRing = cursor?.querySelector('.cursor-ring');

  yearEl.textContent = new Date().getFullYear();

  /* -------------------------
     Theme toggle with persistence
     ------------------------- */
  const storedTheme = localStorage.getItem('site-theme');
  if (storedTheme) {
    document.body.className = storedTheme;
    themeToggle.setAttribute('aria-pressed', storedTheme === 'theme-dark');
    themeToggle.textContent = storedTheme === 'theme-dark' ? '☀️' : '🌙';
  }
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('theme-dark');
    if (!isDark) document.body.classList.add('theme-light');
    else document.body.classList.remove('theme-light');
    themeToggle.setAttribute('aria-pressed', isDark);
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('site-theme', isDark ? 'theme-dark' : 'theme-light');
  });

  /* -------------------------
     Mobile nav simple toggle
     ------------------------- */
  mobileNavToggle.addEventListener('click', () => {
    const expanded = mobileNavToggle.getAttribute('aria-expanded') === 'true';
    mobileNavToggle.setAttribute('aria-expanded', !expanded);
    if (nav.style.display === 'block') {
      nav.style.display = '';
      mobileNavToggle.textContent = '☰';
    } else {
      nav.style.display = 'block';
      mobileNavToggle.textContent = '✕';
    }
  });

  /* -------------------------
     Smooth scroll for internal links
     ------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // close mobile nav if open
        if (mobileNavToggle.getAttribute('aria-expanded') === 'true') {
          mobileNavToggle.click();
        }
      }
    });
  });

  /* -------------------------
     IntersectionObserver reveals (performant)
     Elements with data-reveal will get 'revealed' class when visible
     ------------------------- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('[data-reveal]').forEach(el => {
      // additive tiny delay based on position for nicer stagger
      const rect = el.getBoundingClientRect();
      const delay = Math.min(300, Math.max(0, Math.round(rect.top * 0.12)));
      el.style.transitionDelay = `${delay}ms`;
      revealObserver.observe(el);
    });
  } else {
    // if reduced motion set, reveal everything immediately
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('revealed'));
  }

  /* -------------------------
     Lightweight tilt effect on cards
     adds gentle 3D tilt while moving mouse over .tilt elements
     ------------------------- */
  function attachTilt(el) {
    const height = el.offsetHeight;
    const width = el.offsetWidth;
    el.addEventListener('mousemove', (ev) => {
      const rect = el.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const rotY = ((x / width) - 0.5) * 8; // degrees
      const rotX = ((y / height) - 0.5) * -8;
      el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  }
  // attach to tilt items if motion allowed and not touch device
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!prefersReduced && !isTouch) {
    document.querySelectorAll('[data-tilt]').forEach(attachTilt);
  }

  /* -------------------------
     Custom cursor: dot + ring
     Hidden on touch & respects reduced-motion preference
     ------------------------- */
  if (cursor && !isTouch && !prefersReduced) {
    let mouseX = -999, mouseY = -999;
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    });

    // enlarge cursor on interactive elements
    const interactive = 'a, button, input, textarea, [role="button"], .btn';
    document.querySelectorAll(interactive).forEach(node => {
      node.addEventListener('pointerenter', () => {
        cursorDot.style.transform = 'translate(-50%,-50%) scale(0.6)';
        cursorRing.style.transform = 'translate(-50%,-50%) scale(1.6)';
        cursorRing.style.opacity = '1';
      });
      node.addEventListener('pointerleave', () => {
        cursorDot.style.transform = 'translate(-50%,-50%) scale(1)';
        cursorRing.style.transform = 'translate(-50%,-50%) scale(1)';
        cursorRing.style.opacity = '0.9';
      });
    });

    // hide cursor while typing in inputs
    document.querySelectorAll('input, textarea').forEach(inp => {
      inp.addEventListener('focus', () => cursor.style.opacity = '0');
      inp.addEventListener('blur',  () => cursor.style.opacity = '1');
    });

    // small idle animation for ring
    let ringAnim;
    function startRingPulse() {
      ringAnim = setInterval(() => {
        cursorRing.animate([{ transform: 'translate(-50%,-50%) scale(1)'},{ transform: 'translate(-50%,-50%) scale(1.06)' },{ transform: 'translate(-50%,-50%) scale(1)' }], {
          duration: 2800,
          iterations: 1,
          easing: 'ease-in-out'
        });
      }, 3200);
    }
    startRingPulse();
    window.addEventListener('blur', () => clearInterval(ringAnim));
  } else if (cursor) {
    cursor.style.display = 'none';
  }

  /* -------------------------
     Form validation & UX
     - client-side validation
     - simulated async submit to show loading + success
     - mailto fallback opens email client after success
     ------------------------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    feedback.textContent = '';
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (name.length < 2) {
      feedback.textContent = 'Please enter your name (2+ characters).';
      form.name.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      feedback.textContent = 'Please enter a valid email address.';
      form.email.focus();
      return;
    }
    if (message.length < 10) {
      feedback.textContent = 'Message is too short — tell us more about your project.';
      form.message.focus();
      return;
    }

    // simulate sending
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    // tiny simulated network activity (no backend). keep short.
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
      feedback.textContent = 'Thanks — message prepared. Your email client will open so you can send it (or use your preferred workflow).';
      // create mailto as fallback
      const subject = encodeURIComponent(`Website inquiry from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      const mailto = `mailto:hello@aurora.example?subject=${subject}&body=${body}`;
      // open in new tab to avoid losing state (some browsers block)
      window.location.href = mailto;
    }, 900);
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    feedback.textContent = '';
    form.name.focus();
  });

  /* -------------------------
     Accessibility: close mobile nav on Escape
     ------------------------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (mobileNavToggle.getAttribute('aria-expanded') === 'true') mobileNavToggle.click();
    }
  });

  /* -------------------------
     Tiny performance tweak: precompute reveal elements for quick I/O
     ------------------------- */
  // ensure any initially visible reveal elements become revealed immediately (e.g., hero)
  document.querySelectorAll('[data-reveal]').forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
      el.classList.add('revealed');
    }
  });

})();

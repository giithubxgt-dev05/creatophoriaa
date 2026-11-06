/* ═══════════════════════════════════════════════════════════════
   CREATOPHORIA STUDIO — JavaScript
   Ultra-premium interactions & animations
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Utility ──────────────────────────────────────────────────── */
const qs  = (s, p = document) => p.querySelector(s);
const qsa = (s, p = document) => [...p.querySelectorAll(s)];

/* ═══════════════════════════════════════════════════════════════
   PRELOADER
   ═══════════════════════════════════════════════════════════════ */
(function initPreloader() {
  const preloader   = qs('#preloader');
  const fill        = qs('#preloaderFill');
  const pText       = qs('#preloaderText');
  const msgs        = ['Crafting experience...', 'Loading aesthetics...', 'Almost ready...', 'Welcome.'];
  let   progress    = 0;
  let   msgIdx      = 0;

  document.body.classList.add('loading');

  const interval = setInterval(() => {
    progress += Math.random() * 18 + 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(hidePreloader, 300);
    }
    fill.style.width = progress + '%';
    const newMsgIdx = Math.floor((progress / 100) * msgs.length);
    if (newMsgIdx > msgIdx && newMsgIdx < msgs.length) {
      msgIdx = newMsgIdx;
      pText.style.opacity = '0';
      setTimeout(() => {
        pText.textContent = msgs[msgIdx];
        pText.style.opacity = '1';
      }, 200);
    }
  }, 120);

  function hidePreloader() {
    preloader.classList.add('hidden');
    document.body.classList.remove('loading');
    setTimeout(() => {
      preloader.remove();
      initHeroAnimations();
    }, 600);
  }
})();

/* ═══════════════════════════════════════════════════════════════
   AURORA CANVAS BACKGROUND
   ═══════════════════════════════════════════════════════════════ */
(function initAurora() {
  const canvas = qs('#auroraCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height, animFrame;

  function resize() {
    width  = canvas.width  = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  // Orbs definition
  const orbs = [
    { x: 0.2, y: 0.3, r: 0.35, color: 'rgba(0,229,168,', speed: 0.0004, offset: 0   },
    { x: 0.7, y: 0.2, r: 0.4,  color: 'rgba(83,243,255,', speed: 0.0003, offset: 1   },
    { x: 0.5, y: 0.7, r: 0.3,  color: 'rgba(123,97,255,', speed: 0.0005, offset: 2   },
    { x: 0.85,y: 0.5, r: 0.25, color: 'rgba(0,229,168,',  speed: 0.0006, offset: 0.5 },
  ];

  let t = 0;

  function draw() {
    t += 1;
    ctx.clearRect(0, 0, width, height);

    orbs.forEach(orb => {
      const px = (orb.x + Math.sin(t * orb.speed + orb.offset) * 0.12) * width;
      const py = (orb.y + Math.cos(t * orb.speed + orb.offset) * 0.08) * height;
      const r  = orb.r * Math.min(width, height);
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0, orb.color + '0.12)');
      grad.addColorStop(0.5, orb.color + '0.05)');
      grad.addColorStop(1, orb.color + '0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    });

    animFrame = requestAnimationFrame(draw);
  }

  draw();
})();

/* ═══════════════════════════════════════════════════════════════
   PARTICLE FIELD
   ═══════════════════════════════════════════════════════════════ */
(function initParticles() {
  const container = qs('#heroParticles');
  if (!container) return;

  const count = 60;
  const particles = [];

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      opacity: 0;
      will-change: transform, opacity;
    `;

    const size    = Math.random() * 3 + 1;
    const isAccent = Math.random() > 0.6;
    el.style.width  = size + 'px';
    el.style.height = size + 'px';
    el.style.background = isAccent ? '#00E5A8' : (Math.random() > 0.5 ? '#53F3FF' : 'rgba(255,255,255,0.6)');
    el.style.boxShadow = isAccent ? '0 0 6px rgba(0,229,168,0.6)' : 'none';
    el.style.left = Math.random() * 100 + '%';

    container.appendChild(el);

    const p = {
      el,
      x:    Math.random() * 100,
      y:    Math.random() * 100,
      vy:   -(Math.random() * 0.15 + 0.05),
      vx:   (Math.random() - 0.5) * 0.05,
      life: Math.random(),
      maxLife: Math.random() * 0.6 + 0.3,
    };

    particles.push(p);
    p.life = Math.random();
  }

  function animateParticles() {
    particles.forEach(p => {
      p.life += 0.003;
      if (p.life >= 1) {
        p.life = 0;
        p.x = Math.random() * 100;
        p.y = 100 + Math.random() * 10;
        p.el.style.left = p.x + '%';
      }

      p.y += p.vy;
      p.x += p.vx;

      // Fade in/out based on life
      let opacity;
      if (p.life < 0.1)       opacity = p.life / 0.1;
      else if (p.life > 0.85) opacity = 1 - (p.life - 0.85) / 0.15;
      else                     opacity = 0.5 + Math.sin(p.life * Math.PI) * 0.3;

      p.el.style.transform = `translate(${p.vx * 200}px, ${(p.y - 100) * 8}px)`;
      p.el.style.opacity   = opacity * 0.7;
    });

    requestAnimationFrame(animateParticles);
  }

  animateParticles();
})();

/* ═══════════════════════════════════════════════════════════════
   CUSTOM CURSOR
   ═══════════════════════════════════════════════════════════════ */
(function initCursor() {
  const cursor    = qs('#cursor');
  const cursorDot = qs('#cursorDot');
  if (!cursor || !cursorDot) return;

  let cursorX = 0, cursorY = 0;
  let dotX = 0, dotY = 0;
  let targetX = 0, targetY = 0;

  document.addEventListener('mousemove', e => {
    targetX = e.clientX;
    targetY = e.clientY;

    // Dot follows instantly
    dotX = e.clientX;
    dotY = e.clientY;
    cursorDot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
  });

  // Cursor follows with refined smooth physics (snappy & precise)
  function animateCursor() {
    cursorX += (targetX - cursorX) * 0.28;
    cursorY += (targetY - cursorY) * 0.28;
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hover states
  const hoverables = 'a, button, .svc-card, .work-item, .testi-card, .wf-btn, .btn-primary, .btn-ghost, .btn-submit, select';

  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverables)) {
      cursor.classList.add('hovering');
    }
  });

  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverables)) {
      cursor.classList.remove('hovering');
    }
  });

  document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
  document.addEventListener('mouseup',   () => cursor.classList.remove('clicking'));
})();

/* ═══════════════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
   ═══════════════════════════════════════════════════════════════ */
(function initScrollProgress() {
  const bar = qs('#scrollProgress');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = Math.min((scrolled / total) * 100, 100) + '%';
  }, { passive: true });
})();

/* ═══════════════════════════════════════════════════════════════
   NAV BEHAVIOR
   ═══════════════════════════════════════════════════════════════ */
(function initNav() {
  const nav  = qs('#nav');
  const ham  = qs('#hamburger');
  const menu = qs('#mobileMenu');

  let lastY = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 60) nav.classList.add('scrolled');
    else        nav.classList.remove('scrolled');
    lastY = y;
  }, { passive: true });

  ham?.addEventListener('click', () => {
    ham.classList.toggle('active');
    menu.classList.toggle('open');
  });

  // Close menu on link click
  qsa('.mobile-menu a').forEach(a => {
    a.addEventListener('click', () => {
      ham.classList.remove('active');
      menu.classList.remove('open');
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   MOUSE GLOW
   ═══════════════════════════════════════════════════════════════ */
(function initMouseGlow() {
  const glow = qs('#mouseGlow');
  const hero = qs('#hero');
  if (!glow || !hero) return;

  let mx = 0, my = 0, glowX = 0, glowY = 0;
  let active = false;

  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
    active = true;
  });

  hero.addEventListener('mouseleave', () => { active = false; glow.style.opacity = '0'; });
  hero.addEventListener('mouseenter', () => { glow.style.opacity = '1'; });

  function animGlow() {
    if (active) {
      glowX += (mx - glowX) * 0.08;
      glowY += (my - glowY) * 0.08;
      glow.style.left = glowX + 'px';
      glow.style.top  = glowY + 'px';
    }
    requestAnimationFrame(animGlow);
  }
  animGlow();
})();

/* ═══════════════════════════════════════════════════════════════
   HERO BILATERAL DOCKS — SUBTLE BALANCED PARALLAX
   ═══════════════════════════════════════════════════════════════ */
(function initFloatCards() {
  const hero  = qs('#hero');
  const leftDock  = qs('.hero-dock--left');
  const rightDock = qs('.hero-dock--right');
  if (!hero || (!leftDock && !rightDock)) return;

  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    const cx = rect.width  / 2;
    const cy = rect.height / 2;
    const dx = (e.clientX - rect.left - cx) * 0.012;
    const dy = (e.clientY - rect.top  - cy) * 0.012;

    if (leftDock)  leftDock.style.transform  = `translateY(calc(-50% + ${dy}px)) translateX(${dx}px)`;
    if (rightDock) rightDock.style.transform = `translateY(calc(-50% + ${dy}px)) translateX(${dx}px)`;
  });

  hero.addEventListener('mouseleave', () => {
    if (leftDock)  leftDock.style.transform  = 'translateY(-50%)';
    if (rightDock) rightDock.style.transform = 'translateY(-50%)';
  });
})();

/* ═══════════════════════════════════════════════════════════════
   HERO ANIMATIONS (called after preloader)
   ═══════════════════════════════════════════════════════════════ */
function initHeroAnimations() {
  // Badge
  const badge = qs('#heroBadge');
  if (badge) setTimeout(() => badge.classList.add('visible'), 100);

  // Symmetrical dock cards
  qsa('.hero-dock-card').forEach((c, i) => {
    setTimeout(() => c.classList.add('visible'), 350 + i * 100);
  });

  // Words stagger
  const words = qsa('.hero-word');
  words.forEach((w, i) => {
    setTimeout(() => w.classList.add('visible'), 300 + i * 120);
  });

  // Services + CTA + scroll
  const services = qs('#heroServices');
  const cta = qs('#heroCta');
  const scroll = qs('.hero-scroll');

  if (services) setTimeout(() => services.classList.add('visible'), 900);
  if (cta)      setTimeout(() => cta.classList.add('visible'),      1050);
  if (scroll)   setTimeout(() => scroll.classList.add('visible'),   1300);

  // Start observe
  initObservers();
}

/* ═══════════════════════════════════════════════════════════════
   INTERSECTION OBSERVER — REVEAL ON SCROLL
   ═══════════════════════════════════════════════════════════════ */
function initObservers() {
  // General text reveals
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  qsa('.reveal-text').forEach(el => revealObs.observe(el));

  // Staggered cards (services)
  const cardObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const idx = parseInt(e.target.dataset.idx) || 0;
        setTimeout(() => {
          e.target.classList.add('visible');
        }, idx * 80);
        cardObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  qsa('.svc-card').forEach(el => cardObs.observe(el));

  // Work items
  const workObs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 100);
        workObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  qsa('.work-item').forEach(el => workObs.observe(el));

  // Testimonials
  const testiObs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 120);
        testiObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  qsa('.testi-card').forEach(el => testiObs.observe(el));

  // Skills
  const skillObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        animateSkillRing(e.target);
        skillObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  qsa('.skill-item').forEach((el, i) => {
    el.style.transitionDelay = (i * 80) + 'ms';
    skillObs.observe(el);
  });

  // Process steps
  const processObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const step = parseInt(e.target.dataset.step) || 1;
        setTimeout(() => e.target.classList.add('visible'), (step - 1) * 120);
        processObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  qsa('.process-step').forEach(el => processObs.observe(el));

  // About stats counter
  const statsObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounters();
        statsObs.disconnect();
      }
    });
  }, { threshold: 0.5 });

  const statsEl = qs('.about-stats');
  if (statsEl) statsObs.observe(statsEl);
}

/* ═══════════════════════════════════════════════════════════════
   SKILL RING ANIMATION
   ═══════════════════════════════════════════════════════════════ */
function animateSkillRing(el) {
  const pct    = parseInt(el.dataset.pct) || 80;
  const circle = el.querySelector('.skill-fill');
  if (!circle) return;

  const r          = 32;
  const circumf    = 2 * Math.PI * r;
  const dashValue  = (pct / 100) * circumf;

  setTimeout(() => {
    circle.style.strokeDasharray = `${dashValue} ${circumf}`;
  }, 200);
}

/* ═══════════════════════════════════════════════════════════════
   COUNTER ANIMATION
   ═══════════════════════════════════════════════════════════════ */
function animateCounters() {
  qsa('.astat').forEach(el => {
    const target   = parseInt(el.dataset.target) || 0;
    const numEl    = el.querySelector('.astat-num');
    if (!numEl) return;

    const dur    = 1800;
    const start  = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / dur, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      numEl.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  });
}

/* ═══════════════════════════════════════════════════════════════
   SERVICE TAG CYCLER
   ═══════════════════════════════════════════════════════════════ */
(function initServiceCycler() {
  const tag  = qs('#cycleTag');
  if (!tag) return;

  const services = [
    'Motion Graphics',
    'Video Editing',
    'Brand Identity',
    'UI/UX Design',
    'Social Media',
  ];
  let idx = 0;

  setInterval(() => {
    tag.style.opacity = '0';
    tag.style.transform = 'translateY(-8px)';
    setTimeout(() => {
      idx = (idx + 1) % services.length;
      tag.textContent = services[idx];
      tag.style.opacity = '1';
      tag.style.transform = 'translateY(0)';
    }, 300);
  }, 2500);

  tag.style.transition = 'opacity 0.3s, transform 0.3s';
})();

/* ═══════════════════════════════════════════════════════════════
   WORK FILTER — SEMANTIC SEGMENTED DOCK & ACCESSIBILITY
   ═══════════════════════════════════════════════════════════════ */
(function initWorkFilter() {
  const btns  = qsa('.wf-btn');
  const items = qsa('.work-item');

  function activateTab(btn) {
    if (!btn) return;
    btns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
      b.setAttribute('tabindex', '-1');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    btn.setAttribute('tabindex', '0');
    btn.focus();

    const filter = btn.dataset.filter;

    items.forEach(item => {
      const cat = item.dataset.cat || 'all';
      if (filter === 'all' || cat === filter) {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.96)';
        setTimeout(() => {
          item.style.display = '';
          requestAnimationFrame(() => {
            item.style.transition = 'opacity 0.4s var(--ease-smooth), transform 0.4s var(--ease-smooth)';
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          });
        }, 80);
      } else {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.96)';
        setTimeout(() => { item.style.display = 'none'; }, 350);
      }
    });
  }

  btns.forEach((btn, index) => {
    btn.addEventListener('click', () => activateTab(btn));

    // Keyboard navigation (ArrowLeft / ArrowRight / Home / End)
    btn.addEventListener('keydown', e => {
      let targetIndex = null;
      if (e.key === 'ArrowRight') {
        targetIndex = (index + 1) % btns.length;
      } else if (e.key === 'ArrowLeft') {
        targetIndex = (index - 1 + btns.length) % btns.length;
      } else if (e.key === 'Home') {
        targetIndex = 0;
      } else if (e.key === 'End') {
        targetIndex = btns.length - 1;
      }

      if (targetIndex !== null) {
        e.preventDefault();
        activateTab(btns[targetIndex]);
      }
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   CONTACT FORM & BACKEND LEADS ENGINE
   ═══════════════════════════════════════════════════════════════ */
(function initContactForm() {
  const form      = qs('#contactForm');
  const statusBox = qs('#formStatus');
  const btn       = qs('#submitBtn');

  if (!form) return;

  // Clear error on input
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => {
      field.closest('.form-field')?.classList.remove('field-error');
      if (statusBox) statusBox.style.display = 'none';
    });
    field.addEventListener('change', () => {
      field.closest('.form-field')?.classList.remove('field-error');
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const nameField     = form.querySelector('#fname');
    const contactField  = form.querySelector('#fcontact');
    const emailField    = form.querySelector('#femail');
    const serviceField  = form.querySelector('#fservice');
    const budgetField   = form.querySelector('#fbudget');
    const timelineField = form.querySelector('#ftimeline');
    const msgField      = form.querySelector('#fmsg');

    const name     = nameField ? nameField.value.trim() : '';
    const contact  = contactField ? contactField.value.trim() : '';
    const email    = emailField ? emailField.value.trim() : '';
    const service  = serviceField ? serviceField.value.trim() : '';
    const budget   = budgetField ? budgetField.value.trim() : '';
    const timeline = timelineField ? timelineField.value.trim() : '';
    const message  = msgField ? msgField.value.trim() : '';

    let hasError = false;

    // Validation
    if (!name) {
      nameField.closest('.form-field')?.classList.add('field-error');
      hasError = true;
    }
    if (!contact) {
      contactField.closest('.form-field')?.classList.add('field-error');
      hasError = true;
    }
    if (!email) {
      emailField.closest('.form-field')?.classList.add('field-error');
      hasError = true;
    }
    if (!service) {
      serviceField.closest('.form-field')?.classList.add('field-error');
      hasError = true;
    }
    if (!message) {
      msgField.closest('.form-field')?.classList.add('field-error');
      hasError = true;
    }

    if (hasError) {
      if (statusBox) {
        statusBox.className = 'form-status error';
        statusBox.innerHTML = '⚠️ Please fill out all required fields (Name, Contact, Email, Service, and Project Brief).';
        statusBox.style.display = 'block';
      }
      return;
    }

    const payload = {
      name,
      contact,
      email,
      service,
      budget: budget || 'Flexible',
      timeline: timeline || 'Flexible',
      message
    };

    // UI Loading state
    btn.style.opacity = '0.7';
    btn.style.pointerEvents = 'none';
    const originalBtnText = btn.querySelector('.submit-text').textContent;
    btn.querySelector('.submit-text').textContent = 'Transmitting brief...';

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        form.reset();
        btn.style.opacity = '1';
        btn.style.pointerEvents = '';
        btn.querySelector('.submit-text').textContent = originalBtnText;

        const cleanPhone = contact.replace(/[^0-9]/g, '');
        const studioWaUrl = `https://wa.me/919999999999?text=${encodeURIComponent(
          `Hi Creatophoria Studio! I just submitted an inquiry for ${service}. My name is ${name}.`
        )}`;

        if (statusBox) {
          statusBox.className = 'form-status success';
          statusBox.innerHTML = `
            <strong>✦ Project Brief Transmitted Successfully!</strong>
            Thank you, ${name}. Your project details for <em>${service}</em> have been logged in our system. Our creative director will connect with you via ${contact} or email within 24 hours.
            <br/>
            <a href="${studioWaUrl}" target="_blank" class="form-status-wa-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.78 14.07c-.24.68-1.4 1.34-1.94 1.42-.49.07-1.12.1-3.26-.79-2.73-1.14-4.5-3.89-4.63-4.07-.14-.19-1.1-1.46-1.1-2.78s.69-1.97.94-2.24c.24-.26.54-.33.72-.33.18 0 .36 0 .52.01.17.01.4.06.6.55.22.53.75 1.83.82 1.96.07.14.12.3.02.49-.09.2-.14.32-.29.49-.14.17-.3.38-.43.51-.14.14-.29.3-.13.57.17.28.74 1.22 1.58 1.97 1.09.97 2 .1.27 2.29.28.29.07.46-.04.63-.16.17-.18.73-.85.93-1.14.2-.29.4-.24.67-.14.28.1 1.76.83 2.06.98.3.15.5.22.58.34.07.13.07.75-.17 1.43z"/></svg>
              Fast-Track via WhatsApp
            </a>
          `;
          statusBox.style.display = 'block';
        }
      } else {
        throw new Error(result.error || 'Server rejected submission');
      }
    } catch (err) {
      console.warn('Backend server unreachable, saving locally:', err);
      // Fallback: save to localStorage buffer
      try {
        const offlineLeads = JSON.parse(localStorage.getItem('creatophoria_offline_leads') || '[]');
        payload.id = 'offline_' + Date.now();
        payload.createdAt = new Date().toISOString();
        offlineLeads.push(payload);
        localStorage.setItem('creatophoria_offline_leads', JSON.stringify(offlineLeads));
      } catch (e) {}

      form.reset();
      btn.style.opacity = '1';
      btn.style.pointerEvents = '';
      btn.querySelector('.submit-text').textContent = originalBtnText;

      if (statusBox) {
        statusBox.className = 'form-status success';
        statusBox.innerHTML = `
          <strong>✦ Inquiry Received!</strong>
          Thank you, ${name}. We have captured your request for <em>${service}</em>. We will reach out to you directly at ${contact}.
        `;
        statusBox.style.display = 'block';
      }
    }
  });
})();

/* ═══════════════════════════════════════════════════════════════
   BACK TO TOP
   ═══════════════════════════════════════════════════════════════ */
(function initBackToTop() {
  const btn = qs('#backToTop');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   BUTTON HOVER EFFECTS — STABLE, TACTILE & SYMMETRICAL
   ═══════════════════════════════════════════════════════════════ */
(function initButtonHoverEffects() {
  const buttons = qsa('.btn-primary, .btn-submit, .btn-nav, .btn-ghost, .wf-btn');

  buttons.forEach(btn => {
    // Keep buttons stable in place; do not translate position on hover
    btn.addEventListener('mouseenter', () => {
      btn.style.willChange = 'transform, box-shadow';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.willChange = 'auto';
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   TILT EFFECT ON SERVICE CARDS
   ═══════════════════════════════════════════════════════════════ */
(function initTilt() {
  const cards = qsa('.svc-card, .testi-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / (rect.width  / 2);
      const dy   = (e.clientY - cy) / (rect.height / 2);

      const rotX = -dy * 6;
      const rotY =  dx * 6;

      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   SMOOTH ANCHOR SCROLLING
   ═══════════════════════════════════════════════════════════════ */
(function initSmoothScroll() {
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = qs(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   TEXT SCRAMBLE ON HOVER (hero title)
   ═══════════════════════════════════════════════════════════════ */
class TextScramble {
  constructor(el) {
    this.el   = el;
    this.orig = el.textContent;
    this.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    this.frame = 0;
    this.frameReq = null;
    this.el.addEventListener('mouseenter', () => this.scramble());
  }

  scramble() {
    let iteration = 0;
    const orig = this.orig;

    clearInterval(this.frameReq);
    this.frameReq = setInterval(() => {
      this.el.textContent = orig
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i < iteration) return orig[i];
          return this.chars[Math.floor(Math.random() * this.chars.length)];
        })
        .join('');

      if (iteration >= orig.length) {
        clearInterval(this.frameReq);
      }
      iteration += 0.6;
    }, 30);
  }
}

// Apply scramble to nav logo text
(function() {
  const el = qs('.logo-text');
  if (el) new TextScramble(el);
})();

/* ═══════════════════════════════════════════════════════════════
   FOOTER PARALLAX
   ═══════════════════════════════════════════════════════════════ */
(function initFooterParallax() {
  const bgText = qs('.footer-bg-text');
  if (!bgText) return;

  window.addEventListener('scroll', () => {
    const footer = qs('#footer');
    if (!footer) return;
    const rect   = footer.getBoundingClientRect();
    const ratio  = 1 - rect.top / window.innerHeight;
    if (ratio > 0 && ratio < 1.5) {
      bgText.style.transform = `translateX(-50%) translateY(${ratio * 30}px)`;
    }
  }, { passive: true });
})();

/* ═══════════════════════════════════════════════════════════════
   SECTION GLOW ON HOVER
   ═══════════════════════════════════════════════════════════════ */
(function initSectionGlow() {
  qsa('.svc-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = '0 0 60px rgba(0,229,168,0.08), 0 20px 60px rgba(0,0,0,0.4)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = '';
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   SECRET FOUNDER PORTAL SHORTCUT (Ctrl + Shift + A or Logo Triple-Click)
   ═══════════════════════════════════════════════════════════════ */
(function initSecretAdminShortcut() {
  // 1. Keyboard shortcut: Ctrl + Shift + A (or Cmd + Shift + A)
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      window.location.href = '/admin.html';
    }
  });

  // 2. Secret triple-click on footer logo
  const footerLogo = qs('.footer-logo');
  if (footerLogo) {
    let clickCount = 0;
    let clickTimer = null;
    footerLogo.addEventListener('click', () => {
      clickCount++;
      clearTimeout(clickTimer);
      if (clickCount >= 3) {
        clickCount = 0;
        window.location.href = '/admin.html';
      } else {
        clickTimer = setTimeout(() => { clickCount = 0; }, 600);
      }
    });
  }
})();

console.log('%cCreatophoria Studio', 'color: #00E5A8; font-size: 20px; font-weight: bold; font-family: serif;');
console.log('%cWe don\'t just design. We create experiences.', 'color: #AEB4C2; font-size: 12px;');

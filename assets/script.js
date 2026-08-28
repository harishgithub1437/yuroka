// Yuroka — shared interactions

document.addEventListener('DOMContentLoaded', () => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // cursor glow
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    let raf = null;
    window.addEventListener('pointermove', (e) => {
      glow.classList.add('active');
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      });
    });
    document.addEventListener('mouseleave', () => glow.classList.remove('active'));
  }

  // split-text hero reveal
  document.querySelectorAll('.split-reveal').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w, i) =>
      `<span class="split-word"><span style="transition-delay:${i * 55}ms">${w}</span></span>`
    ).join(' ');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('split-ready')));
  });

  // 3D tilt on interactive cards
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.tilt').forEach(card => {
      const shine = document.createElement('div');
      shine.className = 'tilt-shine';
      card.appendChild(shine);
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(700px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  const header = document.querySelector('.site-header');

  const setHeaderHeightVar = () => {
    if (header) document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  };
  setHeaderHeightVar();
  window.addEventListener('resize', setHeaderHeightVar);

  const closeMenu = () => {
    links.classList.remove('open');
    toggle.classList.remove('active');
    document.body.classList.remove('nav-open');
  };

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      setHeaderHeightVar();
      const willOpen = !links.classList.contains('open');
      links.classList.toggle('open', willOpen);
      toggle.classList.toggle('active', willOpen);
      document.body.classList.toggle('nav-open', willOpen);
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }

  // scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // stagger index for children inside .reveal-stagger
  document.querySelectorAll('.reveal-stagger').forEach(group => {
    Array.from(group.children).forEach((child, i) => {
      child.style.setProperty('--i', i);
    });
  });

  // FAQ accordion
  document.querySelectorAll('.accordion-item').forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');
    if (!trigger || !panel) return;
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.closest('.accordion').querySelectorAll('.accordion-item.open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.accordion-panel').style.maxHeight = null;
        }
      });
      if (isOpen) {
        item.classList.remove('open');
        panel.style.maxHeight = null;
      } else {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  // header shadow on scroll
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.style.boxShadow = window.scrollY > 8 ? '0 8px 24px -18px rgba(90,30,63,0.35)' : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // contact form — sends via /api/send-email (Resend, server-side)
  const form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = form.querySelector('.form-status');
      const submitBtn = form.querySelector('button[type="submit"]');
      const data = Object.fromEntries(new FormData(form).entries());

      const showStatus = (text, isError) => {
        if (!status) return;
        status.textContent = text;
        status.style.color = isError ? '#C2266E' : '#3E8B5C';
        status.style.display = 'block';
      };

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      try {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json().catch(() => ({}));

        if (res.ok) {
          showStatus('Thank you — your message has been sent. We will get back to you soon.', false);
          form.reset();
        } else {
          showStatus(result.error || 'Something went wrong. Please email us directly at yurokacare@gmail.com.', true);
        }
      } catch (err) {
        showStatus('Could not reach the server. Please email us directly at yurokacare@gmail.com.', true);
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send Message'; }
      }
    });
  }
});

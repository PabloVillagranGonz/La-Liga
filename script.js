// Script para La_Liga — con EmailJS integrado y mejoras de accesibilidad
document.addEventListener('DOMContentLoaded', function () {

  /* ----------------------------------------------------------
      Helpers
  ----------------------------------------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ----------------------------------------------------------
      1) Smooth scroll para anchors
  ----------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // move focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.removeAttribute('tabindex');
      }
    });
  });

  /* ----------------------------------------------------------
      2) Animaciones on-scroll con IntersectionObserver
  ----------------------------------------------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.fade-up').forEach(el => io.observe(el));

  /* ----------------------------------------------------------
      3) Back to top button
  ----------------------------------------------------------- */
  const btt = $('.back-to-top');
  if (btt) {
    const onScroll = () => {
      if (window.scrollY > 400) btt.classList.add('show');
      else btt.classList.remove('show');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    onScroll();
  }

  /* ----------------------------------------------------------
      4) Menu toggle mobile (con focus-trap simple)
  ----------------------------------------------------------- */
  const menuBtn = $('.menu-toggle');
  const nav = $('nav'); // note: this selects the first nav (desktop). mobile panel is .mobile-panel inside
  const mobilePanel = $('.mobile-panel');
  const panelCloseBtn = $('.close-btn');
  const mainContent = $('#main');

  function trapFocus(container) {
    const focusable = $$(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])',
      container
    ).filter(el => el.offsetParent !== null);
    if (focusable.length === 0) return () => {};
    let i = 0;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handle(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }

  let releaseTrap = null;

  function openMobilePanel() {
    if (!mobilePanel) return;
    mobilePanel.setAttribute('aria-hidden', 'false');
    mobilePanel.classList.add('open');
    document.body.classList.add('nav-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    if (mainContent) mainContent.setAttribute('aria-hidden', 'true');
    // focus first link
    const firstLink = mobilePanel.querySelector('a, button');
    if (firstLink) firstLink.focus();
    releaseTrap = trapFocus(mobilePanel);
  }

  function closeMobilePanel() {
    if (!mobilePanel) return;
    mobilePanel.setAttribute('aria-hidden', 'true');
    mobilePanel.classList.remove('open');
    document.body.classList.remove('nav-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    if (mainContent) mainContent.removeAttribute('aria-hidden');
    menuBtn.focus();
    if (typeof releaseTrap === 'function') releaseTrap();
    releaseTrap = null;
  }

  if (menuBtn && mobilePanel) {
    menuBtn.addEventListener('click', () => {
      if (mobilePanel.classList.contains('open')) closeMobilePanel();
      else openMobilePanel();
    });
    if (panelCloseBtn) panelCloseBtn.addEventListener('click', closeMobilePanel);

    // close when clicking a link inside the panel
    mobilePanel.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', closeMobilePanel));

    // close on Escape
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMobilePanel(); });

    // click outside panel to close
    document.addEventListener('click', e => {
      if (!mobilePanel.classList.contains('open')) return;
      if (!mobilePanel.contains(e.target) && !menuBtn.contains(e.target)) closeMobilePanel();
    });
  }

  /* ----------------------------------------------------------
      5) CTA pulse
  ----------------------------------------------------------- */
  const cta = $('.btn');
  if (cta && 'animate' in cta) {
    cta.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }],
      { duration: 1200, iterations: 1, easing: 'ease-out' }
    );
  }

  /* ----------------------------------------------------------
      6) EMAILJS + Formulario de contacto (mejorado)
  ----------------------------------------------------------- */

  // Reveal email in DOM (deobfuscate)
  (function showEmail() {
    const span = document.getElementById('contact-email');
    if (!span) return;
    const user = span.getAttribute('data-user') || '';
    const domain = span.getAttribute('data-domain') || '';
    const email = `${user}@${domain}`;
    const a = document.createElement('a');
    a.href = `mailto:${email}`;
    a.textContent = email;
    a.rel = 'nofollow noopener';
    span.appendChild(a);
  })();

  // Load EmailJS SDK if needed
  function loadEmailJS(callback) {
    if (window.emailjs) {
      try { if (typeof callback === 'function') callback(); } catch (e) {}
      return;
    }
    const sdk = document.createElement('script');
    sdk.src = 'https://cdn.emailjs.com/dist/email.min.js';
    sdk.defer = true;
    sdk.onload = callback;
    sdk.onerror = () => console.warn('No se pudo cargar EmailJS SDK');
    document.head.appendChild(sdk);
  }

  // SEND FORM
  loadEmailJS(() => {
    if (!window.emailjs) {
      console.warn('EmailJS SDK no disponible.');
      return;
    }

    // CONFIG - reemplaza si cambias credenciales
    const SERVICE_ID = 'service_j30lsnr';
    const TEMPLATE_ID = 'template_h0i4mwv';
    const USER_ID = 'zFMrbrrk_SkLb_JR3'; // public key (ok en cliente)

    try { emailjs.init(USER_ID); } catch (e) { console.warn('emailjs.init error', e); }

    const form = document.getElementById('contact-form');
    const messages = document.getElementById('contact-messages');

    if (!form) return;

    function showMsg(text, type = 'info') {
      if (!messages) return;
      messages.innerHTML = '';
      const div = document.createElement('div');
      div.textContent = text;
      div.className = `contact-msg ${type}`;
      messages.appendChild(div);
      // focus on messages for screen-readers
      div.setAttribute('tabindex', '-1');
      div.focus();
    }

    let sending = false;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (sending) return;
      const nombre = (form.nombre && form.nombre.value || '').trim();
      const email = (form.email && form.email.value || '').trim();
      const mensaje = (form.mensaje && form.mensaje.value || '').trim();

      if (!nombre || !email || !mensaje) {
        showMsg('Por favor, completa todos los campos.', 'error');
        return;
      }

      // fill hidden fields
      const fechaField = $('#fecha', form);
      if (fechaField) fechaField.value = new Date().toISOString();
      const sitioField = $('#sitio', form);
      if (sitioField && !sitioField.value) sitioField.value = location.href;

      showMsg('Enviando...', 'info');
      sending = true;

      emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form)
        .then(() => {
          showMsg('Mensaje enviado correctamente. ¡Gracias!', 'success');
          form.reset();
          sending = false;
        })
        .catch(err => {
          console.error('EmailJS error:', err);
          showMsg('Error al enviar. Intenta de nuevo más tarde.', 'error');
          sending = false;
        });
    });
  });

  /* ----------------------------------------------------------
      7) Accessibility: respect prefers-reduced-motion
  ----------------------------------------------------------- */
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // disable animations if user prefers reduced motion
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('is-visible'));
  }

});
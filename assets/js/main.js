/* Gindi Innovations — homepage behaviour.
 * Content comes from assets/js/config.js; this file should rarely need editing. */
(function () {
  'use strict';

  var cfg = window.GINDI_CONFIG || {};
  var contact = cfg.contact || {};
  var services = cfg.services || [];
  var projects = cfg.projects || [];
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  // A value counts as configured unless it is empty or still a [PLACEHOLDER].
  function isSet(value) {
    if (typeof value !== 'string') return false;
    var v = value.trim();
    return v !== '' && !/^\[.*\]$/.test(v);
  }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function scrollBehavior() { return reduceMotion.matches ? 'auto' : 'smooth'; }

  /* ---------- Icons ---------- */
  function svg(paths, size) {
    size = size || 24;
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" ' +
      'stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + paths + '</svg>';
  }

  var ICONS = {
    design: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 11h7v10M10 3v4.5M14 11h7M14 11v4"/>',
    fitout: '<rect x="3" y="3.5" width="14" height="6" rx="1"/><path d="M17 6.5h3.5v5.5H12v2.5"/><rect x="10.5" y="14.5" width="3" height="6.5" rx=".6"/>',
    visualization: '<path d="M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4Z"/><path d="m4 7.4 8 4.6 8-4.6M12 12v9.2"/>',
    lighting: '<path d="M12 2.5v4.5"/><path d="M4.5 15a7.5 7.5 0 0 1 15 0Z"/><path d="M10 18a2 2 0 0 0 4 0"/><path d="M12 21.5v0"/>',
    furniture: '<path d="M5.5 11V7.5a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3V11"/><path d="M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M6 18v2M18 18v2"/>',
    consultation: '<path d="M3.5 4.5h11v8H8l-4.5 3.5Z"/><path d="M17.5 8.5h3v8.5L17 14.5h-6.5v-2"/>',
    wire: '<path d="M9 3v4M15 3v4"/><path d="M6 7h12v3a6 6 0 0 1-12 0Z"/><path d="M12 16v2a3 3 0 0 0 3 3h3"/>',
    brick: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
    phone: '<path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m3.5 6 8.5 7 8.5-7"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>',
    location: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'
  };

  function icon(name, size) { return svg(ICONS[name] || ICONS.design, size); }

  /* ---------- Brand ---------- */
  document.documentElement.classList.add('js');

  if (cfg.brand && isSet(cfg.brand.logo)) {
    $$('[data-brand]').forEach(function (link) {
      link.innerHTML = '<img src="' + esc(cfg.brand.logo) + '" alt="' + esc(cfg.brand.name || 'Gindi Innovations') + '">';
      link.removeAttribute('aria-label');
    });
  }

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header ---------- */
  var header = $('#site-header');
  var menuToggle = $('.menu-toggle');
  var mobileMenu = $('#mobile-menu');

  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileMenu.hidden = !open;
    header.classList.toggle('menu-open', open);
  }

  menuToggle.addEventListener('click', function () {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  mobileMenu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuToggle.focus();
    }
  });

  window.matchMedia('(min-width: 961px)').addEventListener('change', function (mq) {
    if (mq.matches) setMenu(false);
  });

  // Highlight the nav link for the section in view.
  var navLinks = $$('.nav-list a, .mobile-nav-list a');
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (a) {
          if (a.getAttribute('href') === id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['home', 'services', 'projects', 'contact'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  /* ---------- Shared dialog helpers ---------- */
  function openDialog(dialog) {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    document.body.classList.add('is-locked');
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === 'function') dialog.close();
    else { dialog.removeAttribute('open'); dialog.dispatchEvent(new Event('close')); }
  }

  /* ---------- Services ---------- */
  var grid = $('#service-grid');
  var serviceSelect = $('#f-service');

  grid.innerHTML = services.map(function (s, i) {
    var n = pad(i + 1);
    return '<li class="reveal">' +
      '<button class="service-tile" type="button" aria-haspopup="dialog" data-index="' + i + '" ' +
        'aria-labelledby="svc-name-' + i + '" aria-describedby="svc-sum-' + i + '">' +
        '<span class="service-top">' +
          '<span class="service-icon">' + icon(s.icon, 30) + '</span>' +
          '<span class="service-index" aria-hidden="true">' + n + '</span>' +
        '</span>' +
        '<span class="service-name" id="svc-name-' + i + '">' + esc(s.name) + '</span>' +
        '<span class="service-summary" id="svc-sum-' + i + '">' + esc(s.summary) + '</span>' +
        '<span class="service-more" aria-hidden="true">View details <span class="service-arrow">' + icon('arrow', 16) + '</span></span>' +
      '</button>' +
    '</li>';
  }).join('') + (cfg.tools || []).map(function (t, i) {
    return '<li class="reveal service-tool">' +
      '<a class="service-tile service-tile-tool" href="' + esc(t.url) + '"' + (t.lang ? ' hreflang="' + esc(t.lang) + '"' : '') +
        ' aria-labelledby="tool-name-' + i + '" aria-describedby="tool-label-' + i + ' tool-sum-' + i + '">' +
        '<span class="service-icon">' + icon(t.icon, 30) + '</span>' +
        '<span class="tool-body">' +
          (t.label ? '<span class="tool-label" id="tool-label-' + i + '">' + esc(t.label) + '</span>' : '') +
          '<span class="service-name" id="tool-name-' + i + '">' + esc(t.name) + '</span>' +
          '<span class="service-summary" id="tool-sum-' + i + '">' + esc(t.summary) + '</span>' +
        '</span>' +
        '<span class="service-more" aria-hidden="true">' + esc(t.linkText || 'Open') + ' <span class="service-arrow">' + icon('arrow', 16) + '</span></span>' +
      '</a>' +
    '</li>';
  }).join('');

  services.forEach(function (s) {
    var opt = document.createElement('option');
    opt.value = s.name;
    opt.textContent = s.name;
    serviceSelect.appendChild(opt);
  });
  var otherOpt = document.createElement('option');
  otherOpt.value = 'Not sure yet';
  otherOpt.textContent = 'Not sure yet / something else';
  serviceSelect.appendChild(otherOpt);

  var panel = $('#service-panel');
  var panelTrigger = null;
  var activeService = null;
  var restoreFocus = true;

  function openService(index, trigger) {
    var s = services[index];
    if (!s) return;
    activeService = s;
    panelTrigger = trigger;
    $('#panel-icon').innerHTML = icon(s.icon, 30);
    $('#panel-eyebrow').textContent = 'Service ' + pad(index + 1);
    $('#panel-title').textContent = s.name;
    $('#panel-text').textContent = s.details || s.summary;
    $('#panel-deliverables').innerHTML = (s.deliverables || []).slice(0, 3).map(function (d, i) {
      return '<li><span class="deliverable-num" aria-hidden="true">' + pad(i + 1) + '</span><span>' + esc(d) + '</span></li>';
    }).join('');
    restoreFocus = true;
    openDialog(panel);
    // Start on the close button so keyboard users can dismiss immediately.
    $('.panel-close', panel).focus();
    $('.panel-inner', panel).scrollTop = 0;
  }

  grid.addEventListener('click', function (e) {
    var tile = e.target.closest('button.service-tile');
    if (tile) openService(Number(tile.dataset.index), tile);
  });

  panel.addEventListener('click', function (e) {
    if (e.target === panel || e.target.closest('[data-close]')) closeDialog(panel);
  });

  panel.addEventListener('close', function () {
    document.body.classList.remove('is-locked');
    if (restoreFocus && panelTrigger) panelTrigger.focus();
  });

  var announcer = document.createElement('div');
  announcer.className = 'sr-only';
  announcer.setAttribute('aria-live', 'polite');
  document.body.appendChild(announcer);

  function announce(msg) {
    announcer.textContent = '';
    window.setTimeout(function () { announcer.textContent = msg; }, 50);
  }

  $('#panel-discuss').addEventListener('click', function () {
    if (!activeService) return;
    restoreFocus = false;
    closeDialog(panel);
    selectService(activeService.name);
    $('#contact').scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    $('#f-name').focus({ preventScroll: true });
    announce(activeService.name + ' selected. Fill in the enquiry form to get in touch.');
  });

  function selectService(name) {
    serviceSelect.value = name;
    clearError(serviceSelect);
    updateWhatsApp();
    serviceSelect.classList.remove('is-highlighted');
    void serviceSelect.offsetWidth;
    serviceSelect.classList.add('is-highlighted');
    window.setTimeout(function () { serviceSelect.classList.remove('is-highlighted'); }, 2200);
  }

  /* ---------- Projects ---------- */
  var projectGrid = $('#project-grid');
  var anyPlaceholder = projects.some(function (p) { return p.placeholder; });
  $('#projects-note').hidden = !anyPlaceholder;

  projectGrid.innerHTML = projects.map(function (p, i) {
    var label = 'Enlarge image: ' + p.title + (p.placeholder ? ' (inspiration image)' : '');
    return '<li class="reveal">' +
      '<button class="project-card" type="button" aria-haspopup="dialog" data-index="' + i + '" aria-label="' + esc(label) + '">' +
        '<span class="project-frame">' +
          '<img src="' + esc(p.image) + '-1000.webp" ' +
            'srcset="' + esc(p.image) + '-600.webp 600w, ' + esc(p.image) + '-1000.webp 1000w" ' +
            'sizes="(max-width: 760px) 78vw, 33vw" alt="' + esc(p.alt || p.title) + '" loading="lazy" decoding="async">' +
          (p.placeholder ? '<span class="project-tag">Inspiration image</span>' : '') +
          '<span class="project-zoom">' + icon('expand', 18) + '</span>' +
        '</span>' +
        '<span class="project-caption">' +
          '<span class="project-title">' + esc(p.title) + '</span>' +
          (p.meta ? '<span class="project-meta">' + esc(p.meta) + '</span>' : '') +
        '</span>' +
      '</button>' +
    '</li>';
  }).join('');

  var lightbox = $('#lightbox');
  var lbImg = $('#lightbox-img');
  var lbCaption = $('#lightbox-caption');
  var lbIndex = 0;
  var lbTrigger = null;

  $('#lightbox-prev').hidden = projects.length < 2;
  $('#lightbox-next').hidden = projects.length < 2;

  function showProject(i) {
    lbIndex = (i + projects.length) % projects.length;
    var p = projects[lbIndex];
    lbImg.sizes = '100vw';
    lbImg.srcset = p.image + '-1000.webp 1000w, ' + p.image + '-1800.webp 1800w';
    lbImg.src = p.image + '-1800.webp';
    lbImg.alt = p.alt || p.title;
    lbCaption.innerHTML = '<strong>' + esc(p.title) + '</strong>' +
      (p.placeholder ? 'Inspiration image, not a Gindi Innovations project' : esc(p.meta || '')) +
      (projects.length > 1 ? ' · ' + (lbIndex + 1) + ' of ' + projects.length : '');
  }

  projectGrid.addEventListener('click', function (e) {
    var card = e.target.closest('.project-card');
    if (!card) return;
    lbTrigger = card;
    showProject(Number(card.dataset.index));
    openDialog(lightbox);
    $('.lightbox-close', lightbox).focus();
  });

  $('#lightbox-prev').addEventListener('click', function () { showProject(lbIndex - 1); });
  $('#lightbox-next').addEventListener('click', function () { showProject(lbIndex + 1); });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target.classList.contains('lightbox-inner') || e.target.closest('[data-close]')) {
      closeDialog(lightbox);
    }
  });

  lightbox.addEventListener('keydown', function (e) {
    if (projects.length < 2) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); showProject(lbIndex - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); showProject(lbIndex + 1); }
  });

  lightbox.addEventListener('close', function () {
    document.body.classList.remove('is-locked');
    if (lbTrigger) lbTrigger.focus();
  });

  /* ---------- Contact details ---------- */
  var phoneHref = isSet(contact.phone) ? 'tel:' + contact.phone.replace(/[^\d+]/g, '') : '';
  var waNumber = isSet(contact.whatsapp) ? contact.whatsapp.replace(/\D/g, '') : '';

  var contactItems = [];
  if (isSet(contact.phone)) {
    contactItems.push({ icon: 'phone', label: 'Phone', value: contact.phone, href: phoneHref });
  }
  if (isSet(contact.email)) {
    contactItems.push({ icon: 'email', label: 'Email', value: contact.email, href: 'mailto:' + contact.email.trim() });
  }
  if (isSet(contact.instagram)) {
    contactItems.push({
      icon: 'instagram', label: 'Instagram', external: true, href: contact.instagram.trim(),
      value: '@' + contact.instagram.trim().replace(/\/+$/, '').split('/').pop().replace(/^@/, '')
    });
  }
  if (isSet(contact.location)) {
    contactItems.push({
      icon: 'location', label: 'Location', value: contact.location, external: true,
      href: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(contact.location)
    });
  }

  $('#contact-list').innerHTML = contactItems.map(function (c) {
    var ext = c.external ? ' target="_blank" rel="noopener"' : '';
    return '<li><a class="contact-item" href="' + esc(c.href) + '"' + ext + '>' + icon(c.icon, 22) +
      '<span><span class="contact-label">' + c.label + '</span><span class="contact-value">' + esc(c.value) + '</span></span>' +
      (c.external ? '<span class="sr-only"> (opens in a new tab)</span>' : '') + '</a></li>';
  }).join('');

  if (isSet(contact.instagram)) {
    $('#footer-social').innerHTML = '<li><a href="' + esc(contact.instagram.trim()) + '" target="_blank" rel="noopener">' +
      icon('instagram', 18) + 'Instagram<span class="sr-only"> (opens in a new tab)</span></a></li>';
  }

  /* ---------- WhatsApp ---------- */
  var waLink = $('#whatsapp-link');
  var form = $('#enquiry-form');
  var fields = {
    name: $('#f-name'),
    phone: $('#f-phone'),
    service: serviceSelect,
    message: $('#f-message')
  };

  function whatsappUrl() {
    var name = fields.name.value.trim();
    var service = fields.service.value;
    var details = fields.message.value.trim();
    var lines = ['Hello Gindi Innovations,'];
    if (name) lines.push('My name is ' + name + '.');
    lines.push(service && service !== 'Not sure yet'
      ? 'I’m interested in your ' + service + ' service.'
      : 'I’d like to talk about a project.');
    if (details) lines.push('', details);
    return 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function updateWhatsApp() {
    if (waNumber) waLink.href = whatsappUrl();
  }

  if (waNumber) {
    waLink.hidden = false;
    updateWhatsApp();
    form.addEventListener('input', updateWhatsApp);
    form.addEventListener('change', updateWhatsApp);
  }

  /* ---------- Enquiry form ---------- */
  var statusEl = $('#form-status');
  var submitBtn = $('#submit-btn');
  var triedSubmit = false;

  var validators = {
    name: function (v) {
      if (!v) return 'Please enter your name.';
      if (v.length < 2) return 'Please enter your full name.';
      return '';
    },
    phone: function (v) {
      if (!v) return 'Please enter your phone number.';
      var digits = v.replace(/\D/g, '').length;
      if (!/^\+?[\d\s().-]+$/.test(v) || digits < 7 || digits > 15) {
        return 'Please enter a valid phone number, using digits only.';
      }
      return '';
    },
    service: function (v) {
      return v ? '' : 'Please choose the service you need.';
    },
    message: function (v) {
      if (!v) return 'Please tell us a little about your project.';
      if (v.length < 10) return 'Please add a few more words about your project.';
      return '';
    }
  };

  function errorEl(field) { return document.getElementById(field.id + '-error'); }

  function setError(field, msg) {
    field.setAttribute('aria-invalid', 'true');
    errorEl(field).textContent = msg;
  }

  function clearError(field) {
    field.removeAttribute('aria-invalid');
    errorEl(field).textContent = '';
  }

  function validateField(key) {
    var field = fields[key];
    var msg = validators[key](field.value.trim());
    if (msg) setError(field, msg); else clearError(field);
    return !msg;
  }

  Object.keys(fields).forEach(function (key) {
    var field = fields[key];
    field.addEventListener('blur', function () {
      if (triedSubmit || field.value.trim()) validateField(key);
    });
    field.addEventListener(key === 'service' ? 'change' : 'input', function () {
      if (field.getAttribute('aria-invalid') === 'true') validateField(key);
    });
  });

  function showStatus(type, html) {
    statusEl.className = 'form-status is-' + type;
    statusEl.innerHTML = html;
    statusEl.hidden = false;
  }

  function setSending(sending) {
    submitBtn.disabled = sending;
    submitBtn.setAttribute('aria-busy', String(sending));
    submitBtn.innerHTML = sending
      ? '<span class="spinner" aria-hidden="true"></span><span class="btn-label">Sending…</span>'
      : '<span class="btn-label">Send Enquiry</span>';
  }

  function alternativeContact() {
    if (waNumber) {
      return ' You can send the same details to us on <a href="' + esc(whatsappUrl()) + '" target="_blank" rel="noopener">WhatsApp</a> instead.';
    }
    if (phoneHref) return ' Please call us on <a href="' + esc(phoneHref) + '">' + esc(contact.phone) + '</a> instead.';
    if (isSet(contact.email)) {
      return ' Please email us at <a href="mailto:' + esc(contact.email.trim()) + '">' + esc(contact.email) + '</a> instead.';
    }
    return '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    triedSubmit = true;
    statusEl.hidden = true;

    var firstInvalid = null;
    Object.keys(fields).forEach(function (key) {
      if (!validateField(key) && !firstInvalid) firstInvalid = fields[key];
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // Spam trap filled: drop silently without claiming success.
    if ($('#f-company').value) return;

    var endpoint = cfg.enquiryForm && cfg.enquiryForm.endpoint;
    if (!isSet(endpoint)) {
      showStatus('info', 'Online enquiries aren’t connected yet, so your message has not been sent.' +
        (alternativeContact() || ' Please try again later.'));
      return;
    }

    var data = new FormData(form);
    data.append('_subject', 'New enquiry: ' + fields.service.value);

    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = controller ? window.setTimeout(function () { controller.abort(); }, 20000) : null;

    setSending(true);
    fetch(endpoint, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' },
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed with status ' + res.status);
        form.reset();
        triedSubmit = false;
        updateWhatsApp();
        showStatus('success', 'Thank you. Your enquiry has been sent and we’ll be in touch soon.');
      })
      .catch(function () {
        showStatus('error', 'Sorry, we couldn’t send your enquiry. Please check your connection and try again.' +
          alternativeContact().replace(' instead.', ' if the problem continues.'));
      })
      .then(function () {
        if (timer) window.clearTimeout(timer);
        setSending(false);
      });
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $$('.reveal');
  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealEls.forEach(function (el) {
      var siblings = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      if (el.parentElement && el.parentElement.matches('.service-grid, .project-grid')) {
        el.style.transitionDelay = (siblings % 3) * 90 + 'ms';
      }
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }
})();

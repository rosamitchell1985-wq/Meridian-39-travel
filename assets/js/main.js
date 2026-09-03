/* ==========================================================================
   MERIDIAN FIELD GUIDE - shared behaviour
   Vanilla JavaScript, no dependencies, no build step.

   Modules
   01. Boot flags and reduced-motion helper
   02. Mobile navigation
   03. Accordion (FAQ and elsewhere)
   04. Scroll reveal (progressive enhancement only)
   05. Hero parallax
   06. Back to top
   07. Cookie consent (Accept / Reject / Manage)
   08. Form validation with inline errors
   09. Trip planner engine
   10. Packing checklist tool
   11. Trip budget estimator
   12. Footer year and dateline
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 01. Boot ---------- */
  document.documentElement.classList.add('js');

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function usd(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  function store(key, value) {
    try {
      if (value === undefined) {
        var raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }
      window.localStorage.setItem(key, JSON.stringify(value));
      return value;
    } catch (e) {
      return null;
    }
  }

  /* ---------- 02. Mobile navigation ---------- */
  (function nav() {
    var toggle = $('.nav-toggle');
    var panel = $('#primary-nav');
    if (!toggle || !panel) return;

    function close() {
      toggle.setAttribute('aria-expanded', 'false');
      panel.classList.remove('is-open');
    }

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.classList.toggle('is-open', !open);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        close();
        toggle.focus();
      }
    });

    // Reset state when the desktop layout takes over.
    var wide = window.matchMedia('(min-width: 64em)');
    function sync() { if (wide.matches) close(); }
    if (wide.addEventListener) wide.addEventListener('change', sync);
    else if (wide.addListener) wide.addListener(sync);
  }());

  /* ---------- 03. Accordion ---------- */
  (function accordion() {
    $$('.accordion__trigger').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var panelId = btn.getAttribute('aria-controls');
        var panel = document.getElementById(panelId);
        if (!panel) return;
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        panel.hidden = open;
      });
    });
  }());

  /* ---------- 04. Scroll reveal ---------- */
  (function reveal() {
    var targets = $$('.reveal, .reveal-lines');
    if (!targets.length) return;

    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    targets.forEach(function (el) { io.observe(el); });
  }());

  /* ---------- 05. Hero parallax (hero only, per the design standard) ---------- */
  (function parallax() {
    var media = $('[data-parallax] img');
    if (!media || reducedMotion.matches) return;

    var host = media.closest('[data-parallax]');
    var visible = false;
    var ticking = false;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(host);
    } else {
      visible = true;
    }

    media.style.height = '118%';
    media.style.top = '-9%';
    media.style.position = 'absolute';

    function update() {
      ticking = false;
      if (!visible) return;
      var rect = host.getBoundingClientRect();
      var offset = Math.max(-90, Math.min(90, rect.top * -0.14));
      media.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0)';
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }());

  /* ---------- 06. Back to top ---------- */
  (function backToTop() {
    var btn = $('.backtotop');
    if (!btn) return;
    var ticking = false;

    function update() {
      ticking = false;
      btn.classList.toggle('is-visible', window.pageYOffset > 700);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      var skip = $('.skip-link');
      if (skip) skip.focus({ preventScroll: true });
    });
    update();
  }());

  /* ---------- 07. Cookie consent ----------
     No non-essential cookie or tracking script is loaded until a choice is
     stored. Rejecting keeps strictly necessary storage only. */
  (function consent() {
    var banner = $('#cookie-banner');
    var KEY = 'mfg.consent.v1';

    function apply(prefs) {
      // Real ad and analytics tags would be injected here, gated on consent.
      window.MFG_CONSENT = prefs;
      document.documentElement.setAttribute('data-consent-analytics', prefs.analytics ? 'granted' : 'denied');
      document.documentElement.setAttribute('data-consent-ads', prefs.ads ? 'granted' : 'denied');
    }

    var saved = store(KEY);
    if (saved) apply(saved);

    // Any page can expose a "manage cookies" link.
    $$('[data-open-cookie-prefs]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        if (!banner) return;
        banner.hidden = false;
        window.requestAnimationFrame(function () { banner.classList.add('is-visible'); });
        var prefs = $('#cookie-prefs');
        if (prefs) prefs.hidden = false;
        var first = $('#cookie-analytics');
        if (first) first.focus();
      });
    });

    if (!banner) return;

    function save(prefs) {
      store(KEY, prefs);
      apply(prefs);
      banner.classList.remove('is-visible');
      window.setTimeout(function () { banner.hidden = true; }, 480);
    }

    if (!saved) {
      window.setTimeout(function () {
        banner.hidden = false;
        window.requestAnimationFrame(function () { banner.classList.add('is-visible'); });
      }, 900);
    }

    var acceptBtn = $('#cookie-accept');
    var rejectBtn = $('#cookie-reject');
    var manageBtn = $('#cookie-manage');
    var saveBtn = $('#cookie-save');
    var prefsPanel = $('#cookie-prefs');

    if (acceptBtn) acceptBtn.addEventListener('click', function () {
      save({ necessary: true, analytics: true, ads: true, at: Date.now() });
    });
    if (rejectBtn) rejectBtn.addEventListener('click', function () {
      save({ necessary: true, analytics: false, ads: false, at: Date.now() });
    });
    if (manageBtn && prefsPanel) manageBtn.addEventListener('click', function () {
      var open = !prefsPanel.hidden;
      prefsPanel.hidden = open;
      manageBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (!open) { var f = $('#cookie-analytics'); if (f) f.focus(); }
    });
    if (saveBtn) saveBtn.addEventListener('click', function () {
      save({
        necessary: true,
        analytics: !!($('#cookie-analytics') || {}).checked,
        ads: !!($('#cookie-ads') || {}).checked,
        at: Date.now()
      });
    });
  }());

  /* ---------- 08. Form validation ---------- */
  (function forms() {
    var EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    var PHONE = /^[0-9()+\-.\s]{10,20}$/;

    function setError(field, message) {
      field.classList.add('has-error');
      var msg = $('.error-msg', field);
      if (msg) msg.textContent = message;
      var input = $('input, select, textarea', field);
      if (input) input.setAttribute('aria-invalid', 'true');
    }
    function clearError(field) {
      field.classList.remove('has-error');
      var input = $('input, select, textarea', field);
      if (input) input.removeAttribute('aria-invalid');
    }

    function validateInput(input) {
      var field = input.closest('.field');
      if (!field) return true;
      var value = (input.value || '').trim();
      var label = (input.getAttribute('data-label') || 'This field');

      if (input.hasAttribute('required') && !value) {
        setError(field, label + ' is required.');
        return false;
      }
      if (value && input.type === 'email' && !EMAIL.test(value)) {
        setError(field, 'Enter a valid email address, for example jordan@example.com.');
        return false;
      }
      if (value && input.type === 'tel' && !PHONE.test(value)) {
        setError(field, 'Enter a US phone number, for example +1 (503) 894-2170.');
        return false;
      }
      if (value && input.hasAttribute('minlength') && value.length < Number(input.getAttribute('minlength'))) {
        setError(field, label + ' needs at least ' + input.getAttribute('minlength') + ' characters.');
        return false;
      }
      clearError(field);
      return true;
    }

    $$('form[data-validate]').forEach(function (form) {
      var inputs = $$('input, select, textarea', form).filter(function (i) {
        return i.type !== 'hidden' && i.type !== 'submit';
      });

      inputs.forEach(function (input) {
        input.addEventListener('blur', function () { validateInput(input); });
        input.addEventListener('input', function () {
          var field = input.closest('.field');
          if (field && field.classList.contains('has-error')) validateInput(input);
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        var firstBad = null;

        inputs.forEach(function (input) {
          if (!validateInput(input)) {
            ok = false;
            if (!firstBad) firstBad = input;
          }
        });

        // Consent checkbox, when present, must be ticked.
        var consentBox = $('[data-require-check]', form);
        if (consentBox) {
          var cField = consentBox.closest('.field');
          if (!consentBox.checked && cField) {
            setError(cField, 'Please confirm before sending.');
            ok = false;
            if (!firstBad) firstBad = consentBox;
          } else if (cField) {
            clearError(cField);
          }
        }

        var status = $('.form-status', form);
        if (!ok) {
          if (status) {
            status.hidden = false;
            status.textContent = 'Please correct the highlighted fields, then send again.';
          }
          if (firstBad) firstBad.focus();
          return;
        }

        if (status) {
          status.hidden = false;
          status.textContent = form.getAttribute('data-success') ||
            'Thank you. Your message has been queued and our editors reply within one business day.';
          status.focus && status.focus();
        }
        form.reset();
      });
    });
  }());

  /* ---------- 09. Trip planner engine ---------- */
  var PLANNER_DATA = {
    'south-iceland': {
      name: 'Reykjavik and South Iceland',
      airport: 'Keflavik (KEF)',
      currency: 'Icelandic krona',
      lodging: { thrifty: 118, moderate: 205, comfortable: 340 },
      meals: { thrifty: 52, moderate: 88, comfortable: 145 },
      stops: [
        { t: 'Hallgrimskirkja tower', d: 'Ride the elevator up for the clearest overview of the harbour and the coloured rooftops.', cost: 8, mins: 60, transit: '10 min walk from Laugavegur', tags: ['history', 'art'] },
        { t: 'Sundhollin thermal pool', d: 'The neighbourhood pool locals actually use. Bring flip-flops and shower before entering.', cost: 9, mins: 90, transit: '8 min walk', tags: ['outdoors', 'family'] },
        { t: 'Reykjavik Flea Market', d: 'Weekend only. Dried fish, wool, secondhand paperbacks and a decent lunch counter.', cost: 0, mins: 75, transit: '12 min walk', tags: ['food', 'family'] },
        { t: 'Thingvellir National Park', d: 'Walk the rift between the North American and Eurasian plates on the Almannagja path.', cost: 6, mins: 120, transit: '50 min drive from Reykjavik', tags: ['outdoors', 'history'] },
        { t: 'Geysir geothermal field', d: 'Strokkur erupts every six to ten minutes. Stand upwind and stay behind the rope.', cost: 0, mins: 60, transit: '55 min drive', tags: ['outdoors', 'family'] },
        { t: 'Gullfoss waterfall', d: 'Two-tier falls into a canyon. The upper platform stays open when the lower path ices over.', cost: 0, mins: 60, transit: '10 min drive', tags: ['outdoors'] },
        { t: 'Seljalandsfoss', d: 'The waterfall you can walk behind. You will get soaked, so pack a shell.', cost: 6, mins: 60, transit: '1 hr 50 min drive', tags: ['outdoors'] },
        { t: 'Reynisfjara black sand beach', d: 'Basalt columns and dangerous sneaker waves. Never turn your back on the water.', cost: 0, mins: 75, transit: '45 min drive', tags: ['outdoors'] },
        { t: 'Skogafoss and the stairway', d: '527 steps to the clifftop view and the start of the Fimmvorduhals trail.', cost: 0, mins: 90, transit: '30 min drive', tags: ['outdoors'] },
        { t: 'Solheimajokull glacier walk', d: 'Guided crampon walk on the outlet glacier. Book ahead, guides supply the hardware.', cost: 125, mins: 210, transit: '25 min drive', tags: ['outdoors'] },
        { t: 'Vik i Myrdal village', d: 'Wool shop, one good bakery and the red-roofed church above town.', cost: 0, mins: 60, transit: '15 min drive', tags: ['food', 'family'] },
        { t: 'Sky Lagoon at sunset', d: 'Ocean-edge geothermal bathing with the seven-step ritual. Quieter than the Blue Lagoon.', cost: 78, mins: 150, transit: '20 min drive', tags: ['outdoors', 'nightlife'] },
        { t: 'Grandi harbour seafood', d: 'Plaice, langoustine and cod cheeks at the old fishing sheds by the slipway.', cost: 46, mins: 90, transit: '15 min walk', tags: ['food'] },
        { t: 'National Museum of Iceland', d: 'One thousand one hundred years of settlement history in a single, well-paced floor plan.', cost: 20, mins: 120, transit: '20 min walk', tags: ['history', 'art'] },
        { t: 'Northern lights drive', d: 'Drive 40 minutes out of the city glow between September and March, then wait.', cost: 0, mins: 180, transit: '40 min drive', tags: ['outdoors', 'nightlife'] }
      ]
    },
    'kyoto': {
      name: 'Kyoto and the Kansai region',
      airport: 'Osaka Kansai (KIX)',
      currency: 'Japanese yen',
      lodging: { thrifty: 82, moderate: 168, comfortable: 310 },
      meals: { thrifty: 38, moderate: 72, comfortable: 135 },
      stops: [
        { t: 'Fushimi Inari at dawn', d: 'Start at 6:30 a.m. and the first thousand gates are effectively empty.', cost: 0, mins: 120, transit: '6 min on the Nara Line', tags: ['history', 'outdoors'] },
        { t: 'Nishiki Market', d: 'Five blocks of pickles, tamagoyaki, knives and yuba. Eat where you buy, not while walking.', cost: 24, mins: 90, transit: '15 min subway', tags: ['food', 'family'] },
        { t: 'Kiyomizu-dera', d: 'The wooden stage over the hillside, plus the Otowa waterfall queue below it.', cost: 4, mins: 105, transit: '20 min bus', tags: ['history'] },
        { t: 'Sannenzaka and Ninenzaka lanes', d: 'Stone-paved slopes of machiya shops. Photography is restricted on the side alleys.', cost: 0, mins: 75, transit: '5 min walk', tags: ['history', 'art'] },
        { t: 'Gion evening walk', d: 'Hanamikoji at dusk. Do not photograph geiko or maiko without permission.', cost: 0, mins: 90, transit: '18 min walk', tags: ['nightlife', 'history'] },
        { t: 'Arashiyama bamboo grove', d: 'Go before 8 a.m. The grove is small and fills fast after the first train arrives.', cost: 0, mins: 60, transit: '25 min on the JR Sagano Line', tags: ['outdoors'] },
        { t: 'Tenryu-ji temple garden', d: 'A fourteenth-century borrowed-scenery garden that survived eight fires.', cost: 7, mins: 75, transit: '4 min walk', tags: ['history', 'art'] },
        { t: 'Okochi Sanso Villa', d: 'Hillside garden of a silent-film actor. Admission includes matcha and a sweet.', cost: 8, mins: 75, transit: '10 min walk', tags: ['art', 'history'] },
        { t: 'Kinkaku-ji golden pavilion', d: 'One loop, roughly forty minutes. Best light is late afternoon in winter.', cost: 4, mins: 60, transit: '35 min bus', tags: ['history'] },
        { t: 'Nara deer park and Todai-ji', d: 'Day trip. The Great Buddha hall is the largest wooden building of its kind.', cost: 12, mins: 300, transit: '45 min express train', tags: ['history', 'family', 'outdoors'] },
        { t: 'Dotonbori, Osaka', d: 'Neon canal, takoyaki stalls and the Glico sign. Loud, cheerful and open late.', cost: 30, mins: 180, transit: '30 min on the Keihan Line', tags: ['nightlife', 'food'] },
        { t: 'Kyoto Railway Museum', d: 'Steam roundhouse, a working turntable and a simulator that kids queue for.', cost: 9, mins: 150, transit: '15 min bus', tags: ['family', 'history'] },
        { t: 'Pontocho alley dinner', d: 'One-lane dining strip along the Kamo river. Many rooms seat six people at most.', cost: 62, mins: 120, transit: '10 min walk', tags: ['food', 'nightlife'] },
        { t: 'Philosopher’s Path', d: 'Canal-side walk between Ginkaku-ji and Nanzen-ji, about two miles end to end.', cost: 0, mins: 105, transit: '25 min bus', tags: ['outdoors', 'art'] },
        { t: 'Sento public bathhouse', d: 'Funaoka Onsen keeps its 1923 carved woodwork. Tattoo rules vary, so ask first.', cost: 4, mins: 90, transit: '20 min bus', tags: ['nightlife', 'family'] }
      ]
    },
    'southern-utah': {
      name: 'Southern Utah national parks',
      airport: 'Las Vegas (LAS) or Salt Lake City (SLC)',
      currency: 'US dollar',
      lodging: { thrifty: 96, moderate: 178, comfortable: 295 },
      meals: { thrifty: 44, moderate: 76, comfortable: 120 },
      stops: [
        { t: 'Zion Canyon shuttle to the Narrows', d: 'Riverside Walk to the gateway, then wade as far upstream as the flow allows.', cost: 0, mins: 240, transit: '40 min shuttle from Springdale', tags: ['outdoors'] },
        { t: 'Angels Landing (permit required)', d: 'Lottery permit, chains section, 1,488 ft of gain. Skip in wind or ice.', cost: 6, mins: 270, transit: '25 min shuttle', tags: ['outdoors'] },
        { t: 'Canyon Overlook Trail', d: 'One mile round trip for the best cheap view in Zion. Parking is the hard part.', cost: 0, mins: 75, transit: '20 min drive', tags: ['outdoors', 'family'] },
        { t: 'Bryce Canyon sunrise at Sunset Point', d: 'Counterintuitive but correct. The hoodoos light from the east.', cost: 0, mins: 75, transit: '1 hr 50 min drive from Zion', tags: ['outdoors'] },
        { t: 'Navajo Loop and Queens Garden', d: 'Three-mile combination that drops into the amphitheatre and climbs Wall Street.', cost: 0, mins: 180, transit: '5 min drive', tags: ['outdoors'] },
        { t: 'Escalante slot canyons', d: 'Peek-a-Boo and Spooky Gulch. High-clearance vehicle strongly recommended.', cost: 0, mins: 300, transit: '1 hr 40 min drive', tags: ['outdoors'] },
        { t: 'Capitol Reef orchards and pie', d: 'Pick fruit in season at Fruita, then buy a pie at the Gifford Homestead.', cost: 14, mins: 120, transit: '1 hr 30 min drive', tags: ['food', 'family'] },
        { t: 'Goblin Valley State Park', d: 'A basin of mushroom-shaped hoodoos children are allowed to scramble on.', cost: 20, mins: 150, transit: '1 hr 20 min drive', tags: ['family', 'outdoors'] },
        { t: 'Arches: Delicate Arch at golden hour', d: 'Three miles round trip on slickrock with no shade. Carry two liters per person.', cost: 0, mins: 195, transit: '2 hr 20 min drive', tags: ['outdoors'] },
        { t: 'Canyonlands Island in the Sky', d: 'Mesa Arch at sunrise, Grand View Point at noon, Green River Overlook after.', cost: 0, mins: 240, transit: '45 min drive', tags: ['outdoors'] },
        { t: 'Dead Horse Point sunset', d: 'A gooseneck of the Colorado 2,000 ft below. State park fee, separate from the NPS pass.', cost: 20, mins: 105, transit: '25 min drive', tags: ['outdoors', 'family'] },
        { t: 'Moab Museum', d: 'Uranium boom, Ancestral Puebloan sites and the geology that made the arches.', cost: 10, mins: 90, transit: '15 min drive', tags: ['history'] },
        { t: 'Dark sky stargazing programme', d: 'Ranger-led night sky talk. Bryce and Canyonlands both hold dark sky certification.', cost: 0, mins: 120, transit: '20 min drive', tags: ['outdoors', 'family', 'nightlife'] },
        { t: 'Kolob Canyons', d: 'Zion’s quiet northwest corner off I-15. Five-mile scenic drive, almost no crowds.', cost: 0, mins: 150, transit: '50 min drive', tags: ['outdoors'] },
        { t: 'Moab brewery dinner', d: 'Post-hike burgers and a house lager. Utah pours are regulated, so pace accordingly.', cost: 38, mins: 105, transit: '10 min drive', tags: ['food', 'nightlife'] }
      ]
    },
    'new-orleans': {
      name: 'New Orleans, Louisiana',
      airport: 'Louis Armstrong (MSY)',
      currency: 'US dollar',
      lodging: { thrifty: 92, moderate: 165, comfortable: 285 },
      meals: { thrifty: 46, moderate: 84, comfortable: 138 },
      stops: [
        { t: 'Cafe du Monde beignets', d: 'Cash line moves faster. Order three beignets and a cafe au lait, then wear black at your peril.', cost: 9, mins: 45, transit: '5 min walk from Jackson Square', tags: ['food', 'family'] },
        { t: 'French Quarter architecture walk', d: 'Royal and Chartres streets, wrought iron galleries and the 1794 fire rebuild.', cost: 0, mins: 105, transit: '5 min walk', tags: ['history', 'art'] },
        { t: 'The Historic New Orleans Collection', d: 'Free galleries covering the founding, the Louisiana Purchase and Storyville.', cost: 0, mins: 90, transit: '6 min walk', tags: ['history', 'art'] },
        { t: 'St. Charles streetcar to the Garden District', d: 'The oldest continuously operating streetcar line in the world. Exact fare or a Jazzy Pass.', cost: 3, mins: 60, transit: '30 min streetcar', tags: ['history', 'family'] },
        { t: 'Lafayette Cemetery No. 1 area walk', d: 'Above-ground tombs and the mansions of Prytania Street on the same loop.', cost: 0, mins: 75, transit: '10 min walk', tags: ['history'] },
        { t: 'Frenchmen Street music crawl', d: 'Three rooms in one night: brass, trad jazz and something unlabelled. Tip the band.', cost: 35, mins: 210, transit: '15 min walk', tags: ['nightlife'] },
        { t: 'Preservation Hall set', d: 'Fifty minutes, no bar, no photos. Buy the reserved ticket if you dislike standing.', cost: 50, mins: 75, transit: '8 min walk', tags: ['nightlife', 'history'] },
        { t: 'National WWII Museum', d: 'Budget half a day. The Road to Berlin and Pacific halls each take ninety minutes.', cost: 35, mins: 300, transit: '20 min streetcar', tags: ['history'] },
        { t: 'Bayou Sauvage kayak paddle', d: 'Cypress swamp inside the city limits. Guided trips launch year round.', cost: 68, mins: 210, transit: '35 min drive', tags: ['outdoors', 'family'] },
        { t: 'City Park and the sculpture garden', d: 'Live oaks, Storyland for children and eleven acres of outdoor sculpture, free.', cost: 0, mins: 150, transit: '25 min streetcar', tags: ['outdoors', 'family', 'art'] },
        { t: 'Po-boy lunch on Magazine Street', d: 'Roast beef debris, dressed. Ask for extra napkins and mean it.', cost: 18, mins: 60, transit: '15 min bus', tags: ['food'] },
        { t: 'Backstreet Cultural Museum', d: 'Mardi Gras Indian suits and second-line history, told by the people who carry it.', cost: 15, mins: 75, transit: '12 min drive', tags: ['history', 'art'] },
        { t: 'Cocktail history at the Sazerac Bar', d: 'The Roosevelt lobby bar, 1930s murals intact. One drink is the point, not four.', cost: 24, mins: 75, transit: '10 min walk', tags: ['nightlife', 'food'] },
        { t: 'Creole cooking class', d: 'Two and a half hours: roux, gumbo, bread pudding, and the recipes to take home.', cost: 89, mins: 165, transit: '10 min walk', tags: ['food', 'family'] },
        { t: 'Sunday second line parade', d: 'Neighbourhood social aid and pleasure club parades. Routes are posted weekly on WWOZ.', cost: 0, mins: 180, transit: '20 min drive', tags: ['nightlife', 'history', 'family'] }
      ]
    },
    'lisbon': {
      name: 'Lisbon and Sintra, Portugal',
      airport: 'Humberto Delgado (LIS)',
      currency: 'Euro',
      lodging: { thrifty: 78, moderate: 142, comfortable: 245 },
      meals: { thrifty: 36, moderate: 66, comfortable: 112 },
      stops: [
        { t: 'Alfama and the Miradouro das Portas do Sol', d: 'Walk down, never up. The tiled terrace looks straight over the river.', cost: 0, mins: 105, transit: '15 min walk from Baixa', tags: ['history', 'outdoors'] },
        { t: 'Sao Jorge Castle', d: 'Moorish walls, peacocks and a camera obscura demonstration on the hour.', cost: 16, mins: 120, transit: '12 min walk', tags: ['history', 'family'] },
        { t: 'Tram 28 end to end', d: 'Board at Martim Moniz early. Keep your bag in front of you the whole ride.', cost: 4, mins: 75, transit: '5 min walk', tags: ['history', 'family'] },
        { t: 'Time Out Market lunch', d: 'Twenty-six kitchens under one roof. Split plates and eat at the communal tables.', cost: 28, mins: 90, transit: '18 min walk', tags: ['food', 'family'] },
        { t: 'Belem Tower and Jeronimos Monastery', d: 'Two Manueline landmarks a fifteen-minute walk apart. Book monastery slots online.', cost: 22, mins: 210, transit: '25 min tram', tags: ['history', 'art'] },
        { t: 'Pasteis de Belem', d: 'The original custard tart bakery, 1837. Sit inside, dust with cinnamon.', cost: 6, mins: 45, transit: '4 min walk', tags: ['food', 'family'] },
        { t: 'MAAT riverside gallery', d: 'Contemporary art in a wave-shaped building you can walk over as well as into.', cost: 11, mins: 105, transit: '10 min walk', tags: ['art'] },
        { t: 'LX Factory', d: 'Print works turned bookshops, roastery and rooftop. Sunday market is the busiest slot.', cost: 0, mins: 120, transit: '15 min tram', tags: ['art', 'food'] },
        { t: 'Fado in a small Alfama room', d: 'Two sets, dinner included. Talking during a fado is genuinely rude.', cost: 55, mins: 165, transit: '20 min walk', tags: ['nightlife', 'history'] },
        { t: 'Sintra: Pena Palace', d: 'Buy the timed entry. The bus queue up the hill is longer than the walk.', cost: 24, mins: 210, transit: '40 min train from Rossio', tags: ['history', 'family'] },
        { t: 'Quinta da Regaleira', d: 'Initiation well, grottoes and a garden built as a Masonic puzzle.', cost: 14, mins: 150, transit: '20 min walk', tags: ['history', 'outdoors'] },
        { t: 'Cabo da Roca', d: 'The westernmost point of continental Europe. Windy in every season.', cost: 0, mins: 90, transit: '35 min bus', tags: ['outdoors'] },
        { t: 'Cascais seafront', d: 'Sand, a fort and a train back to the city that runs along the water the whole way.', cost: 0, mins: 150, transit: '30 min bus', tags: ['outdoors', 'family'] },
        { t: 'Ginjinha at A Ginjinha', d: 'Sour cherry liqueur, standing room, ninety seconds, two euros.', cost: 3, mins: 30, transit: '8 min walk', tags: ['nightlife', 'food'] },
        { t: 'Museu Nacional do Azulejo', d: 'Five centuries of tile in a former convent, including a 1738 panorama of the city.', cost: 9, mins: 120, transit: '20 min bus', tags: ['art', 'history'] }
      ]
    },
    'banff': {
      name: 'Banff and the Canadian Rockies',
      airport: 'Calgary (YYC)',
      currency: 'Canadian dollar',
      lodging: { thrifty: 130, moderate: 232, comfortable: 405 },
      meals: { thrifty: 50, moderate: 88, comfortable: 142 },
      stops: [
        { t: 'Moraine Lake shuttle at sunrise', d: 'Private vehicles are banned. Reserve the Parks Canada shuttle weeks ahead.', cost: 24, mins: 210, transit: '55 min shuttle from Banff', tags: ['outdoors'] },
        { t: 'Lake Louise lakeshore walk', d: 'Flat 2.6 miles to the end of the lake and the start of the Plain of Six Glaciers.', cost: 0, mins: 120, transit: '15 min shuttle', tags: ['outdoors', 'family'] },
        { t: 'Plain of Six Glaciers teahouse', d: '8.4 miles round trip to a 1927 teahouse that takes cash only.', cost: 18, mins: 300, transit: 'trailhead at the lake', tags: ['outdoors'] },
        { t: 'Johnston Canyon catwalks', d: 'Steel walkways bolted to the canyon wall, lower falls at 0.7 miles.', cost: 0, mins: 135, transit: '30 min drive', tags: ['outdoors', 'family'] },
        { t: 'Banff Upper Hot Springs', d: 'Mineral pool at 5,200 ft with a view of Mount Rundle. Towel rental available.', cost: 13, mins: 105, transit: '10 min drive', tags: ['outdoors', 'family'] },
        { t: 'Banff Gondola to Sulphur Mountain', d: 'Eight minutes up, then a boardwalk ridge to the 1903 weather observatory.', cost: 52, mins: 165, transit: '5 min drive', tags: ['outdoors', 'family'] },
        { t: 'Icefields Parkway drive', d: 'Ninety-three miles of Highway 93 North. Fuel up at Saskatchewan River Crossing.', cost: 0, mins: 330, transit: 'self-drive from Lake Louise', tags: ['outdoors'] },
        { t: 'Peyto Lake overlook', d: 'The wolf-head lake. The upper viewing deck is wheelchair accessible.', cost: 0, mins: 75, transit: '45 min drive', tags: ['outdoors', 'family'] },
        { t: 'Athabasca Glacier ice walk', d: 'Guided walk on the Columbia Icefield. Crampons and a shell are essential.', cost: 128, mins: 240, transit: '1 hr 30 min drive', tags: ['outdoors'] },
        { t: 'Whyte Museum of the Canadian Rockies', d: 'Mountaineering archives and the Peter and Catharine Whyte heritage homes.', cost: 12, mins: 105, transit: '5 min walk', tags: ['history', 'art'] },
        { t: 'Bow Valley Parkway wildlife drive', d: 'Dawn or dusk, 30 mph, and stay in the vehicle. Elk, bighorn sheep, occasional bear.', cost: 0, mins: 150, transit: 'self-drive', tags: ['outdoors', 'family'] },
        { t: 'Canoe on Vermilion Lakes', d: 'Flat water, Mount Rundle reflected, ten minutes from the town centre.', cost: 65, mins: 120, transit: '8 min drive', tags: ['outdoors', 'family'] },
        { t: 'Banff Avenue dinner', d: 'Alberta beef, bison chili or a decent ramen. Reserve on summer weekends.', cost: 58, mins: 105, transit: '5 min walk', tags: ['food'] },
        { t: 'Cave and Basin National Historic Site', d: 'The thermal spring that started Canada’s park system in 1885.', cost: 9, mins: 90, transit: '8 min drive', tags: ['history', 'family'] },
        { t: 'Dark sky viewing at Two Jack Lake', d: 'Banff is a Dark Sky Preserve. Bring a red headlamp and a folding chair.', cost: 0, mins: 120, transit: '15 min drive', tags: ['outdoors', 'nightlife'] }
      ]
    },
    'new-york': {
      name: 'New York City',
      airport: 'JFK, LaGuardia (LGA) or Newark (EWR)',
      currency: 'US dollar',
      lodging: { thrifty: 145, moderate: 268, comfortable: 445 },
      meals: { thrifty: 52, moderate: 95, comfortable: 165 },
      stops: [
        { t: 'Staten Island Ferry round trip', d: 'Free, twenty-five minutes each way, and the best harbour view in the city.', cost: 0, mins: 90, transit: '10 min subway to Whitehall', tags: ['outdoors', 'family'] },
        { t: '9/11 Memorial and Museum', d: 'The pools are free and open air. The museum needs a timed ticket and two hours.', cost: 33, mins: 180, transit: '12 min walk', tags: ['history'] },
        { t: 'The High Line', d: 'Elevated rail line turned garden walk, Gansevoort to 34th, roughly 1.45 miles.', cost: 0, mins: 105, transit: '15 min subway', tags: ['outdoors', 'art', 'family'] },
        { t: 'Chelsea Market lunch', d: 'Lobster rolls, tacos and a bookshop in a former Nabisco factory.', cost: 26, mins: 75, transit: '2 min walk', tags: ['food', 'family'] },
        { t: 'The Metropolitan Museum of Art', d: 'Pick two wings, not eight. Egyptian and American Wing is a good pairing.', cost: 30, mins: 210, transit: '20 min subway', tags: ['art', 'history'] },
        { t: 'Central Park loop', d: 'Bethesda Terrace, the Ramble and Belvedere Castle in a three-mile figure eight.', cost: 0, mins: 150, transit: '5 min walk', tags: ['outdoors', 'family'] },
        { t: 'Brooklyn Bridge walk at sunrise', d: 'Start on the Brooklyn side to walk toward the skyline. The bike lane is not for you.', cost: 0, mins: 90, transit: '20 min subway to High St', tags: ['outdoors', 'history'] },
        { t: 'Dumbo and Brooklyn Bridge Park', d: 'Jane’s Carousel, the Manhattan Bridge view from Washington Street, pizza after.', cost: 22, mins: 150, transit: '10 min walk', tags: ['family', 'food'] },
        { t: 'Tenement Museum, Lower East Side', d: 'Guided apartment tours reconstructing immigrant households from 1863 to 1935.', cost: 30, mins: 105, transit: '18 min subway', tags: ['history'] },
        { t: 'Broadway evening performance', d: 'Digital lotteries open the morning of the show. Rush tickets need a box office queue.', cost: 89, mins: 195, transit: '15 min subway', tags: ['nightlife', 'art'] },
        { t: 'Jazz at the Village Vanguard', d: 'Basement room since 1935, two sets a night, cash bar minimum.', cost: 45, mins: 135, transit: '12 min subway', tags: ['nightlife', 'art'] },
        { t: 'Grand Central and the Oyster Bar', d: 'Whispering gallery, the ceiling constellation, then chowder under the tiled vaults.', cost: 32, mins: 105, transit: '10 min subway', tags: ['history', 'food'] },
        { t: 'Museum of Natural History', d: 'Blue whale, the Rose Center and the fourth-floor fossil halls. Timed entry.', cost: 28, mins: 195, transit: '15 min subway', tags: ['family', 'history'] },
        { t: 'Flushing food crawl, Queens', d: 'Hand-pulled noodles, lamb skewers and a food court basement worth the 7 train.', cost: 30, mins: 180, transit: '40 min on the 7 train', tags: ['food'] },
        { t: 'Top of the Rock at dusk', d: 'Better than the taller options because the Empire State Building is in the view.', cost: 40, mins: 105, transit: '10 min subway', tags: ['family', 'nightlife'] }
      ]
    },
    'mexico-city': {
      name: 'Mexico City',
      airport: 'Benito Juarez (MEX)',
      currency: 'Mexican peso',
      lodging: { thrifty: 62, moderate: 128, comfortable: 235 },
      meals: { thrifty: 28, moderate: 55, comfortable: 98 },
      stops: [
        { t: 'Centro Historico and the Zocalo', d: 'Metropolitan Cathedral, the Templo Mayor ruins and the Diego Rivera stairwell murals.', cost: 6, mins: 180, transit: '15 min metro', tags: ['history', 'art'] },
        { t: 'Palacio de Bellas Artes', d: 'Art nouveau outside, art deco inside, and murals by Rivera, Orozco and Siqueiros.', cost: 5, mins: 105, transit: '8 min walk', tags: ['art', 'history'] },
        { t: 'Museo Nacional de Antropologia', d: 'The single best museum in the country. Aztec and Maya halls alone need two hours.', cost: 5, mins: 210, transit: '20 min metro', tags: ['history', 'art'] },
        { t: 'Chapultepec Park and Castle', d: 'The only royal castle in the Americas, on a hill above a park twice the size of Central Park.', cost: 5, mins: 165, transit: '10 min walk', tags: ['history', 'outdoors', 'family'] },
        { t: 'Coyoacan and the Frida Kahlo Museum', d: 'Casa Azul sells out weeks ahead. The market and plaza fill the rest of the afternoon.', cost: 16, mins: 210, transit: '35 min metro and taxi', tags: ['art', 'history'] },
        { t: 'Xochimilco trajinera', d: 'Flat-bottomed boats on pre-Hispanic canals. Hire by the hour, split between a group.', cost: 22, mins: 210, transit: '45 min light rail', tags: ['outdoors', 'family'] },
        { t: 'Teotihuacan pyramids', d: 'Half-day trip. Arrive by 9 a.m. for the Avenue of the Dead before the heat.', cost: 9, mins: 330, transit: '1 hr bus from Terminal Norte', tags: ['history', 'outdoors'] },
        { t: 'Roma Norte taco crawl', d: 'Al pastor, suadero, and a churro stop. Follow the queues, not the reviews.', cost: 18, mins: 150, transit: '15 min walk', tags: ['food'] },
        { t: 'Mercado de San Juan', d: 'The chefs’ market: cheese, chiles, tlacoyos and a counter that will cook what you buy.', cost: 20, mins: 105, transit: '12 min metro', tags: ['food', 'family'] },
        { t: 'Lucha libre at Arena Mexico', d: 'Friday nights, tier two seats, masks sold outside for a fraction of the lobby price.', cost: 26, mins: 195, transit: '15 min metro', tags: ['nightlife', 'family'] },
        { t: 'Museo Soumaya and Plaza Carso', d: 'Free admission, a silver-tiled hull, and the largest Rodin collection outside France.', cost: 0, mins: 120, transit: '25 min metro', tags: ['art'] },
        { t: 'Condesa architecture walk', d: 'Art deco apartment blocks around Parque Mexico and Avenida Amsterdam’s oval.', cost: 0, mins: 105, transit: '10 min walk', tags: ['art', 'outdoors'] },
        { t: 'Mezcaleria in Juarez', d: 'Espadin, tobala and an explanation of each. Sip, never shoot.', cost: 24, mins: 120, transit: '12 min walk', tags: ['nightlife', 'food'] },
        { t: 'Biblioteca Vasconcelos', d: 'Suspended stacks in a glass megastructure. Free, quiet and photogenic.', cost: 0, mins: 75, transit: '20 min metro', tags: ['art', 'family'] },
        { t: 'Ballet Folklorico', d: 'Regional dance in the Bellas Artes hall with its Tiffany glass curtain.', cost: 48, mins: 150, transit: '8 min walk', tags: ['nightlife', 'art', 'family'] }
      ]
    }
  };

  (function planner() {
    var form = $('#planner-form');
    var out = $('#planner-output');
    if (!form || !out) return;

    var KEY = 'mfg.plan.v1';
    var state = null;

    function minsToClock(mins) {
      var h = Math.floor(mins / 60) % 24;
      var m = mins % 60;
      var suffix = h >= 12 ? 'p.m.' : 'a.m.';
      var h12 = h % 12 === 0 ? 12 : h % 12;
      return h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + suffix;
    }

    function readForm() {
      var interests = $$('input[name="interest"]:checked', form).map(function (i) { return i.value; });
      return {
        dest: $('#p-dest', form).value,
        start: $('#p-start', form).value,
        days: Math.max(1, Math.min(14, parseInt($('#p-days', form).value, 10) || 3)),
        travelers: Math.max(1, Math.min(12, parseInt($('#p-travelers', form).value, 10) || 2)),
        pace: $('#p-pace', form).value,
        budget: $('#p-budget', form).value,
        interests: interests.length ? interests : ['outdoors', 'food', 'history', 'art', 'nightlife', 'family']
      };
    }

    function build(cfg) {
      var dest = PLANNER_DATA[cfg.dest];
      if (!dest) return null;

      var perDay = cfg.pace === 'relaxed' ? 3 : (cfg.pace === 'packed' ? 5 : 4);
      var startHour = cfg.pace === 'packed' ? 8 : 9;

      // Rank stops: those matching a chosen interest first, in dataset order.
      var matched = dest.stops.filter(function (s) {
        return s.tags.some(function (t) { return cfg.interests.indexOf(t) > -1; });
      });
      var rest = dest.stops.filter(function (s) { return matched.indexOf(s) === -1; });
      var pool = matched.concat(rest);

      var days = [];
      var idx = 0;
      for (var d = 0; d < cfg.days; d++) {
        var clock = startHour * 60;
        var stops = [];
        for (var k = 0; k < perDay; k++) {
          var s = pool[idx % pool.length];
          idx++;
          stops.push({
            time: clock,
            t: s.t,
            d: s.d,
            cost: s.cost,
            mins: s.mins,
            transit: s.transit
          });
          clock += s.mins + 35; // 35 min buffer covers transit and slack
          if (clock > 21 * 60) clock = 21 * 60;
        }
        days.push({ n: d + 1, stops: stops });
      }
      return { cfg: cfg, dest: dest, days: days };
    }

    function dayCost(day, cfg, dest) {
      var activities = day.stops.reduce(function (sum, s) { return sum + s.cost; }, 0) * cfg.travelers;
      var meals = dest.meals[cfg.budget] * cfg.travelers;
      var rooms = Math.ceil(cfg.travelers / 2);
      var lodging = dest.lodging[cfg.budget] * rooms;
      return { activities: activities, meals: meals, lodging: lodging, total: activities + meals + lodging };
    }

    function fmtDate(startISO, offset) {
      if (!startISO) return '';
      var parts = startISO.split('-');
      var dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      dt.setDate(dt.getDate() + offset);
      var mm = String(dt.getMonth() + 1).padStart(2, '0');
      var dd = String(dt.getDate()).padStart(2, '0');
      return mm + '/' + dd + '/' + dt.getFullYear();
    }

    function render() {
      if (!state) {
        out.innerHTML = '<p class="plan-empty">No plan on the desk yet. Fill in the brief above and the day plans will be typeset here, with time-stamped stops, travel time between them and an estimated daily cost.</p>';
        return;
      }

      var cfg = state.cfg, dest = state.dest;
      var grand = 0;
      state.days.forEach(function (day) { grand += dayCost(day, cfg, dest).total; });

      var html = '';
      html += '<dl class="plan-summary">';
      html += '<div><dt>Destination</dt><dd>' + dest.name + '</dd></div>';
      html += '<div><dt>Length</dt><dd>' + cfg.days + ' ' + (cfg.days === 1 ? 'day' : 'days') + '</dd></div>';
      html += '<div><dt>Party</dt><dd>' + cfg.travelers + ' ' + (cfg.travelers === 1 ? 'traveler' : 'travelers') + '</dd></div>';
      html += '<div><dt>Estimated total</dt><dd>' + usd(grand) + '</dd></div>';
      html += '</dl>';

      html += '<p class="standfirst">Departing for ' + dest.airport + '. Costs are estimates in US dollars, covering lodging, meals and admissions for the whole party. Flights are not included.</p>';

      state.days.forEach(function (day, di) {
        var c = dayCost(day, cfg, dest);
        var dateLabel = fmtDate(cfg.start, di);
        html += '<article class="dayplan" aria-label="Day ' + day.n + ' plan">';
        html += '<div class="dayplan__head">';
        html += '<p class="dayplan__day">Day ' + day.n + (dateLabel ? ' &nbsp;·&nbsp; ' + dateLabel : '') + '</p>';
        html += '<p class="dayplan__miles">' + cfg.pace + ' pace &nbsp;·&nbsp; ' + day.stops.length + ' stops</p>';
        html += '</div>';
        html += '<h3>' + dest.name + ', day ' + day.n + '</h3>';
        html += '<ul class="stops">';
        day.stops.forEach(function (s, si) {
          html += '<li class="stop-editable">';
          html += '<p class="stop__time">' + minsToClock(s.time) + '</p>';
          html += '<div class="stop__body">';
          html += '<h4>' + s.t + '</h4>';
          html += '<p>' + s.d + '</p>';
          html += '<p class="stop__transit">' + s.transit + ' &nbsp;·&nbsp; allow ' + Math.round(s.mins / 15) * 15 + ' min on site &nbsp;·&nbsp; ' + (s.cost ? usd(s.cost) + ' per person' : 'no admission charge') + '</p>';
          html += '<button type="button" class="stop-remove" data-day="' + di + '" data-stop="' + si + '">Remove this stop</button>';
          html += '</div></li>';
        });
        html += '</ul>';
        html += '<div class="dayplan__foot">';
        html += '<p class="dayplan__cost">Estimated day ' + day.n + ' cost <strong>' + usd(c.total) + '</strong></p>';
        html += '<p class="dayplan__costnote">Lodging ' + usd(c.lodging) + ' &nbsp;·&nbsp; meals ' + usd(c.meals) + ' &nbsp;·&nbsp; admissions ' + usd(c.activities) + '</p>';
        html += '</div>';
        html += '</article>';
      });

      out.innerHTML = html;

      $$('.stop-remove', out).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var d = Number(btn.getAttribute('data-day'));
          var s = Number(btn.getAttribute('data-stop'));
          if (state.days[d] && state.days[d].stops.length > 1) {
            state.days[d].stops.splice(s, 1);
            store(KEY, { cfg: state.cfg, days: state.days });
            render();
            var head = out.querySelectorAll('.dayplan')[d];
            if (head) head.querySelector('.dayplan__day').focus && head.querySelector('.dayplan__day').focus();
          }
        });
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var cfg = readForm();
      state = build(cfg);
      store(KEY, { cfg: state.cfg, days: state.days });
      render();
      out.setAttribute('tabindex', '-1');
      out.focus({ preventScroll: false });
    });

    var resetBtn = $('#planner-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      state = null;
      try { window.localStorage.removeItem(KEY); } catch (err) { /* storage disabled */ }
      form.reset();
      render();
    });

    var printBtn = $('#planner-print');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

    // Restore a saved plan.
    var saved = store(KEY);
    if (saved && saved.cfg && PLANNER_DATA[saved.cfg.dest]) {
      state = { cfg: saved.cfg, dest: PLANNER_DATA[saved.cfg.dest], days: saved.days };
      $('#p-dest', form).value = saved.cfg.dest;
      if (saved.cfg.start) $('#p-start', form).value = saved.cfg.start;
      $('#p-days', form).value = saved.cfg.days;
      $('#p-travelers', form).value = saved.cfg.travelers;
      $('#p-pace', form).value = saved.cfg.pace;
      $('#p-budget', form).value = saved.cfg.budget;
      $$('input[name="interest"]', form).forEach(function (i) {
        i.checked = saved.cfg.interests.indexOf(i.value) > -1;
      });
    }
    render();
  }());

  /* ---------- 10. Packing checklist ---------- */
  (function checklist() {
    var root = $('#checklist-root');
    if (!root) return;

    var KEY = 'mfg.packing.v1';
    var ticked = store(KEY) || {};

    function count() {
      var boxes = $$('input[type="checkbox"]', root);
      var done = boxes.filter(function (b) { return b.checked; }).length;
      var line = $('#checklist-progress');
      if (line) {
        line.innerHTML = 'Packed <strong>' + done + '</strong> of ' + boxes.length + ' items';
      }
    }

    $$('input[type="checkbox"]', root).forEach(function (box) {
      if (ticked[box.id]) box.checked = true;
      box.addEventListener('change', function () {
        ticked[box.id] = box.checked;
        store(KEY, ticked);
        count();
      });
    });

    var clear = $('#checklist-clear');
    if (clear) clear.addEventListener('click', function () {
      $$('input[type="checkbox"]', root).forEach(function (b) { b.checked = false; });
      ticked = {};
      store(KEY, ticked);
      count();
    });

    var printBtn = $('#checklist-print');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

    // Filter the list by trip type.
    var filter = $('#checklist-filter');
    if (filter) filter.addEventListener('change', function () {
      var value = filter.value;
      $$('[data-trip]', root).forEach(function (group) {
        var trips = group.getAttribute('data-trip').split(' ');
        group.hidden = value !== 'all' && trips.indexOf(value) === -1;
      });
      count();
    });

    count();
  }());

  /* ---------- 11. Trip budget estimator ---------- */
  (function budget() {
    var form = $('#budget-form');
    var out = $('#budget-output');
    if (!form || !out) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nights = Math.max(1, parseInt($('#b-nights').value, 10) || 5);
      var people = Math.max(1, parseInt($('#b-people').value, 10) || 2);
      var airfare = Math.max(0, parseFloat($('#b-airfare').value) || 0);
      var room = Math.max(0, parseFloat($('#b-room').value) || 0);
      var daily = Math.max(0, parseFloat($('#b-daily').value) || 0);
      var car = Math.max(0, parseFloat($('#b-car').value) || 0);

      var rooms = Math.ceil(people / 2);
      var flights = airfare * people;
      var lodging = room * rooms * nights;
      var onGround = daily * people * (nights + 1);
      var transport = car * nights;
      var subtotal = flights + lodging + onGround + transport;
      var buffer = subtotal * 0.12;
      var total = subtotal + buffer;

      out.hidden = false;
      out.innerHTML =
        '<h3>Estimated trip cost</h3>' +
        '<div class="table-scroll"><table><caption>All figures in US dollars for the whole party</caption>' +
        '<thead><tr><th scope="col">Line item</th><th scope="col" class="num">Amount</th></tr></thead><tbody>' +
        '<tr><th scope="row">Airfare, ' + people + ' ' + (people === 1 ? 'ticket' : 'tickets') + '</th><td class="num">' + usd(flights) + '</td></tr>' +
        '<tr><th scope="row">Lodging, ' + rooms + ' ' + (rooms === 1 ? 'room' : 'rooms') + ' for ' + nights + ' nights</th><td class="num">' + usd(lodging) + '</td></tr>' +
        '<tr><th scope="row">Food, admissions and local transit</th><td class="num">' + usd(onGround) + '</td></tr>' +
        '<tr><th scope="row">Rental car or rail pass</th><td class="num">' + usd(transport) + '</td></tr>' +
        '<tr><th scope="row">Contingency at 12 percent</th><td class="num">' + usd(buffer) + '</td></tr>' +
        '</tbody><tfoot><tr><th scope="row">Estimated total</th><td class="num">' + usd(total) + '</td></tr>' +
        '<tr><th scope="row">Per traveler</th><td class="num">' + usd(total / people) + '</td></tr></tfoot></table></div>' +
        '<p class="dayplan__costnote">An estimate, not a quote. We add a 12 percent contingency because baggage fees, tips, parking and one unplanned good dinner are effectively guaranteed.</p>';
      out.setAttribute('tabindex', '-1');
      out.focus();
    });
  }());

  /* ---------- 12. Footer year ---------- */
  (function year() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }());

}());

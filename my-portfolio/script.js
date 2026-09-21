/* ==========================================================================
   PORTFOLIO SCRIPT

   What this file does
   1. Sets the footer year
   2. Dark / light theme button (remembers your choice)
   3. Mobile menu open and close
   4. Header line after scrolling
   5. Highlights the nav link of the section you are viewing
   6. Project filter buttons
   7. Skill bars fill up when they scroll into view
   8. Contact form validation and sending
   9. Typing effect for the hero role line

   Each feature is its own function near the bottom. To turn one off,
   delete or comment out its line in the "START EVERYTHING" part.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     SETTINGS you can edit
     ------------------------------------------------------------------------ */
  var SETTINGS = {
    // The typing effect starts with the role written in index.html,
    // then cycles through these extra roles. Use [] to turn it off.
    extraRoles: ['Freelance Web Developer', 'Problem Solver'],

    typeSpeed: 70,        // milliseconds per letter while typing
    deleteSpeed: 35,      // milliseconds per letter while deleting
    holdTime: 1800,       // how long a finished role stays on screen
    gapTime: 350,         // pause before the next role starts typing

    scrolledAfter: 10,    // pixels scrolled before the header gets its bottom line
    menuBreakpoint: 820,  // must match the phone breakpoint in style.css
    themeKey: 'portfolio-theme'
  };

  /* ------------------------------------------------------------------------
     SMALL HELPERS
     ------------------------------------------------------------------------ */
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ------------------------------------------------------------------------
     1. FOOTER YEAR
     ------------------------------------------------------------------------ */
  function initYear() {
    var el = $('#year');
    if (el) {
      el.textContent = new Date().getFullYear();
    }
  }


  /* ------------------------------------------------------------------------
     2. THEME BUTTON (dark is the default)
     The chosen theme is saved in the browser so it is still there next visit.
     CSS reads <html data-theme="light"> to switch colors.
     ------------------------------------------------------------------------ */
  function initTheme() {
    var button = $('#themeToggle');
    var root = document.documentElement;
    var metaColor = $('meta[name="theme-color"]');
    var barColors = { dark: '#0c1020', light: '#f6f7fb' };

    function getSavedTheme() {
      try {
        return localStorage.getItem(SETTINGS.themeKey);
      } catch (error) {
        return null; // storage blocked, just use the default
      }
    }

    function saveTheme(theme) {
      try {
        localStorage.setItem(SETTINGS.themeKey, theme);
      } catch (error) {
        /* storage blocked: the theme still works, it just won't be remembered */
      }
    }

    function applyTheme(theme) {
      root.setAttribute('data-theme', theme);

      if (metaColor) {
        metaColor.setAttribute('content', barColors[theme]);
      }

      if (button) {
        // The button names the theme you will get when you click it
        var next = theme === 'dark' ? 'light' : 'dark';
        button.textContent = next === 'light' ? 'Light' : 'Dark';
        button.setAttribute('aria-label', 'Switch to ' + next + ' theme');
      }
    }

    applyTheme(getSavedTheme() === 'light' ? 'light' : 'dark');

    if (button) {
      button.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(next);
        saveTheme(next);
      });
    }
  }


  /* ------------------------------------------------------------------------
     3. MOBILE MENU
     Adds/removes .is-open on the nav (style.css shows it as a dropdown).
     ------------------------------------------------------------------------ */
  function initMobileMenu() {
    var toggle = $('#navToggle');
    var nav = $('#primaryNav');
    if (!toggle || !nav) return;

    function isOpen() {
      return nav.classList.contains('is-open');
    }

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    // Button opens and closes the menu
    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });

    // Choosing a link closes the menu
    $$('.nav__link', nav).forEach(function (link) {
      link.addEventListener('click', function () {
        setOpen(false);
      });
    });

    // Escape closes it and puts focus back on the button
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Clicking anywhere outside closes it
    document.addEventListener('click', function (event) {
      if (isOpen() && !nav.contains(event.target) && !toggle.contains(event.target)) {
        setOpen(false);
      }
    });

    // Growing the window to desktop size closes it
    var desktop = window.matchMedia('(min-width: ' + (SETTINGS.menuBreakpoint + 1) + 'px)');
    desktop.addEventListener('change', function (event) {
      if (event.matches) {
        setOpen(false);
      }
    });
  }


  /* ------------------------------------------------------------------------
     4. HEADER LINE AFTER SCROLLING
     ------------------------------------------------------------------------ */
  function initHeaderScroll() {
    var header = $('.site-header');
    if (!header) return;

    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > SETTINGS.scrolledAfter);
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
  }


  /* ------------------------------------------------------------------------
     5. HIGHLIGHT THE NAV LINK OF THE CURRENT SECTION
     A section counts as "current" when it crosses the middle of the screen.
     ------------------------------------------------------------------------ */
  function initScrollSpy() {
    var links = $$('.nav__link');
    var sections = $$('main section[id]');
    if (!links.length || !sections.length || !('IntersectionObserver' in window)) return;

    function setActive(sectionId) {
      links.forEach(function (link) {
        var isCurrent = link.getAttribute('href') === '#' + sectionId;
        link.classList.toggle('is-active', isCurrent);

        if (isCurrent) {
          link.setAttribute('aria-current', 'location');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // The hero has no nav link, so no link matches and all are cleared
          setActive(entry.target.id);
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }


  /* ------------------------------------------------------------------------
     6. PROJECT FILTERS
     Buttons carry data-filter="web", cards carry data-category="web".
     A card can have several categories: data-category="web design".
     ------------------------------------------------------------------------ */
  function initProjectFilters() {
    var buttons = $$('.filter-btn');
    var cards = $$('.project-card');
    if (!buttons.length || !cards.length) return;

    function applyFilter(filter) {
      buttons.forEach(function (button) {
        var isActive = button.getAttribute('data-filter') === filter;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });

      cards.forEach(function (card) {
        var categories = (card.getAttribute('data-category') || '').split(/\s+/);
        var show = filter === 'all' || categories.indexOf(filter) !== -1;
        card.classList.toggle('is-hidden', !show);
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        applyFilter(button.getAttribute('data-filter'));
      });
    });

    applyFilter('all');
  }


  /* ------------------------------------------------------------------------
     7. SKILL BARS FILL WHEN VISIBLE
     Bars start empty and grow to their data-level once they scroll into view.
     ------------------------------------------------------------------------ */
  function initSkillBars() {
    var bars = $$('.skill-bar');
    if (!bars.length || prefersReducedMotion || !('IntersectionObserver' in window)) return;

    function levelOf(bar) {
      var level = parseInt(bar.getAttribute('data-level'), 10) || 0;
      return Math.min(100, Math.max(0, level));
    }

    // Start empty
    bars.forEach(function (bar) {
      bar.style.setProperty('--level', '0%');
    });

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.setProperty('--level', levelOf(entry.target) + '%');
        obs.unobserve(entry.target); // only animate once
      });
    }, { threshold: 0.4 });

    bars.forEach(function (bar) {
      observer.observe(bar);
    });
  }


  /* ------------------------------------------------------------------------
     8. CONTACT FORM
     - Checks name, email and message and shows messages under each field
     - If the form's action is still "#", it only runs the checks (demo mode)
     - If action is a real URL (Formspree, Web3Forms...), it sends the message
     ------------------------------------------------------------------------ */
  function initContactForm() {
    var form = $('#contactForm');
    if (!form) return;

    var status = $('#formStatus');
    var submitButton = $('button[type="submit"]', form);
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    // One entry per field: the input, where its error text goes, and its rule.
    // A rule returns an error message, or '' when the value is fine.
    var fields = [
      {
        input: $('#name'),
        error: $('#nameError'),
        check: function (value) {
          return value.length >= 2 ? '' : 'Please enter your name (at least 2 characters).';
        }
      },
      {
        input: $('#email'),
        error: $('#emailError'),
        check: function (value) {
          if (!value) return 'Please enter your email address.';
          return emailPattern.test(value) ? '' : 'That email address does not look right. Example: name@example.com';
        }
      },
      {
        input: $('#message'),
        error: $('#messageError'),
        check: function (value) {
          return value.length >= 10 ? '' : 'Please write a message of at least 10 characters.';
        }
      }
    ].filter(function (field) {
      return field.input && field.error;
    });

    function setStatus(text, type) {
      if (!status) return;
      status.textContent = text;
      status.classList.remove('is-success', 'is-error');
      if (type) {
        status.classList.add('is-' + type);
      }
    }

    // Returns true when the field is valid, and shows or clears its error
    function validate(field) {
      var message = field.check(field.input.value.trim());
      var wrapper = field.input.closest('.form-field');

      field.error.textContent = message;
      field.input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (wrapper) {
        wrapper.classList.toggle('has-error', Boolean(message));
      }
      return !message;
    }

    fields.forEach(function (field) {
      // Link the error text to the input for screen readers
      field.input.setAttribute('aria-describedby', field.error.id);

      // Check when the user leaves the field
      field.input.addEventListener('blur', function () {
        validate(field);
      });

      // After an error, re-check while typing so it disappears as soon as it is fixed
      field.input.addEventListener('input', function () {
        var wrapper = field.input.closest('.form-field');
        if (wrapper && wrapper.classList.contains('has-error')) {
          validate(field);
        }
      });
    });

    // Typing again clears an old success/failure message
    form.addEventListener('input', function () {
      setStatus('', '');
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      setStatus('', '');

      // Check every field and remember the first bad one
      var firstInvalid = null;
      fields.forEach(function (field) {
        if (!validate(field) && !firstInvalid) {
          firstInvalid = field.input;
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      var action = form.getAttribute('action');

      // Demo mode: no form service connected yet
      if (!action || action === '#') {
        setStatus(
          'The form works, but nothing was sent because no form service is connected yet. ' +
          'Put a Formspree or Web3Forms URL in the form\'s action attribute to receive messages.',
          'success'
        );
        form.reset();
        return;
      }

      // Real sending
      var originalLabel = submitButton ? submitButton.textContent : '';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
      }

      fetch(action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Request failed with status ' + response.status);
          }
          setStatus('Thanks! Your message has been sent.', 'success');
          form.reset();
        })
        .catch(function () {
          setStatus('Something went wrong and your message was not sent. Please try again, or email me directly.', 'error');
        })
        .then(function () {
          // Runs after success or failure
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalLabel;
          }
        });
    });
  }


  /* ------------------------------------------------------------------------
     9. TYPING EFFECT FOR THE HERO ROLE LINE
     Starts with the text from index.html, deletes it, types the next role, etc.
     Skipped when the visitor has "reduce motion" turned on.
     ------------------------------------------------------------------------ */
  function initTyping() {
    var element = $('#heroRole');
    if (!element || prefersReducedMotion || !SETTINGS.extraRoles.length) return;

    var roles = [element.textContent.trim()].concat(SETTINGS.extraRoles);
    var roleIndex = 0;
    var charCount = roles[0].length;   // the first role is already fully shown
    var deleting = false;

    // Keep the line's height fixed so the page below does not jump around
    element.style.minHeight = element.offsetHeight + 'px';
    element.classList.add('is-typing');

    function tick() {
      var current = roles[roleIndex];
      var delay;

      if (!deleting) {
        if (charCount < current.length) {
          charCount += 1;
          delay = SETTINGS.typeSpeed;
        } else {
          deleting = true;             // fully typed: hold, then start deleting
          delay = SETTINGS.holdTime;
        }
      } else if (charCount > 0) {
        charCount -= 1;
        delay = SETTINGS.deleteSpeed;
      } else {
        deleting = false;              // fully deleted: move on to the next role
        roleIndex = (roleIndex + 1) % roles.length;
        delay = SETTINGS.gapTime;
      }

      // A zero-width space keeps the line from collapsing when it is empty
      element.textContent = roles[roleIndex].slice(0, charCount) || '\u200B';
      setTimeout(tick, delay);
    }

    setTimeout(tick, 0);
  }


  /* ------------------------------------------------------------------------
     START EVERYTHING
     ------------------------------------------------------------------------ */
  initYear();
  initTheme();
  initMobileMenu();
  initHeaderScroll();
  initScrollSpy();
  initProjectFilters();
  initSkillBars();
  initContactForm();
  initTyping();
})();
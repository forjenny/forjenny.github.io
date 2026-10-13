/* Top-navigation behaviour shared by every page: the mobile menu, the account
   dropdown and the announcement close button. Kept separate from app.js so the
   placeholder pages can use it without loading the whole feed. */

(function () {
  'use strict';

  function initNav() {
    var nav = document.querySelector('.nav');
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('#primary-links');
    var userWrap = document.querySelector('.user-wrap');
    var userTrigger = document.querySelector('.user-trigger');

    function closeMenu() {
      if (!nav || !toggle) return;
      nav.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }

    function closeDropdown() {
      if (!userWrap || !userTrigger) return;
      userWrap.classList.remove('dropdown-open');
      userTrigger.setAttribute('aria-expanded', 'false');
    }

    if (nav && toggle && links) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });

      links.addEventListener('click', function (event) {
        if (event.target.closest('.link')) closeMenu();
      });
    }

    if (userWrap && userTrigger) {
      userTrigger.addEventListener('click', function () {
        var open = userWrap.classList.toggle('dropdown-open');
        userTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      document.addEventListener('click', function (event) {
        if (!userWrap.contains(event.target)) closeDropdown();
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      closeMenu();
      closeDropdown();
    });

    /* The announcement's close button should actually dismiss the banner. */
    var banner = document.querySelector('.announcement-banner');
    var bannerClose = document.querySelector('.announcement-close');
    if (banner && bannerClose) {
      bannerClose.addEventListener('click', function () {
        banner.style.display = 'none';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();

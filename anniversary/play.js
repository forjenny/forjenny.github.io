/* Music shell — keeps ss.mp3 playing (looped, 35%) while the framed site
   navigates. The audio lives in this document, which never navigates, so it
   runs continuously no matter which page the visitor browses to. */

(function () {
  'use strict';

  var audio = document.getElementById('bg-music');
  var frame = document.getElementById('pageFrame');
  var toggle = document.getElementById('musicToggle');

  if (!audio) return;

  audio.volume = 0.35;
  audio.loop = true;

  /* If autoplay is blocked, start on the first interaction — in this document
     or inside the framed page. */
  function bindGesture(doc) {
    if (!doc || doc.__musicArmed) return;
    doc.__musicArmed = true;

    ['pointerdown', 'keydown', 'touchstart'].forEach(function (type) {
      doc.addEventListener(
        type,
        function () {
          audio.play().catch(function () {});
        },
        { once: true }
      );
    });
  }

  function play() {
    var promise = audio.play();

    if (promise && typeof promise.catch === 'function') {
      promise.catch(function () {
        bindGesture(document);
        bindGesture(frame && frame.contentDocument);
      });
    }
  }

  play();

  if (frame) {
    frame.addEventListener('load', function () {
      if (audio.paused) {
        play();
      } else {
        bindGesture(frame.contentDocument);
      }
    });
  }

  if (toggle) {
    function syncToggle() {
      var playing = !audio.paused;
      toggle.textContent = playing ? '🔊' : '🔇';
      toggle.setAttribute('aria-pressed', playing ? 'false' : 'true');
      toggle.setAttribute('aria-label', playing ? 'Mute music' : 'Play music');
    }

    toggle.addEventListener('click', function () {
      if (audio.paused) {
        audio.play().catch(function () {});
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play', syncToggle);
    audio.addEventListener('pause', syncToggle);

    syncToggle();
  }
})();

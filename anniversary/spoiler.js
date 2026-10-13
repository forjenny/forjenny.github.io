/* Reusable "spoiler" component — a small chip that reveals hidden content
   when clicked, with a close button to hide it again.

   Usage:
     mount.appendChild(createSpoiler('<img src="../assets/pic.jpg" alt="" />'));

   `children` may be an HTML string, a Node, or an array of either, so any
   text or image can be wrapped later. */

(function (global) {
  'use strict';

  function toNodes(children) {
    if (children === null || children === undefined) return [];

    if (typeof children === 'string') {
      var template = document.createElement('template');
      template.innerHTML = children;
      return Array.prototype.slice.call(template.content.childNodes);
    }

    if (children instanceof Node) return [children];

    if (Array.isArray(children)) {
      return children.reduce(function (nodes, child) {
        return nodes.concat(toNodes(child));
      }, []);
    }

    return [];
  }

  function createSpoiler(children) {
    var root = document.createElement('div');
    root.className = 'spoiler';

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'spoiler-toggle';
    toggle.textContent = 'Spoiler, click to view';
    toggle.setAttribute('aria-expanded', 'false');

    var body = document.createElement('div');
    body.className = 'spoiler-body';

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'spoiler-close';
    close.setAttribute('aria-label', 'Close spoiler');
    close.textContent = '\u00d7';

    toNodes(children).forEach(function (node) {
      body.appendChild(node);
    });
    body.appendChild(close);

    function setOpen(isOpen) {
      root.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      if (isOpen) close.focus();
      else toggle.focus();
    }

    toggle.addEventListener('click', function () {
      setOpen(true);
    });

    close.addEventListener('click', function () {
      setOpen(false);
    });

    root.appendChild(toggle);
    root.appendChild(body);

    return root;
  }

  global.createSpoiler = createSpoiler;
})(window);

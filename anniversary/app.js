/* ==========================================================================
   Anniversary feed — rendering + cinematic timeline
   ========================================================================== */

(function () {
  'use strict';

  var SLIDE_MS = 500; // matches the .tween-in / slide-down duration
  var STEP_MS = 1500; // gap between streamed posts
  var FINAL_PAUSE_MS = 2000; // pause before Jenny's special post
  var TYPE_MS = 50; // one character per tick while Photon "types"
  var POST_PAUSE_MS = 1000; // pause after typing before the reply is posted
  var GLOW_DELAY_MS = 2000; // delay before Reeze's reply button starts glowing
  var RTE_START_DELAY_MS = 1000; // pause before Photon starts typing in the editor

  /* The reply Photon types out. */
  var REPLY_TEXT =
    'yeah college is actually so different from how teachers made it seem in high school; ' +
    "like half the time, they don't care if you show up to lecture or are distracted, " +
    "as long as you're not actively interrupting the class lol" +
    '\n\n' +
    'but the profs that are hella lenient on deadlines are the best!';

  /* Photon's avatar, shared by the reply composer and the posted reply. */
  var PHOTON_AVATAR = '../assets/photon-current.png';

  /* Inline SVG icons (kept out of the HTML so cards can be built in JS). */
  var ICONS = {
    bell:
      '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="bell" ' +
      'role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" ' +
      'class="svg-inline--fa fa-bell fa-w-14 fa-sm">' +
      '<path fill="currentColor" d="M224 512c35.32 0 63.97-28.65 63.97-64H160.03c0 35.35 28.65 64 63.97 64zm215.39-149.71c-19.32-20.76-55.47-51.99-55.47-154.29 0-77.7-54.48-139.9-127.94-155.16V32c0-17.67-14.32-32-31.98-32s-31.98 14.33-31.98 32v20.84C118.56 68.1 64.08 130.3 64.08 208c0 102.3-36.15 133.53-55.47 154.29-6 6.45-8.66 14.16-8.61 21.71.11 16.4 12.98 32 32.1 32h383.8c19.12 0 32-15.6 32.1-32 .05-7.55-2.61-15.27-8.61-21.71z"></path>' +
      '</svg>',

    ellipsis:
      '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="ellipsis-h" ' +
      'role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" ' +
      'class="svg-inline--fa fa-ellipsis-h fa-w-16 fa-sm">' +
      '<path fill="currentColor" d="M328 256c0 39.8-32.2 72-72 72s-72-32.2-72-72 32.2-72 72-72 72 32.2 72 72zm104-72c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72zm-352 0c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72z"></path>' +
      '</svg>',

    replies:
      '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="comments" ' +
      'role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" ' +
      'class="svg-inline--fa fa-comments fa-w-18 fa-sm">' +
      '<path fill="currentColor" d="M416 192c0-88.4-93.1-160-208-160S0 103.6 0 192c0 34.3 14.1 65.9 38 92-13.4 30.2-35.5 54.2-35.8 54.5-2.2 2.3-2.8 5.7-1.5 8.7S4.8 352 8 352c36.6 0 66.9-12.3 88.7-25 32.2 15.7 70.3 25 111.3 25 114.9 0 208-71.6 208-160zm122 220c23.9-26 38-57.7 38-92 0-66.9-53.5-124.2-129.3-148.1.9 6.6 1.3 13.3 1.3 20.1 0 105.9-107.7 192-240 192-10.8 0-21.3-.8-31.7-1.9C207.8 439.6 281.8 480 368 480c41 0 79.1-9.2 111.3-25 21.8 12.7 52.1 25 88.7 25 3.2 0 6.1-1.9 7.3-4.8 1.3-2.9.7-6.3-1.5-8.7-.3-.3-22.4-24.2-35.8-54.5z"></path>' +
      '</svg>',

    heart:
      '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="heart" ' +
      'role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" ' +
      'class="svg-inline--fa fa-heart fa-w-16 fa-sm heart-icon">' +
      '<path fill="currentColor" d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"></path>' +
      '</svg>',

    eye:
      '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="eye" ' +
      'role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" ' +
      'class="svg-inline--fa fa-eye fa-w-18 fa-sm">' +
      '<path fill="currentColor" d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"></path>' +
      '</svg>',
  };

  /* Escape user text so it can never break the card markup. */
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* Render a count span, or nothing when the count is zero. */
  function countSpan(value) {
    var count = Number(value) || 0;
    if (count <= 0) return '';
    return '<span class="count">' + escapeHtml(count) + '</span>';
  }

  /* Render a post's body — the default markdown paragraph, or (for a "media"
     post) a centered bold header, a full-width image and a centered body. */
  function buildPostBody(post) {
    if (post.postType === 'media') {
      return (
        '<div class="text">' +
        '<div class="media-header">' +
        escapeHtml(post.headerText) +
        '</div>' +
        '<img class="media-image" src="' +
        escapeHtml(post.imageUrl) +
        '" alt="" loading="lazy" />' +
        '<div class="media-body">' +
        escapeHtml(post.text) +
        '</div>' +
        '</div>'
      );
    }

    return (
      '<div class="text">' +
      '<div class="activity-markdown"><p>' +
      escapeHtml(post.text) +
      '</p></div>' +
      '</div>'
    );
  }

  /* Build one .activity-entry card. */
  function buildPost(post) {
    return (
      '<article class="activity-entry">' +
      '<div class="wrap">' +
      '<header class="header">' +
      '<span class="user-info">' +
      '<div class="avatar">' +
      '<img src="' +
      escapeHtml(post.avatarUrl) +
      '" alt="' +
      escapeHtml(post.username) +
      '" loading="lazy" />' +
      '</div>' +
      '<span class="name">' +
      escapeHtml(post.username) +
      '</span>' +
      '</span>' +
      '<span class="time-wrap">' +
      '<span class="time-icons">' +
      '<span class="time-icon">' +
      ICONS.bell +
      '</span>' +
      '<span class="time-icon">' +
      ICONS.ellipsis +
      '</span>' +
      '</span>' +
      '<span class="time-text">' +
      escapeHtml(post.timestamp) +
      '</span>' +
      '</span>' +
      '</header>' +
      buildPostBody(post) +
      '<div class="actions">' +
      '<button class="action replies" type="button">' +
      countSpan(post.comments) +
      ICONS.replies +
      '</button>' +
      '<button class="action likes' +
      (post.liked ? ' liked' : '') +
      '" type="button">' +
      countSpan(post.likes) +
      ICONS.heart +
      '</button>' +
      '</div>' +
      '</div>' +
      '</article>'
    );
  }

  /* Render an array of posts into the .activity-feed container, leaving the
     static header/status box at the top untouched. */
  function renderPosts(posts) {
    var feed = document.querySelector('.activity-feed');
    if (!feed) return;

    Array.prototype.slice.call(feed.querySelectorAll('.activity-entry')).forEach(
      function (node) {
        node.parentNode.removeChild(node);
      }
    );

    posts.forEach(function (post) {
      feed.appendChild(createCard(post));
    });
  }

  /* Build a detached card element from a post object. */
  function createCard(post) {
    var holder = document.createElement('div');
    holder.innerHTML = buildPost(post);
    return holder.firstElementChild;
  }

  /* Smoothly slide the cards that were already in the feed down to make room.
     (FLIP: measure before, insert, measure after, animate the delta.) */
  function slideExistingDown(existing, firstTops) {
    existing.forEach(function (node, i) {
      var lastTop = node.getBoundingClientRect().top;
      var delta = firstTops[i] - lastTop;

      if (!delta) return;

      // Snap to the old spot with no transition...
      node.style.transition = 'none';
      node.style.transform = 'translateY(' + delta + 'px)';

      // ...force a reflow so the browser commits that state...
      void node.offsetHeight;

      // ...then release it and let the CSS transition carry it into place.
      node.style.transition = 'transform ' + SLIDE_MS + 'ms ease';
      node.style.transform = '';
    });
  }

  /* Prepend one post to the top of the post list (below the static header and
     status box). Animates by default; pass `false` to render it instantly
     (used when reconstructing the final state on a repeat visit). */
  function prependPost(post, animate) {
    if (animate === undefined) animate = true;

    var feed = document.querySelector('.activity-feed');
    if (!feed) return null;

    var firstPost = feed.querySelector('.activity-entry');
    var card = createCard(post);

    if (animate) {
      var existing = Array.prototype.slice.call(
        feed.querySelectorAll('.activity-entry')
      );
      var firstTops = existing.map(function (node) {
        return node.getBoundingClientRect().top;
      });

      card.classList.add('tween-in');

      if (firstPost) {
        feed.insertBefore(card, firstPost);
      } else {
        feed.appendChild(card);
      }

      slideExistingDown(existing, firstTops);
    } else if (firstPost) {
      feed.insertBefore(card, firstPost);
    } else {
      feed.appendChild(card);
    }

    return card;
  }

  /* Insert a new post directly below an existing card (threaded reply). The
     cards underneath still glide down, and the new card tweens in. */
  function insertPostAfter(post, anchor) {
    var feed = document.querySelector('.activity-feed');
    if (!feed || !anchor) return null;

    var existing = Array.prototype.slice.call(
      feed.querySelectorAll('.activity-entry')
    );
    var firstTops = existing.map(function (node) {
      return node.getBoundingClientRect().top;
    });

    var card = createCard(post);
    card.classList.add('tween-in');
    anchor.insertAdjacentElement('afterend', card);

    slideExistingDown(existing, firstTops);

    return card;
  }

  /* ------------------------------------------------------------------ */
  /* Narrative session flag                                              */
  /* ------------------------------------------------------------------ */

  function narrativePlayed() {
    try {
      return sessionStorage.getItem('narrativePlayed') === 'true';
    } catch (error) {
      return false;
    }
  }

  function markNarrativePlayed() {
    try {
      sessionStorage.setItem('narrativePlayed', 'true');
    } catch (error) {
      /* private mode / storage disabled — just play it every time */
    }
  }

  /* ------------------------------------------------------------------ */
  /* Photon's threaded reply                                             */
  /* ------------------------------------------------------------------ */

  /* Build the "thread" under a post: Photon's reply card + the cosmetic
     "Write a reply..." box, then graduate the reply button to a toggle.
     `animate` runs the FLIP slide + tween (used by the live publish flow). */
  function attachReplyThread(card, animate) {
    if (!card || card._replyThread) return;

    var replyCard = createCard({
      username: 'Photon',
      avatarUrl: PHOTON_AVATAR,
      text: REPLY_TEXT,
      timestamp: 'just now',
      likes: 0,
      comments: 0,
    });
    replyCard.classList.add('threaded-reply');
    if (animate) replyCard.classList.add('tween-in');

    var replyBox = document.createElement('div');
    replyBox.className = 'threaded-reply-box';
    replyBox.textContent = 'Write a reply...';

    var thread = document.createElement('div');
    thread.className = 'reply-thread';
    thread.appendChild(replyCard);
    thread.appendChild(replyBox);

    if (animate) {
      var feed = document.querySelector('.activity-feed');
      var existing = feed
        ? Array.prototype.slice.call(feed.querySelectorAll('.activity-entry'))
        : [];
      var firstTops = existing.map(function (node) {
        return node.getBoundingClientRect().top;
      });

      card.insertAdjacentElement('afterend', thread);
      slideExistingDown(existing, firstTops);
    } else {
      card.insertAdjacentElement('afterend', thread);
    }

    /* Keep a reference so the reply button can toggle the whole thread. */
    card._replyThread = thread;

    /* The reply button graduates from "glowing" to a collapse/expand toggle. */
    card.dataset.replyState = 'toggle';
    card.dataset.replyCollapsed = 'false';

    var replyButton = card.querySelector('.action.replies');
    if (replyButton) {
      replyButton.classList.remove('glow-reply');
      replyButton.setAttribute('title', 'Toggle replies');
      replyButton.setAttribute('aria-label', 'Toggle replies');

      /* this post gained a reply — bump its reply count by one */
      var replyCount = replyButton.querySelector('.count');
      if (replyCount) {
        replyCount.textContent = (parseInt(replyCount.textContent, 10) || 0) + 1;
      } else {
        replyCount = document.createElement('span');
        replyCount.className = 'count';
        replyCount.textContent = '1';
        replyButton.insertBefore(replyCount, replyButton.firstChild);
      }
    }
  }

  /* Jump straight to the end of the story (used for repeat visits). */
  function renderFinalState() {
    /* Re-add the streamed posts (instantly, no tween), then Reeze on top. */
    timelineEvents.forEach(function (post) {
      prependPost(post, false);
    });

    var card = prependPost(reezeSpecialPost, false);
    if (!card) return;

    initReezeReply(card);
    attachReplyThread(card, false);
  }

  /* Stream the timeline: 3 posts one at a time, then Reeze's special post.
     Two seconds after Reeze's post lands, her reply button starts glowing.
     Runs once per tab session — afterwards the final state is shown directly. */
  function startTimeline() {
    if (narrativePlayed()) {
      renderFinalState();
      return;
    }

    var elapsed = 0;

    timelineEvents.forEach(function (post) {
      elapsed += STEP_MS;
      setTimeout(function () {
        prependPost(post);
      }, elapsed);
    });

    setTimeout(function () {
      var card = prependPost(reezeSpecialPost);

      if (!card) return;

      card.dataset.replyState = 'glowing';
      initReezeReply(card);

      setTimeout(function () {
        if (card.dataset.replyState !== 'glowing') return;

        var replyButton = card.querySelector('.action.replies');
        if (replyButton) replyButton.classList.add('glow-reply');
      }, GLOW_DELAY_MS);

      /* the story has played out — remember it for the rest of the session */
      markNarrativePlayed();
    }, elapsed + FINAL_PAUSE_MS);
  }

  /* ------------------------------------------------------------------ */
  /* Reeze's post — reply editor + Photon typing simulation             */
  /* ------------------------------------------------------------------ */

  var MD_TOOLS = [
    {
      title: 'Bold',
      svg: '<path d="M6 4h7a4 4 0 0 1 0 8H6z"/><path d="M6 12h8a4 4 0 0 1 0 8H6z"/>',
    },
    {
      title: 'Italic',
      svg: '<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>',
    },
    {
      title: 'Underline',
      svg: '<path d="M6 3v7a6 6 0 0 0 12 0V3"/><line x1="4" y1="21" x2="20" y2="21"/>',
    },
    {
      title: 'Strikethrough',
      svg: '<path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/>',
    },
    {
      title: 'Insert link',
      svg: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    },
    {
      title: 'Insert image',
      svg: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    },
    {
      title: 'Video',
      svg: '<rect x="2" y="6" width="13" height="12" rx="2"/><path d="M15 10l6-3v10l-6-3z"/>',
    },
    {
      title: 'Bullet list',
      svg: '<line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="4" cy="18" r="1.5"/>',
    },
    {
      title: 'Ordered list',
      svg: '<line x1="11" y1="6" x2="21" y2="6"/><line x1="11" y1="12" x2="21" y2="12"/><line x1="11" y1="18" x2="21" y2="18"/><text x="2.5" y="9" font-size="8" fill="currentColor" stroke="none">1</text>',
    },
    {
      title: 'Align left',
      svg: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>',
    },
    {
      title: 'Align center',
      svg: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>',
    },
    {
      title: 'Quote',
      svg: '<path d="M6 8h3v3a4 4 0 0 1-4 4z"/><path d="M15 8h3v3a4 4 0 0 1-4 4z"/>',
    },
    {
      title: 'Code',
      svg: '<polyline points="8 6 3 12 8 18"/><polyline points="16 6 21 12 16 18"/>',
    },
  ];

  var RTE_HTML =
    '<div class="input">' +
    '<div class="el-textarea">' +
    '<div class="markdown-editor">' +
    MD_TOOLS.map(function (tool) {
      return (
        '<div class="md-tool" title="' +
        tool.title +
        '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
        'aria-hidden="true">' +
        tool.svg +
        '</svg>' +
        '</div>'
      );
    }).join('') +
    '</div>' +
    '<textarea class="el-textarea__inner" placeholder="Write a reply..."></textarea>' +
    '</div>' +
    '<div class="preview-label">Preview:</div>' +
    '<div class="markdown-preview-card">' +
    '<div class="preview-header">' +
    '<div class="preview-avatar"></div>' +
    '<div class="preview-username">Photon</div>' +
    '</div>' +
    '<div class="preview-text"></div>' +
    '</div>' +
    '<div class="actions">' +
    '<div class="rules-notice">Please read the site guidelines before posting</div>' +
    '<div class="button-row">' +
    '<button class="button cancel" type="button">Cancel</button>' +
    '<button class="button publish" type="button">Publish</button>' +
    '</div>' +
    '</div>' +
    '</div>';

  function initReezeReply(card) {
    var replyButton = card.querySelector('.action.replies');
    if (!replyButton) return;

    replyButton.addEventListener('click', function () {
      var state = card.dataset.replyState;

      /* Phase 2 — RTE open / Photon is typing: ignore clicks. */
      if (state === 'active') return;

      /* Phase 3 — reply posted: the button toggles the thread. */
      if (state === 'toggle') {
        var collapsed = card.dataset.replyCollapsed === 'true';
        var willCollapse = !collapsed;
        var thread = card._replyThread;

        if (thread) thread.classList.toggle('collapsed', willCollapse);

        card.dataset.replyCollapsed = willCollapse ? 'true' : 'false';
        replyButton.classList.toggle('thread-collapsed', willCollapse);
        return;
      }

      /* Phase 1 — glowing (or untouched): start the reply flow. */
      card.dataset.replyState = 'active';
      replyButton.classList.remove('glow-reply');
      openReplyEditor(card);
    });
  }

  function openReplyEditor(card) {
    var wrap = card.querySelector('.wrap');
    var actions = card.querySelector('.actions');
    if (!wrap || !actions || wrap.querySelector('.reply-editor')) return;

    var editor = document.createElement('div');
    editor.className = 'reply-editor';
    editor.innerHTML = RTE_HTML;
    wrap.insertBefore(editor, actions);

    var textarea = editor.querySelector('.el-textarea__inner');
    var previewText = editor.querySelector('.preview-text');
    var publishButton = editor.querySelector('.button.publish');
    var cancelButton = editor.querySelector('.button.cancel');

    var cancelled = false;
    var timer = null;

    function closeEditor() {
      if (timer) clearInterval(timer);
      if (editor.parentNode) editor.parentNode.removeChild(editor);
    }

    function cancel() {
      cancelled = true;
      closeEditor();
    }

    function publish() {
      cancelled = true;
      closeEditor();

      attachReplyThread(card, true);
      markNarrativePlayed();
    }

    cancelButton.addEventListener('click', cancel);
    publishButton.addEventListener('click', publish);

    /* After the editor appears, wait, then Photon "types" the reply. */
    setTimeout(function () {
      if (cancelled) return;

      var i = 0;

      timer = setInterval(function () {
        if (cancelled) {
          clearInterval(timer);
          return;
        }

        if (i >= REPLY_TEXT.length) {
          clearInterval(timer);
          timer = null;

          /* let the finished text sit for a moment, then auto-publish */
          setTimeout(function () {
            if (!cancelled) publishButton.click();
          }, POST_PAUSE_MS);
          return;
        }

        textarea.value += REPLY_TEXT.charAt(i);
        if (previewText) previewText.textContent = textarea.value;
        textarea.scrollTop = textarea.scrollHeight;
        i += 1;
      }, TYPE_MS);
    }, RTE_START_DELAY_MS);
  }

  /* ------------------------------------------------------------------ */
  /* Sidebar — favourite anime (AniList API)                            */
  /* ------------------------------------------------------------------ */

  var ANILIST_ENDPOINT = 'https://graphql.anilist.co';

  /* The grid is a fixed 5 columns x 4 rows, so never render more than 20. */
  var ANIME_GRID_LIMIT = 20;

  /* AniList has no "FAVOURITES" MediaListStatus, so favourites are pulled
     straight off the user and enriched with the progress from their
     MediaListCollection. `type` is ANIME or MANGA; `countField` is the total
     field on Media ("episodes" / "chapters"). */
  function favouritesQuery(type, countField) {
    return [
      'query ($userId: Int) {',
      '  User(id: $userId) {',
      '    favourites {',
      '      ' + type.toLowerCase() + '(perPage: 50) {',
      '        nodes {',
      '          id',
      '          title { userPreferred }',
      '          coverImage { large }',
      '          ' + countField,
      '        }',
      '      }',
      '    }',
      '  }',
      '  MediaListCollection(userId: $userId, type: ' + type + ') {',
      '    lists {',
      '      entries {',
      '        progress',
      '        media { id }',
      '      }',
      '    }',
      '  }',
      '}',
    ].join('\n');
  }

  /* Fisher-Yates shuffle (returns a new array). */
  function shuffle(array) {
    var result = array.slice();

    for (var i = result.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = result[i];
      result[i] = result[j];
      result[j] = tmp;
    }

    return result;
  }

  /* Fetch one user's favourites of a given media type, with progress pulled
     from their media list. Returns normalised cards:
     { title, cover, total, progress, unit }. */
  async function fetchUserFavourites(userId, type, countField, unit) {
    var response = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: favouritesQuery(type, countField),
        variables: { userId: userId },
      }),
    });

    if (!response.ok) {
      throw new Error('AniList request failed (' + response.status + ')');
    }

    var payload = await response.json();
    if (payload.errors && payload.errors.length) {
      throw new Error(payload.errors[0].message);
    }

    var collection = payload.data && payload.data.User && payload.data.User.favourites;
    var key = type.toLowerCase();
    var nodes = (collection && collection[key] && collection[key].nodes) || [];

    /* media id -> progress, taken from the user's list. */
    var progressById = {};
    var lists =
      (payload.data &&
        payload.data.MediaListCollection &&
        payload.data.MediaListCollection.lists) ||
      [];

    lists.forEach(function (list) {
      (list.entries || []).forEach(function (entry) {
        if (entry && entry.media) {
          progressById[entry.media.id] = entry.progress;
        }
      });
    });

    return nodes.map(function (node) {
      var progress = progressById[node.id];

      return {
        title: (node.title && node.title.userPreferred) || '',
        cover: (node.coverImage && node.coverImage.large) || '',
        total: node[countField] == null ? null : Number(node[countField]),
        progress: typeof progress === 'number' ? progress : 0,
        unit: unit,
      };
    });
  }

  /* Fetch both users' anime favourites in parallel, merge, then shuffle. */
  async function fetchFavoriteAnime() {
    var lists = await Promise.all([
      fetchUserFavourites(REEZE_ID, 'ANIME', 'episodes', 'Ep'),
      fetchUserFavourites(PHOTON_ID, 'ANIME', 'episodes', 'Ep'),
    ]);

    return shuffle(lists[0].concat(lists[1]));
  }

  /* Same, but for manga (chapters instead of episodes). */
  async function fetchFavoriteManga() {
    var lists = await Promise.all([
      fetchUserFavourites(REEZE_ID, 'MANGA', 'chapters', 'Ch'),
      fetchUserFavourites(PHOTON_ID, 'MANGA', 'chapters', 'Ch'),
    ]);

    return shuffle(lists[0].concat(lists[1]));
  }

  function buildMediaCard(item) {
    var total = item.total == null ? null : Number(item.total);
    var progress = Number(item.progress) || 0;
    var unit = item.unit || 'Ep';
    var complete = total !== null && progress >= total;

    var label = complete
      ? 'Completed!'
      : total !== null
      ? unit + ' ' + progress + ' / ' + total
      : unit + ' ' + progress;

    var attrs =
      ' data-progress="' +
      escapeHtml(progress) +
      '" data-unit="' +
      escapeHtml(unit) +
      '"' +
      (total !== null ? ' data-total="' + escapeHtml(total) + '"' : '');

    return (
      '<div class="media-preview-card' +
      (complete ? ' is-complete' : '') +
      '" style="background-image: url(\'' +
      escapeHtml(item.cover) +
      '\')"' +
      attrs +
      ' title="' +
      escapeHtml(item.title) +
      '">' +
      '<button class="media-preview-add" type="button" aria-label="Increment progress">' +
      '+' +
      '</button>' +
      '<div class="media-preview-overlay">' +
      '<span class="media-preview-episode">' +
      escapeHtml(label) +
      '</span>' +
      '</div>' +
      '</div>'
    );
  }

  /* One delegated listener per grid handles every card's "+" button. The
     update is local to the DOM only — AniList would need auth to persist it. */
  function handleGridClick(event) {
    var button = event.target.closest('.media-preview-add');
    if (!button) return;

    var card = button.closest('.media-preview-card');
    if (!card || card.classList.contains('is-complete')) return;

    var hasTotal = card.dataset.total !== undefined && card.dataset.total !== '';
    var total = hasTotal ? Number(card.dataset.total) : null;
    var unit = card.dataset.unit || 'Ep';
    var progress = (Number(card.dataset.progress) || 0) + 1;
    card.dataset.progress = progress;

    var label = card.querySelector('.media-preview-episode');

    if (total !== null && progress >= total) {
      card.classList.add('is-complete');
      if (label) label.textContent = 'Completed!';
    } else if (label) {
      label.textContent =
        total !== null
          ? unit + ' ' + progress + ' / ' + total
          : unit + ' ' + progress;
    }
  }

  /* Fill a grid with up to 20 cards (5 columns x 4 rows). */
  function renderMediaGrid(grid, items) {
    if (!grid) return;

    grid.innerHTML = (items || [])
      .slice(0, ANIME_GRID_LIMIT)
      .map(buildMediaCard)
      .join('');
  }

  function renderAnimeInProgress(items) {
    renderMediaGrid(document.querySelector('.list-preview'), items);
  }

  function renderMangaInProgress(items) {
    renderMediaGrid(document.querySelector('#manga-progress-grid'), items);
  }

  /* ------------------------------------------------------------------ */
  /* Sidebar — Forum Activity                                            */
  /* ------------------------------------------------------------------ */

  function forumTag(label, color) {
    var style = color
      ? ' style="background-color: ' + escapeHtml(color) + '"'
      : '';
    return '<span class="category"' + style + '>' + escapeHtml(label) + '</span>';
  }

  function buildForumTags(item) {
    if (item.tags && item.tags.length) {
      return item.tags
        .map(function (tag) {
          return forumTag(tag.label, tag.color);
        })
        .join('');
    }

    return item.category ? forumTag(item.category, item.categoryColor) : '';
  }

  function buildForumCard(item) {
    return (
      '<div class="forum-card">' +
      '<div class="forum-card-top">' +
      '<div class="forum-title">' +
      escapeHtml(item.title) +
      '</div>' +
      '<div class="forum-stats">' +
      '<span class="forum-stat">' +
      ICONS.eye +
      escapeHtml(item.views) +
      '</span>' +
      '<span class="forum-stat">' +
      ICONS.replies +
      escapeHtml(item.replies) +
      '</span>' +
      '</div>' +
      '</div>' +
      (item.summary
        ? '<div class="forum-summary">' + escapeHtml(item.summary) + '</div>'
        : '') +
      '<div class="forum-footer">' +
      '<span class="forum-author">' +
      '<span class="forum-avatar" style="background-image: url(\'' +
      escapeHtml(item.replierAvatar) +
      '\')"></span>' +
      '<span class="forum-replier">' +
      escapeHtml(item.replier) +
      '</span>' +
      '<span class="forum-replied">replied</span>' +
      '<span class="forum-reply-time">' +
      escapeHtml(item.replyTime) +
      '</span>' +
      '</span>' +
      '<span class="forum-tags">' +
      buildForumTags(item) +
      '</span>' +
      '</div>' +
      '</div>'
    );
  }

  function renderForumActivity(items) {
    var wrap = document.querySelector('.forum-activity-wrap');
    if (!wrap) return;

    wrap.innerHTML = (items || []).map(buildForumCard).join('');
  }

  /* Load both grids; an empty grid on any failure. */
  async function initSidebarGrids() {
    var animeGrid = document.querySelector('.list-preview');
    var mangaGrid = document.querySelector('#manga-progress-grid');

    if (animeGrid) animeGrid.addEventListener('click', handleGridClick);
    if (mangaGrid) mangaGrid.addEventListener('click', handleGridClick);

    var anime = [];
    try {
      anime = await fetchFavoriteAnime();
    } catch (error) {
      if (window.console && console.warn) {
        console.warn('AniList anime favourites unavailable:', error);
      }
      anime = [];
    }
    renderAnimeInProgress(anime);

    var manga = [];
    try {
      manga = await fetchFavoriteManga();
    } catch (error) {
      if (window.console && console.warn) {
        console.warn('AniList manga favourites unavailable:', error);
      }
      manga = [];
    }
    renderMangaInProgress(manga);
  }

  /* ------------------------------------------------------------------ */
  /* Like buttons — delegated on the feed so it also covers posts that  */
  /* arrive later (timeline stream + Photon's threaded reply).           */
  /* ------------------------------------------------------------------ */

  function initLikeButtons() {
    var feed = document.querySelector('.activity-feed');
    if (!feed) return;

    feed.addEventListener('click', function (event) {
      var button = event.target.closest('.action.likes');
      if (!button) return;

      var liked = button.classList.toggle('liked');

      var countEl = button.querySelector('.count');
      var current = countEl ? parseInt(countEl.textContent, 10) || 0 : 0;
      var next = liked ? current + 1 : Math.max(0, current - 1);

      if (next > 0) {
        if (!countEl) {
          countEl = document.createElement('span');
          countEl.className = 'count';
          button.insertBefore(countEl, button.firstChild);
        }
        countEl.textContent = next;
      } else if (countEl) {
        countEl.parentNode.removeChild(countEl);
      }
    });
  }

  /* The feed starts empty — the cinematic timeline streams every post in. */
  initLikeButtons();
  startTimeline();
  initSidebarGrids();
  renderForumActivity(forumActivity);
})();

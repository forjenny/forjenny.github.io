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
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />' +
      '<path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>',

    badge:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M12 21s-7.5-4.9-10-9.5C.3 8.4 2.4 5 5.6 5c1.9 0 3.2 1 4.4 2.6' +
      'C11.2 6 12.5 5 14.4 5c3.2 0 5.3 3.4 3.6 6.5C19.5 16.1 12 21 12 21z" /></svg>',

    replies:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.7-.8L3 21l1.9-5.3' +
      'A8.4 8.4 0 0 1 4 11.5a8.4 8.4 0 0 1 8.4-8.4h.6a8.4 8.4 0 0 1 8 8z" /></svg>',

    likes:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 ' +
      '7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>',
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

  /* Build one .activity-entry card. */
  function buildPost(post) {
    return (
      '<article class="activity-entry">' +
      '<div class="wrap">' +
      '<header class="header">' +
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
      '<span class="donator-badge" title="Donator">' +
      ICONS.badge +
      '</span>' +
      '<span class="time">' +
      ICONS.bell +
      '<span>' +
      escapeHtml(post.timestamp) +
      '</span>' +
      '</span>' +
      '</header>' +
      '<div class="text">' +
      '<div class="activity-markdown"><p>' +
      escapeHtml(post.text) +
      '</p></div>' +
      '</div>' +
      '<div class="actions">' +
      '<button class="action replies" type="button">' +
      ICONS.replies +
      '<span>' +
      escapeHtml(post.comments) +
      '</span>' +
      '</button>' +
      '<button class="action likes" type="button">' +
      ICONS.likes +
      '<span>' +
      escapeHtml(post.likes) +
      '</span>' +
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
     status box) with the tween-in animation. Returns the new card element. */
  function prependPost(post) {
    var feed = document.querySelector('.activity-feed');
    if (!feed) return null;

    var existing = Array.prototype.slice.call(
      feed.querySelectorAll('.activity-entry')
    );
    var firstTops = existing.map(function (node) {
      return node.getBoundingClientRect().top;
    });

    var card = createCard(post);
    card.classList.add('tween-in');

    if (existing.length) {
      feed.insertBefore(card, existing[0]);
    } else {
      feed.appendChild(card);
    }

    slideExistingDown(existing, firstTops);

    return card;
  }

  /* Stream the timeline: 3 posts one at a time, then Reeze's special post.
     Two seconds after Reeze's post lands, her reply button starts glowing. */
  function startTimeline() {
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

      initReezeReply(card);

      setTimeout(function () {
        var replyButton = card.querySelector('.action.replies');
        if (replyButton) replyButton.classList.add('glow-reply');
      }, GLOW_DELAY_MS);
    }, elapsed + FINAL_PAUSE_MS);
  }

  /* ------------------------------------------------------------------ */
  /* Reply box                                                          */
  /* ------------------------------------------------------------------ */

  function initReply() {
    var reply = document.querySelector('.reply');
    if (!reply) return;

    var textarea = reply.querySelector('.el-textarea__inner');
    var postBtn = reply.querySelector('.reply-post');
    var photon = reply.querySelector('.photon-avatar');

    var posting = false;
    var timer = null;

    /* 1 + 2 — clicking the box expands it into a textarea with a Post button. */
    function activate() {
      reply.classList.add('is-active');
      textarea.rows = 3;
      postBtn.hidden = false;
      if (document.activeElement !== textarea) textarea.focus();
    }

    reply.addEventListener('click', function (event) {
      if (posting) return;
      if (event.target.closest('.reply-post')) return;
      activate();
    });

    textarea.addEventListener('focus', function () {
      if (!posting) activate();
    });

    /* 3 — submit on button click or Enter (Shift+Enter inserts a newline). */
    function submit() {
      if (posting) return;
      posting = true;

      activate();
      textarea.value = '';
      textarea.disabled = true; // disable the text area
      postBtn.hidden = true;
      photon.hidden = false; // tiny Photon avatar next to the text area

      typeReply();
    }

    postBtn.addEventListener('click', submit);

    textarea.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submit();
      }
    });

    /* Type the reply one character at a time into the (now disabled) text area. */
    function typeReply() {
      var i = 0;

      timer = setInterval(function () {
        if (i >= REPLY_TEXT.length) {
          clearInterval(timer);
          timer = null;
          setTimeout(postReply, POST_PAUSE_MS);
          return;
        }

        textarea.value += REPLY_TEXT.charAt(i);
        i += 1;

        // keep the latest line in view
        textarea.scrollTop = textarea.scrollHeight;
      }, TYPE_MS);
    }

    /* 4 — after the pause, drop the reply in as a normal post at the top. */
    function postReply() {
      prependPost({
        username: 'Photon',
        avatarUrl: PHOTON_AVATAR,
        text: REPLY_TEXT,
        timestamp: 'a few seconds ago',
        likes: 0,
        comments: 0,
      });

      reset();
    }

    function reset() {
      posting = false;
      textarea.disabled = false;
      textarea.value = '';
      textarea.rows = 1;
      textarea.placeholder = 'Write a reply...';
      photon.hidden = true;
      postBtn.hidden = true;
      reply.classList.remove('is-active');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Reeze's post — reply editor + Photon typing simulation             */
  /* ------------------------------------------------------------------ */

  var MD_TOOLS = [
    'B',
    'I',
    'U',
    'S',
    'Link',
    'Image',
    'List',
    'Quote',
    'Code',
  ];

  var RTE_HTML =
    '<div class="markdown-editor">' +
    MD_TOOLS.map(function (tool) {
      return '<button class="md-tool" type="button">' + tool + '</button>';
    }).join('') +
    '</div>' +
    '<textarea class="el-textarea__inner" placeholder="Write a reply..."></textarea>' +
    '<div class="preview">' +
    '<div class="preview-label">Preview:</div>' +
    '<div class="preview-card">' +
    '<div class="avatar"><img src="../assets/photon-current.png" alt="Photon" /></div>' +
    '<div class="preview-body">' +
    '<div class="preview-name">Photon</div>' +
    '<div class="preview-text"></div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="rte-footer">' +
    '<span class="rte-guidelines">Please read the site guidelines before posting</span>' +
    '<div class="rte-actions">' +
    '<button class="rte-cancel" type="button">Cancel</button>' +
    '<button class="rte-publish" type="button">Publish</button>' +
    '</div>' +
    '</div>';

  function initReezeReply(card) {
    var replyButton = card.querySelector('.action.replies');
    if (!replyButton) return;

    replyButton.addEventListener('click', function () {
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
    var publishButton = editor.querySelector('.rte-publish');
    var cancelButton = editor.querySelector('.rte-cancel');

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

      prependPost({
        username: 'Photon',
        avatarUrl: PHOTON_AVATAR,
        text: REPLY_TEXT,
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
      });
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

  /* AniList has no "FAVOURITES" MediaListStatus, so favourites are pulled
     straight off the user and enriched with the progress from their
     MediaListCollection (the fields asked for: title / cover / progress /
     episodes). Swap in a `status: CURRENT` MediaListCollection query if you
     would rather show the currently-watching list instead. */
  var FAVOURITES_QUERY = [
    'query ($userId: Int) {',
    '  User(id: $userId) {',
    '    favourites {',
    '      anime(perPage: 50) {',
    '        nodes {',
    '          id',
    '          title { userPreferred }',
    '          coverImage { large }',
    '          episodes',
    '        }',
    '      }',
    '    }',
    '  }',
    '  MediaListCollection(userId: $userId, type: ANIME) {',
    '    lists {',
    '      entries {',
    '        progress',
    '        media { id }',
    '      }',
    '    }',
    '  }',
    '}',
  ].join('\n');

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

  /* Fetch one user's favourites, with progress pulled from their list. */
  async function fetchUserFavourites(userId) {
    var response = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: FAVOURITES_QUERY,
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

    var user = payload.data && payload.data.User;
    var nodes =
      (user &&
        user.favourites &&
        user.favourites.anime &&
        user.favourites.anime.nodes) ||
      [];

    /* media id -> progress, taken from the user's anime list. */
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
        episodes: node.episodes,
        progress: typeof progress === 'number' ? progress : 0,
      };
    });
  }

  /* Fetch both users' favourites in parallel, merge, then shuffle. */
  async function fetchFavoriteAnime() {
    var lists = await Promise.all([
      fetchUserFavourites(REEZE_ID),
      fetchUserFavourites(PHOTON_ID),
    ]);

    return shuffle(lists[0].concat(lists[1]));
  }

  function buildAnimeCard(item) {
    var episodes = item.episodes == null ? null : Number(item.episodes);
    var progress = Number(item.progress) || 0;
    var complete = episodes !== null && progress >= episodes;

    var label = complete
      ? 'Completed!'
      : episodes !== null
      ? 'Ep ' + progress + ' / ' + episodes
      : 'Ep ' + progress;

    var attrs =
      ' data-progress="' +
      escapeHtml(progress) +
      '"' +
      (episodes !== null ? ' data-total="' + escapeHtml(episodes) + '"' : '');

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
      '<button class="media-preview-add" type="button" aria-label="Add episode">' +
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

  function renderAnimeInProgress(items) {
    var grid = document.querySelector('.list-preview');
    if (!grid) return;

    grid.innerHTML = (items || []).map(buildAnimeCard).join('');

    /* One delegated listener handles every card's "+" button. The update is
       local to the DOM only — AniList would need auth to persist it. */
    grid.addEventListener('click', function (event) {
      var button = event.target.closest('.media-preview-add');
      if (!button) return;

      var card = button.closest('.media-preview-card');
      if (!card || card.classList.contains('is-complete')) return;

      var hasTotal = card.dataset.total !== undefined && card.dataset.total !== '';
      var total = hasTotal ? Number(card.dataset.total) : null;
      var progress = (Number(card.dataset.progress) || 0) + 1;
      card.dataset.progress = progress;

      var label = card.querySelector('.media-preview-episode');

      if (total !== null && progress >= total) {
        card.classList.add('is-complete');
        if (label) label.textContent = 'Completed!';
      } else if (label) {
        label.textContent =
          total !== null ? 'Ep ' + progress + ' / ' + total : 'Ep ' + progress;
      }
    });
  }

  /* Load the favourites, then render; an empty grid on any failure. */
  async function initAnimeGrid() {
    var items = [];

    try {
      items = await fetchFavoriteAnime();
    } catch (error) {
      if (window.console && console.warn) {
        console.warn('AniList favourites unavailable:', error);
      }
      items = [];
    }

    renderAnimeInProgress(items);
  }

  /* Initial render, then start the cinematic stream. */
  renderPosts(initialPosts);
  startTimeline();
  initReply();
  initAnimeGrid();
})();

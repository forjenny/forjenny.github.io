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

    replies:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.7-.8L3 21l1.9-5.3' +
      'A8.4 8.4 0 0 1 4 11.5a8.4 8.4 0 0 1 8.4-8.4h.6a8.4 8.4 0 0 1 8 8z" /></svg>',

    likes:
      '<svg class="heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 ' +
      '7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>',

    likesFilled:
      '<svg class="heart-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
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
      '<button class="action likes' +
      (post.liked ? ' liked' : '') +
      '" type="button">' +
      (post.liked ? ICONS.likesFilled : ICONS.likes) +
      '<span class="count">' +
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

      card.dataset.replyState = 'glowing';
      initReezeReply(card);

      setTimeout(function () {
        if (card.dataset.replyState !== 'glowing') return;

        var replyButton = card.querySelector('.action.replies');
        if (replyButton) replyButton.classList.add('glow-reply');
      }, GLOW_DELAY_MS);
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

      /* Build the reply as a threaded card + cosmetic box inside a wrapper. */
      var replyCard = createCard({
        username: 'Photon',
        avatarUrl: PHOTON_AVATAR,
        text: REPLY_TEXT,
        timestamp: 'just now',
        likes: 1,
        comments: 0,
        liked: true,
      });
      replyCard.classList.add('tween-in', 'threaded-reply');

      var replyBox = document.createElement('div');
      replyBox.className = 'threaded-reply-box';
      replyBox.textContent = 'Write a reply...';

      var thread = document.createElement('div');
      thread.className = 'reply-thread';
      thread.appendChild(replyCard);
      thread.appendChild(replyBox);

      /* FLIP: slide the cards below Reeze's post down, then insert the thread. */
      var feed = document.querySelector('.activity-feed');
      var existing = feed
        ? Array.prototype.slice.call(feed.querySelectorAll('.activity-entry'))
        : [];
      var firstTops = existing.map(function (node) {
        return node.getBoundingClientRect().top;
      });

      card.insertAdjacentElement('afterend', thread);
      slideExistingDown(existing, firstTops);

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
      }
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
      if (countEl) {
        var current = parseInt(countEl.textContent, 10) || 0;
        countEl.textContent = liked ? current + 1 : Math.max(0, current - 1);
      }

      /* swap outline ↔ filled heart to match the state */
      var icon = button.querySelector('.heart-icon');
      if (icon) icon.outerHTML = liked ? ICONS.likesFilled : ICONS.likes;
    });
  }

  /* Initial render, then start the cinematic stream. */
  renderPosts(initialPosts);
  initLikeButtons();
  startTimeline();
  initAnimeGrid();
})();

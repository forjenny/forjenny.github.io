/* Reeze's profile activity feed.
   - "Load More" pages the parent posts, 15 at a time. Replies are never paged.
   - Every reply of a rendered parent lives in the DOM, collapsed by default and
     toggled by the reply icon in that post's footer. */

(function () {
  'use strict';

  var BATCH_SIZE = 15;
  var DATA_URL = '../../../assets/Reeze.json';

  var PROFILE_AVATAR = '../../../assets/reeze-current.png';
  /* Replies in the export carry no picture; named users get their own, everyone
     else falls back to the default pfp. */
  var REPLY_AVATAR = '../../../assets/default-pfp-3.png';
  var KNOWN_AVATARS = {
    Reeze: '../../../assets/reeze-current.png',
    Photon: '../../../assets/photon-current.png',
  };

  /* Same inline icons the feed uses. */
  var ICONS = {
    replies:
      '<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">' +
      '<path fill="currentColor" d="M416 192c0-88.4-93.1-160-208-160S0 103.6 0 192c0 34.3 14.1 65.9 38 92-13.4 30.2-35.5 54.2-35.8 54.5-2.2 2.3-2.8 5.7-1.5 8.7S4.8 352 8 352c36.6 0 66.9-12.3 88.7-25 32.2 15.7 70.3 25 111.3 25 114.9 0 208-71.6 208-160zm122 220c23.9-26 38-57.7 38-92 0-66.9-53.5-124.2-129.3-148.1.9 6.6 1.3 13.3 1.3 20.1 0 105.9-107.7 192-240 192-10.8 0-21.3-.8-31.7-1.9C207.8 439.6 281.8 480 368 480c41 0 79.1-9.2 111.3-25 21.8 12.7 52.1 25 88.7 25 3.2 0 6.1-1.9 7.3-4.8 1.3-2.9.7-6.3-1.5-8.7-.3-.3-22.4-24.2-35.8-54.5z"></path>' +
      '</svg>',
    heart:
      '<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
      '<path fill="currentColor" d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"></path>' +
      '</svg>',
  };

  var feed = document.getElementById('reeze-feed');
  var loadMore = document.getElementById('reeze-load-more');
  var status = document.getElementById('reeze-feed-status');

  if (!feed || !loadMore) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var posts = [];
  var username = 'Reeze';

  /* Pagination state — parents only. */
  var visibleParentCount = BATCH_SIZE;
  var busy = false;

  /* post id -> true when that post's replies are expanded. */
  var expandedPosts = Object.create(null);

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function replyAvatar(reply) {
    var user = reply.user || {};
    if (user.avatar) return user.avatar;
    if (user.name && KNOWN_AVATARS[user.name]) return KNOWN_AVATARS[user.name];
    return REPLY_AVATAR;
  }

  function plural(value, unit) {
    return value + ' ' + unit + (value === 1 ? '' : 's') + ' ago';
  }

  /* "3 weeks ago", "5 years ago" — the wording AniList uses. */
  function timeAgo(unixSeconds) {
    var seconds = Number(unixSeconds) || 0;
    var elapsed = Math.max(0, Math.floor(Date.now() / 1000) - seconds);

    if (elapsed < 60) return 'just now';

    var minutes = Math.floor(elapsed / 60);
    if (minutes < 60) return plural(minutes, 'minute');

    var hours = Math.floor(minutes / 60);
    if (hours < 24) return plural(hours, 'hour');

    var days = Math.floor(hours / 24);
    if (days < 7) return plural(days, 'day');
    if (days < 30) return plural(Math.floor(days / 7), 'week');
    if (days < 365) return plural(Math.floor(days / 30), 'month');

    return plural(Math.floor(days / 365), 'year');
  }

  function isoDate(unixSeconds) {
    return new Date((Number(unixSeconds) || 0) * 1000).toISOString();
  }

  function fullDate(unixSeconds) {
    return new Date((Number(unixSeconds) || 0) * 1000).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  /* ------------------------------------------------------------------ */
  /* Templates                                                          */
  /* ------------------------------------------------------------------ */

  function buildLikeButton(likes, hideZero) {
    var count = Number(likes) || 0;
    var showCount = !hideZero || count > 0;
    var label = hideZero && count === 0 ? 'Likes' : 'Likes: ' + count;

    return (
      '<button class="action likes" type="button" aria-pressed="false" ' +
      'aria-label="' + label + '">' +
      (showCount ? '<span class="count">' + count + '</span>' : '') +
      ICONS.heart +
      '</button>'
    );
  }

  function buildReplyControl(post, replyCount, repliesId) {
    /* A zero count stays hidden, but the icon still opens the empty state. */
    var count = replyCount > 0 ? '<span class="count">' + replyCount + '</span>' : '';
    var label = replyCount > 0 ? 'Replies: ' + replyCount : 'Replies';

    return (
      '<button class="action replies" type="button" ' +
      'data-activity-id="' + escapeHtml(post.id) + '" ' +
      'aria-expanded="false" aria-controls="' + repliesId + '" ' +
      'aria-label="' + label + '">' +
      count +
      ICONS.replies +
      '</button>'
    );
  }

  function buildReply(reply) {
    var author = reply.user && reply.user.name ? reply.user.name : 'AniList user';

    return (
      '<article class="activity-reply" aria-label="Reply from ' +
      escapeHtml(author) +
      '">' +
      '<header class="reply-header">' +
      '<span class="reply-avatar">' +
      '<img src="' +
      replyAvatar(reply) +
      '" alt="" decoding="async" />' +
      '</span>' +
      '<span class="reply-name">' +
      escapeHtml(author) +
      '</span>' +
      '<time class="reply-time" datetime="' +
      isoDate(reply.createdAt) +
      '" title="' +
      escapeHtml(fullDate(reply.createdAt)) +
      '">' +
      timeAgo(reply.createdAt) +
      '</time>' +
      '</header>' +
      '<p class="reply-text">' +
      escapeHtml(reply.text) +
      '</p>' +
      '<footer class="actions">' +
      buildLikeButton(reply.likeCount, true) +
      '</footer>' +
      '</article>'
    );
  }

  function buildPost(post) {
    var replies = Array.isArray(post.replies) ? post.replies : [];
    var replyCount = replies.length
      ? typeof post.replyCount === 'number' && post.replyCount > 0
        ? post.replyCount
        : replies.length
      : 0;
    var repliesId = 'replies-' + post.id;
    var repliesBody = replies.length
      ? replies.map(buildReply).join('')
      : '<div class="activity-reply-placeholder" aria-hidden="true">Write a reply...</div>';

    return (
      '<article class="activity-entry" data-activity-id="' +
      escapeHtml(post.id) +
      '">' +
      '<div class="wrap">' +
      '<header class="header">' +
      '<span class="user-info">' +
      '<div class="avatar">' +
      '<img src="' +
      PROFILE_AVATAR +
      '" alt="" loading="lazy" />' +
      '</div>' +
      '<span class="name">' +
      escapeHtml(username) +
      '</span>' +
      '</span>' +
      '<span class="time-wrap">' +
      '<time class="time-text" datetime="' +
      isoDate(post.createdAt) +
      '" title="' +
      escapeHtml(fullDate(post.createdAt)) +
      '">' +
      timeAgo(post.createdAt) +
      '</time>' +
      '</span>' +
      '</header>' +
      '<div class="text">' +
      '<div class="activity-markdown"><p>' +
      escapeHtml(post.text) +
      '</p></div>' +
      '</div>' +
      '<footer class="actions">' +
      buildReplyControl(post, replyCount, repliesId) +
      buildLikeButton(post.likeCount) +
      '</footer>' +
      '<div class="activity-replies" id="' +
      repliesId +
      '" hidden>' +
      repliesBody +
      '</div>' +
      '</div>' +
      '</article>'
    );
  }

  /* ------------------------------------------------------------------ */
  /* Reply accordion                                                    */
  /* ------------------------------------------------------------------ */

  function toggleReplies(button) {
    var postId = button.getAttribute('data-activity-id');
    var box = document.getElementById(button.getAttribute('aria-controls'));
    if (!postId || !box) return;

    var open = !expandedPosts[postId];
    expandedPosts[postId] = open;

    button.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    box.dataset.expanded = open ? 'true' : 'false';

    if (reducedMotion.matches) {
      box.hidden = !open;
      box.style.height = '';
      box.style.opacity = '';
      return;
    }

    if (open) {
      box.hidden = false;
      var target = box.scrollHeight;

      box.style.height = '0px';
      box.style.opacity = '0';
      void box.offsetHeight; /* commit the collapsed frame */

      box.style.height = target + 'px';
      box.style.opacity = '1';
    } else {
      box.style.height = box.getBoundingClientRect().height + 'px';
      box.style.opacity = '1';
      void box.offsetHeight;

      box.style.height = '0px';
      box.style.opacity = '0';
    }
  }

  /* After the height transition: free the height when open, fully hide the
     container (so screen readers skip it) when closed. */
  feed.addEventListener('transitionend', function (event) {
    var box = event.target;
    if (!box.classList || !box.classList.contains('activity-replies')) return;
    if (event.propertyName !== 'height') return;

    if (box.dataset.expanded === 'true') {
      box.style.height = 'auto';
    } else {
      box.hidden = true;
      box.style.height = '';
      box.style.opacity = '';
    }
  });

  /* ------------------------------------------------------------------ */
  /* Parent pagination                                                  */
  /* ------------------------------------------------------------------ */

  function refreshControls() {
    var shown = Math.min(visibleParentCount, posts.length);

    loadMore.hidden = shown >= posts.length;
    loadMore.disabled = false;
    loadMore.textContent = 'Load More';

    if (status) {
      status.textContent = 'Showing ' + shown + ' of ' + posts.length + ' posts.';
    }
  }

  function appendParents(count, immediate) {
    if (busy || visibleParentCount >= posts.length) return;

    busy = true;
    loadMore.disabled = true;
    loadMore.textContent = 'Loading…';
    feed.setAttribute('aria-busy', 'true');

    var run = function () {
      var start = Math.min(visibleParentCount, posts.length);
      visibleParentCount = Math.min(visibleParentCount + count, posts.length);

      var batch = posts.slice(start, visibleParentCount);
      if (batch.length) {
        feed.insertAdjacentHTML('beforeend', batch.map(buildPost).join(''));
      }

      busy = false;
      feed.setAttribute('aria-busy', 'false');
      refreshControls();
    };

    if (immediate) {
      run();
    } else {
      window.setTimeout(run, 160);
    }
  }

  loadMore.addEventListener('click', function () {
    appendParents(BATCH_SIZE, false);
  });

  /* ------------------------------------------------------------------ */
  /* Likes + reply toggles (delegated — also covers later batches)      */
  /* ------------------------------------------------------------------ */

  feed.addEventListener('click', function (event) {
    var button = event.target.closest
      ? event.target.closest('button.action')
      : null;
    if (!button || !feed.contains(button)) return;

    if (button.classList.contains('replies')) {
      toggleReplies(button);
      return;
    }

    if (!button.classList.contains('likes')) return;

    var countEl = button.querySelector('.count');
    var count = countEl ? Number(countEl.textContent) || 0 : 0;
    var liked = button.classList.toggle('liked');
    var next = Math.max(0, count + (liked ? 1 : -1));
    var isReply = button.closest('.activity-reply') !== null;

    if (next > 0) {
      if (!countEl) {
        countEl = document.createElement('span');
        countEl.className = 'count';
        button.insertBefore(countEl, button.firstChild);
      }
      countEl.textContent = String(next);
    } else if (countEl) {
      /* Replies hide a zero count; parent posts keep showing it. */
      if (isReply) {
        countEl.parentNode.removeChild(countEl);
      } else {
        countEl.textContent = '0';
      }
    }

    button.setAttribute('aria-pressed', liked ? 'true' : 'false');
    button.setAttribute(
      'aria-label',
      next > 0 ? 'Likes: ' + next : isReply ? 'Likes' : 'Likes: 0'
    );
  });

  /* ------------------------------------------------------------------ */
  /* Data                                                               */
  /* ------------------------------------------------------------------ */

  function showMessage(message) {
    feed.innerHTML =
      '<p class="profile-feed-message">' + escapeHtml(message) + '</p>';
    feed.setAttribute('aria-busy', 'false');
    loadMore.hidden = true;
  }

  fetch(DATA_URL)
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .then(function (data) {
      var activities = Array.isArray(data.activities) ? data.activities : [];
      if (data.username) username = data.username;

      if (!activities.length) {
        showMessage('No activity yet.');
        return;
      }

      /* The export is oldest-first; a profile shows the newest activity first. */
      posts = activities.slice().sort(function (a, b) {
        return Number(b.createdAt) - Number(a.createdAt);
      });

      visibleParentCount = BATCH_SIZE;
      expandedPosts = Object.create(null);

      feed.innerHTML = posts
        .slice(0, visibleParentCount)
        .map(buildPost)
        .join('');
      feed.setAttribute('aria-busy', 'false');
      refreshControls();
    })
    .catch(function (error) {
      showMessage('Could not load activity right now.');
      if (window.console && console.warn) {
        console.warn('Reeze activity unavailable:', error);
      }
    });
})();

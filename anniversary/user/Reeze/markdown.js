/* AniList-flavoured Markdown renderer (vanilla JS).
 *
 * Implements the subset documented for AniList messages:
 *   - single newlines become <br>
 *   - ~!spoiler!~ , ~~strike~~ , **bold** / __bold__ , *italic* / _italic_
 *   - ~~~centered~~~ (also tolerates longer tilde runs)
 *   - [text](url) and bare URLs, ![alt](url), img###(url)
 *   - youtube(id|url) and webm(url) embeds
 *   - # … ##### headings (###### blocked), == / -- setext headings, --- rules
 *   - blockquotes, lists, fenced/inline code
 *   - a small HTML whitelist (<b> <i> <center> <blockquote> <pre> <code> <br> …)
 *
 * Everything else is escaped; links/embeds only accept http(s) or root-relative
 * URLs, so untrusted content cannot inject markup or script.
 */
(function (global) {
  'use strict';

  var ALLOWED_TAGS = {
    b: 1,
    strong: 1,
    i: 1,
    em: 1,
    center: 1,
    blockquote: 1,
    pre: 1,
    code: 1,
    br: 1,
    del: 1,
    strike: 1,
    s: 1,
  };

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeUrl(value) {
    var url = String(value || '').trim().replace(/^["']|["']$/g, '');
    if (!url) return '';
    if (/^(https?:)?\/\//i.test(url)) return url;
    if (/^\/(?!\/)/.test(url)) return url;
    return '';
  }

  function youtubeId(value) {
    var raw = String(value || '').trim().replace(/^["']|["']$/g, '');
    var match = raw.match(
      /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/
    );
    if (match) return match[1];
    if (/^[A-Za-z0-9_-]{6,}$/.test(raw)) return raw;
    return '';
  }

  function render(input) {
    var stash = [];

    function hold(html) {
      stash.push(html);
      return '\u0000' + (stash.length - 1) + '\u0000';
    }

    function restore(html) {
      var previous;
      var guard = 0;
      do {
        previous = html;
        html = html.replace(/\u0000(\d+)\u0000/g, function (m, index) {
          return stash[Number(index)] || '';
        });
        guard += 1;
      } while (html !== previous && guard < 8);
      return html;
    }

    /* ------------------------------------------------------------------ */
    /* Inline formatting                                                   */
    /* ------------------------------------------------------------------ */

    /* `s` is already HTML-escaped. */
    function format(s) {
      /* inline code first, so its contents stay literal */
      s = s.replace(/`([^`\n]+)`/g, function (m, code) {
        return hold('<code>' + code + '</code>');
      });

      /* ~~~center~~~ (accepts longer runs, e.g. ~~~~~~url~~~~~~) */
      s = s.replace(/~{3,}([\s\S]+?)~{3,}/g, function (m, inner) {
        return hold('<span class="md-center">' + format(inner) + '</span>');
      });

      /* ~!spoiler!~ */
      s = s.replace(/~!([\s\S]+?)!~/g, function (m, inner) {
        return hold(
          '<span class="md-spoiler" role="button" tabindex="0" aria-expanded="false">' +
            '<span class="md-spoiler-label">Spoiler, click to view</span>' +
            '<span class="md-spoiler-body">' +
            format(inner) +
            '</span>' +
            '</span>'
        );
      });

      /* images: ![alt](url) */
      s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (m, alt, url) {
        var src = safeUrl(url);
        if (!src) return m;
        return hold(
          '<img class="md-image" src="' +
            escapeHtml(src) +
            '" alt="' +
            escapeHtml(alt) +
            '" loading="lazy" decoding="async" />'
        );
      });

      /* links: [text](url) */
      s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, text, url) {
        var href = safeUrl(url);
        if (!href) return m;
        return hold(
          '<a href="' +
            escapeHtml(href) +
            '" target="_blank" rel="noopener noreferrer">' +
            format(text) +
            '</a>'
        );
      });

      /* normalise long emphasis runs: ____text____ / ***text*** */
      s = s.replace(/_{3,}/g, '__').replace(/\*{3,}/g, '**');

      /* strikethrough, bold, italic */
      s = s.replace(/~~([^~\n]+?)~~/g, '<s>$1</s>');
      s = s.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>');
      s = s.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
      s = s.replace(/(^|[^_])_([^_\n]+?)_(?!_)/g, '$1<em>$2</em>');

      /* bare URLs (already escaped, so &amp; stays valid in the href) */
      s = s.replace(/(^|[\s(])(https?:\/\/[^\s<\u0000]+)/g, function (m, pre, url) {
        var trailing = '';
        var tail = url.match(/[.,;:!?)]+$/);
        if (tail) {
          trailing = tail[0];
          url = url.slice(0, url.length - trailing.length);
        }
        if (!url) return m;
        return (
          pre +
          hold(
            '<a href="' +
              url +
              '" target="_blank" rel="noopener noreferrer">' +
              url +
              '</a>'
          ) +
          trailing
        );
      });

      return s;
    }

    function inline(text) {
      return format(escapeHtml(text));
    }

    /* ------------------------------------------------------------------ */
    /* AniList-specific constructs                                         */
    /* ------------------------------------------------------------------ */

    /* Media is converted before anything else, mirroring AniList's quirk of
       converting img()/youtube()/webm() even inside code blocks. */
    function convertMedia(text) {
      text = text.replace(/img(\d+)?\(([^)\s]+)\)/gi, function (m, width, url) {
        var src = safeUrl(url);
        if (!src) return m;
        return hold(
          '<img class="md-image" src="' +
            escapeHtml(src) +
            '"' +
            (width ? ' width="' + Number(width) + '"' : '') +
            ' alt="" loading="lazy" decoding="async" />'
        );
      });

      text = text.replace(/youtube\(([^)\s]+)\)/gi, function (m, value) {
        var id = youtubeId(value);
        if (!id) return m;
        return hold(
          '<span class="md-embed"><iframe src="https://www.youtube.com/embed/' +
            id +
            '" title="YouTube video" loading="lazy" allowfullscreen ' +
            'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></span>'
        );
      });

      text = text.replace(/webm\(([^)\s]+)\)/gi, function (m, url) {
        var src = safeUrl(url);
        if (!src) return m;
        return hold(
          '<video class="md-video" src="' +
            escapeHtml(src) +
            '" autoplay loop muted playsinline></video>'
        );
      });

      return text;
    }

    /* Allowed HTML tags survive; every other tag gets escaped later. */
    function protectHtml(text) {
      return text.replace(
        /<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi,
        function (m, closing, tag) {
          var name = tag.toLowerCase();

          /* AniList strips anchors: <a>text</a> renders as plain text. */
          if (name === 'a') return '';

          if (!ALLOWED_TAGS[name]) return m;

          if (name === 'br') return hold('<br />');
          if (name === 'center') {
            return hold(closing ? '</span>' : '<span class="md-center">');
          }

          return hold('<' + (closing ? '/' : '') + name + '>');
        }
      );
    }

    /* ------------------------------------------------------------------ */
    /* Block parsing                                                       */
    /* ------------------------------------------------------------------ */

    function renderBlocks(lines) {
      var out = '';
      var i = 0;
      var total = lines.length;

      while (i < total) {
        var line = lines[i];

        if (!line.trim()) {
          i += 1;
          continue;
        }

        /* fenced code */
        if (/^\s*```/.test(line)) {
          var code = [];
          i += 1;
          while (i < total && !/^\s*```/.test(lines[i])) {
            code.push(lines[i]);
            i += 1;
          }
          i += 1;
          out += '<pre><code>' + escapeHtml(code.join('\n')) + '</code></pre>';
          continue;
        }

        /* ATX heading */
        var heading = line.match(/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/);
        if (heading) {
          var level = heading[1].length;
          if (level === 6) {
            /* AniList blocks h6 / ###### — show it as text */
            out += '<p>' + inline(line.trim()) + '</p>';
          } else {
            out +=
              '<h' + level + '>' + inline(heading[2]) + '</h' + level + '>';
          }
          i += 1;
          continue;
        }

        /* setext heading: text followed by === or --- */
        if (
          i + 1 < total &&
          /^\s{0,3}(=+|-{2,})\s*$/.test(lines[i + 1]) &&
          line.trim()
        ) {
          var isH1 = /=/.test(lines[i + 1]);
          out +=
            '<h' +
            (isH1 ? 1 : 2) +
            '>' +
            inline(line.trim()) +
            '</h' +
            (isH1 ? 1 : 2) +
            '>';
          i += 2;
          continue;
        }

        /* horizontal rule */
        if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) {
          out += '<hr />';
          i += 1;
          continue;
        }

        /* blockquote (recursive) */
        if (/^\s{0,3}>/.test(line)) {
          var quote = [];
          while (i < total && /^\s{0,3}>/.test(lines[i])) {
            quote.push(lines[i].replace(/^\s{0,3}>\s?/, ''));
            i += 1;
          }
          out += '<blockquote>' + renderBlocks(quote) + '</blockquote>';
          continue;
        }

        /* lists */
        if (/^\s{0,3}[-*+]\s+/.test(line) || /^\s{0,3}\d+\.\s+/.test(line)) {
          var ordered = /^\s{0,3}\d+\.\s+/.test(line);
          var items = [];
          while (
            i < total &&
            (ordered
              ? /^\s{0,3}\d+\.\s+/.test(lines[i])
              : /^\s{0,3}[-*+]\s+/.test(lines[i]))
          ) {
            items.push(
              '<li>' +
                inline(
                  lines[i].replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/, '')
                ) +
                '</li>'
            );
            i += 1;
          }
          out +=
            (ordered ? '<ol>' : '<ul>') +
            items.join('') +
            (ordered ? '</ol>' : '</ul>');
          continue;
        }

        /* paragraph */
        var paragraph = [];
        while (i < total) {
          var current = lines[i];
          if (
            !current.trim() ||
            /^\s*```/.test(current) ||
            /^\s{0,3}#{1,6}\s+/.test(current) ||
            /^\s{0,3}>/.test(current) ||
            /^\s{0,3}[-*+]\s+/.test(current) ||
            /^\s{0,3}\d+\.\s+/.test(current) ||
            /^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(current)
          ) {
            break;
          }
          /* the next line closing a setext heading ends this paragraph */
          if (
            i + 1 < total &&
            /^\s{0,3}(=+|-{2,})\s*$/.test(lines[i + 1])
          ) {
            paragraph.push(current);
            i += 1;
            break;
          }
          paragraph.push(current);
          i += 1;
        }

        if (!paragraph.length) {
          paragraph.push(lines[i]);
          i += 1;
        }

        out +=
          '<p>' +
          paragraph.map(function (text) {
            return inline(text);
          }).join('<br />') +
          '</p>';
      }

      return out;
    }

    var source = String(input === null || input === undefined ? '' : input)
      .replace(/\r\n?/g, '\n');

    source = convertMedia(source);
    source = protectHtml(source);

    var html = renderBlocks(source.split('\n'));

    return restore(html);
  }

  /* -------------------------------------------------------------------- */
  /* Spoiler interaction (delegated, works for every rendered message)     */
  /* -------------------------------------------------------------------- */

  function toggleSpoiler(element) {
    var revealed = element.classList.toggle('is-revealed');
    element.setAttribute('aria-expanded', revealed ? 'true' : 'false');
  }

  document.addEventListener('click', function (event) {
    var target =
      event.target && event.target.closest
        ? event.target.closest('.md-spoiler')
        : null;
    if (target) toggleSpoiler(target);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    var active = document.activeElement;
    if (active && active.classList && active.classList.contains('md-spoiler')) {
      event.preventDefault();
      toggleSpoiler(active);
    }
  });

  global.AniListMarkdown = { render: render };
})(window);

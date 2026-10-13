/* ==========================================================================
   Initial feed content — the 5 posts rendered on load.
   Each post: username, avatarUrl, text, timestamp, likes, comments.
   ========================================================================== */

const initialPosts = [
  {
    username: 'jenny',
    avatarUrl: 'https://i.pravatar.cc/150?u=jenny',
    text: 'hi going to japan yet again',
    timestamp: '17 seconds ago',
    likes: 12,
    comments: 3,
  },
  {
    username: 'sayaka',
    avatarUrl: 'https://i.pravatar.cc/150?u=sayaka',
    text: 'miki sayaka',
    timestamp: '3 minutes ago',
    likes: 4,
    comments: 0,
  },
  {
    username: 'maria',
    avatarUrl: 'https://i.pravatar.cc/150?u=maria',
    text: 'volví a morir en otro mundo hardcore',
    timestamp: '1 hour ago',
    likes: 27,
    comments: 9,
  },
  {
    username: 'theo',
    avatarUrl: 'https://i.pravatar.cc/150?u=theo',
    text: 'I found the meaning of life',
    timestamp: '5 hours ago',
    likes: 63,
    comments: 14,
  },
  {
    username: 'nina',
    avatarUrl: 'https://i.pravatar.cc/150?u=nina',
    text: 'I submitted my workkkk with 11 and a half hours to spare yay :D',
    timestamp: 'yesterday',
    likes: 8,
    comments: 1,
  },
];

/* ==========================================================================
   Timeline — posts streamed in on top of the initial feed.
   ========================================================================== */

const timelineEvents = [
  {
    username: 'jenny',
    avatarUrl: 'https://i.pravatar.cc/150?u=jenny',
    text: 'rewatching madoka magica for the 4th time and it still hurts',
    timestamp: 'a few seconds ago',
    likes: 5,
    comments: 0,
  },
  {
    username: 'maria',
    avatarUrl: 'https://i.pravatar.cc/150?u=maria',
    text: 'café con leche and a good novel, perfect afternoon',
    timestamp: 'a few seconds ago',
    likes: 9,
    comments: 2,
  },
  {
    username: 'nina',
    avatarUrl: 'https://i.pravatar.cc/150?u=nina',
    text: 'shipped the new build, going to sleep for a week',
    timestamp: 'a few seconds ago',
    likes: 14,
    comments: 4,
  },
];

/* Reeze's special post — lands at the very top, last in the timeline. */
const reezeSpecialPost = {
  username: 'Reeze',
  avatarUrl: '../assets/reeze-current.png',
  text: `Uni is so funny. My deadline is in 3 days. I still emailed my professor that I won't make it and he gave me a 2 week extension no questions whatsoever. Who said "That shit won't fly in uni"?`,
  timestamp: 'a few seconds ago',
  likes: 0,
  comments: 0,
};

/* ==========================================================================
   AniList — user IDs (replace these placeholders with our real IDs).
   ========================================================================== */

const REEZE_ID = 5861730;
const PHOTON_ID = 5143195;

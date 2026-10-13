/* The activity feed starts empty — every post is streamed in by the
   narrative timeline (see `timelineEvents` below and `startTimeline()`). */

/* ==========================================================================
   Timeline — posts streamed in on top of the initial feed.
   ========================================================================== */

const timelineEvents = [
  {
    username: 'MrAnimeVeteran',
    avatarUrl: '../assets/MrAnimeVeteran.jpg',
    text: 'can i post yuri or yaoi content or art? will it be ok? will i be judged?',
    timestamp: 'a few seconds ago',
    likes: 8,
    comments: 8,
  },
  {
    username: 'Fredomnom',
    avatarUrl: '../assets/Fredomnom.png',
    text: `Me playing The last of us part I: Ohhh there's a photomode!
*game crashes*
Also me: ohh... there's a photo...mode`,
    timestamp: 'a few seconds ago',
    likes: 5,
    comments: 0,
  },
  {
    username: 'Ambiverse',
    avatarUrl: '../assets/Ambiverse.png',
    postType: 'media',
    headerText: 'I FINALLY GOT JINGRAN AFTER 140 CONVENES!!!! T^T',
    imageUrl: '../assets/jingran.jpg',
    text: 'I really wish when we convened a character that the weapon would come along with it, but oh well at least in our up coming Ananta Game we wont even need to gacha pull for characters, yayyy, looking forward to it!!',
    timestamp: '3 weeks ago',
    likes: 33,
    comments: 6,
  },
  {
    username: 'traxmeister',
    avatarUrl: '../assets/traxmeister.png',
    text: 'yeah... 500 total anime :) and over 7.500 episodes.....',
    timestamp: 'a few seconds ago',
    likes: 106,
    comments: 5,
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

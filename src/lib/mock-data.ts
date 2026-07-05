export interface TranscriptLine {
  start: number; // seconds
  end: number;
  text: string;
  ipa?: string;
}

export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  transcript: TranscriptLine[];
}

export interface Channel {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export const channels: Channel[] = [
  { id: "ted", name: "TED", avatar: "TED", color: "#E62B1E" },
  { id: "bbc", name: "BBC Earth", avatar: "BBC", color: "#111111" },
  { id: "vox", name: "Vox", avatar: "V", color: "#FFF200" },
  { id: "natgeo", name: "Nat Geo", avatar: "NG", color: "#FFCC00" },
  { id: "cnn", name: "CNN 10", avatar: "CNN", color: "#CC0000" },
  { id: "kurz", name: "Kurzgesagt", avatar: "K", color: "#FF6B35" },
  { id: "verge", name: "The Verge", avatar: "TV", color: "#5200FF" },
  { id: "nyt", name: "NYT", avatar: "T", color: "#000000" },
];

export const videos: Video[] = [
  {
    id: "1",
    youtubeId: "arj7oStGLkU",
    title: "Inside the mind of a master procrastinator",
    channel: "TED",
    duration: "14:03",
    thumbnail: "https://i.ytimg.com/vi/arj7oStGLkU/hqdefault.jpg",
    transcript: [
      { start: 0, end: 4, text: "So in college, I was a government major.", ipa: "soʊ ɪn ˈkɑlɪdʒ, aɪ wʌz ə ˈɡʌvərnmənt ˈmeɪdʒər." },
      { start: 4, end: 9, text: "Which means I had to write a lot of papers.", ipa: "wɪtʃ minz aɪ hæd tu raɪt ə lɑt əv ˈpeɪpərz." },
      { start: 9, end: 14, text: "Now, when a normal student writes a paper, they might spread the work out a little like this.", ipa: "naʊ, wɛn ə ˈnɔrməl ˈstudənt raɪts ə ˈpeɪpər..." },
      { start: 14, end: 19, text: "So, you know, you get started maybe a little slowly.", ipa: "soʊ, ju noʊ, ju ɡɛt ˈstɑrtɪd ˈmeɪbi ə ˈlɪtəl ˈsloʊli." },
      { start: 19, end: 24, text: "But you get enough done in the first week that with some heavier days later on.", ipa: "bʌt ju ɡɛt ɪˈnʌf dʌn ɪn ðə fɜrst wik..." },
      { start: 24, end: 30, text: "Everything gets done, things stay civil.", ipa: "ˈɛvriˌθɪŋ ɡɛts dʌn, θɪŋz steɪ ˈsɪvəl." },
      { start: 30, end: 36, text: "And I would want to do that like that.", ipa: "ænd aɪ wʊd wɑnt tu du ðæt laɪk ðæt." },
      { start: 36, end: 42, text: "That would be the plan, I would have it all ready to go.", ipa: "ðæt wʊd bi ðə plæn, aɪ wʊd hæv ɪt ɔl ˈrɛdi tu ɡoʊ." },
      { start: 42, end: 48, text: "But then, actually, the paper would come along.", ipa: "bʌt ðɛn, ˈæktʃuəli, ðə ˈpeɪpər wʊd kʌm əˈlɔŋ." },
      { start: 48, end: 55, text: "And then I would kind of do this.", ipa: "ænd ðɛn aɪ wʊd kaɪnd əv du ðɪs." },
    ],
  },
  {
    id: "2",
    youtubeId: "H14bBuluwB8",
    title: "Grit: The power of passion and perseverance",
    channel: "TED",
    duration: "6:12",
    thumbnail: "https://i.ytimg.com/vi/H14bBuluwB8/hqdefault.jpg",
    transcript: [
      { start: 0, end: 5, text: "When I was 27 years old, I left a very demanding job in management consulting." },
      { start: 5, end: 10, text: "For a job that was even more demanding: teaching." },
      { start: 10, end: 16, text: "I went to teach seventh graders math in the New York City public schools." },
      { start: 16, end: 22, text: "And like any teacher, I made quizzes and tests." },
      { start: 22, end: 28, text: "I gave out homework assignments." },
      { start: 28, end: 34, text: "When the work came back, I calculated grades." },
      { start: 34, end: 40, text: "What struck me was that IQ was not the only difference between my best and worst students." },
      { start: 40, end: 46, text: "Some of my strongest performers did not have stratospheric IQ scores." },
    ],
  },
  {
    id: "3",
    youtubeId: "eIho2S0ZahI",
    title: "How to speak so people want to listen",
    channel: "TED",
    duration: "9:58",
    thumbnail: "https://i.ytimg.com/vi/eIho2S0ZahI/hqdefault.jpg",
    transcript: [
      { start: 0, end: 5, text: "The human voice: it's the instrument we all play." },
      { start: 5, end: 11, text: "It's the most powerful sound in the world, probably." },
      { start: 11, end: 17, text: "It's the only one that can start a war or say I love you." },
      { start: 17, end: 23, text: "And yet many people have the experience that when they speak, people don't listen to them." },
      { start: 23, end: 29, text: "Why is that? How can we speak powerfully to make change in the world?" },
    ],
  },
  {
    id: "4",
    youtubeId: "ZbdXHmnyuXQ",
    title: "Amazing wildlife of the Serengeti",
    channel: "BBC Earth",
    duration: "5:24",
    thumbnail: "https://i.ytimg.com/vi/ZbdXHmnyuXQ/hqdefault.jpg",
    transcript: [
      { start: 0, end: 5, text: "The Serengeti is one of the last great wildernesses on Earth." },
      { start: 5, end: 11, text: "Home to millions of animals across vast open plains." },
      { start: 11, end: 17, text: "Every year, an extraordinary migration takes place here." },
      { start: 17, end: 23, text: "Wildebeest travel hundreds of miles in search of fresh grass." },
    ],
  },
];

export function getVideo(id: string) {
  return videos.find((v) => v.id === id);
}

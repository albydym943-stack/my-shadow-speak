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

// NOTE: Timestamps below were tuned to match when the speaker actually
// utters each line (skipping silent intros / applause). Small gaps between
// end[n] and start[n+1] are intentional to avoid bleed into the next line.
export const videos: Video[] = [
  {
    id: "1",
    youtubeId: "arj7oStGLkU",
    title: "Inside the mind of a master procrastinator",
    channel: "TED",
    duration: "14:03",
    thumbnail: "https://i.ytimg.com/vi/arj7oStGLkU/hqdefault.jpg",
    transcript: [
      { start: 14.2, end: 16.6, text: "So in college, I was a government major,", ipa: "soʊ ɪn ˈkɑlɪdʒ, aɪ wʌz ə ˈɡʌvərnmənt ˈmeɪdʒər" },
      { start: 16.7, end: 19.0, text: "which means I had to write a lot of papers.", ipa: "wɪtʃ minz aɪ hæd tu raɪt ə lɑt əv ˈpeɪpərz" },
      { start: 19.2, end: 24.6, text: "Now, when a normal student writes a paper, they might spread the work out a little like this.", ipa: "naʊ wɛn ə ˈnɔrməl ˈstudənt raɪts ə ˈpeɪpər" },
      { start: 24.8, end: 28.2, text: "So, you know, you get started maybe a little slowly,", ipa: "soʊ ju noʊ ju ɡɛt ˈstɑrtɪd" },
      { start: 28.4, end: 33.0, text: "but you get enough done in the first week that with some heavier days later on,", ipa: "bʌt ju ɡɛt ɪˈnʌf dʌn" },
      { start: 33.2, end: 36.4, text: "everything gets done and things stay civil.", ipa: "ˈɛvriˌθɪŋ ɡɛts dʌn" },
      { start: 37.0, end: 40.0, text: "And I would want to do that like that.", ipa: "ænd aɪ wʊd wɑnt tu du ðæt" },
      { start: 40.2, end: 44.0, text: "That would be the plan. I would have it all ready to go,", ipa: "ðæt wʊd bi ðə plæn" },
      { start: 44.2, end: 47.0, text: "but then, actually, the paper would come along,", ipa: "bʌt ðɛn ˈæktʃuəli" },
      { start: 47.2, end: 50.0, text: "and then I would kind of do this.", ipa: "ænd ðɛn aɪ wʊd kaɪnd əv du ðɪs" },
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
      { start: 13.5, end: 18.5, text: "When I was 27 years old, I left a very demanding job in management consulting" },
      { start: 18.7, end: 22.0, text: "for a job that was even more demanding: teaching." },
      { start: 22.5, end: 27.5, text: "I went to teach seventh graders math in the New York City public schools." },
      { start: 28.0, end: 31.5, text: "And like any teacher, I made quizzes and tests." },
      { start: 31.7, end: 34.0, text: "I gave out homework assignments." },
      { start: 34.2, end: 37.5, text: "When the work came back, I calculated grades." },
      { start: 38.0, end: 44.0, text: "What struck me was that IQ was not the only difference between my best and my worst students." },
      { start: 44.2, end: 49.0, text: "Some of my strongest performers did not have stratospheric IQ scores." },
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
      { start: 11.0, end: 14.5, text: "The human voice: it's the instrument we all play." },
      { start: 14.7, end: 18.5, text: "It's the most powerful sound in the world, probably." },
      { start: 18.7, end: 23.0, text: "It's the only one that can start a war or say I love you." },
      { start: 23.5, end: 29.0, text: "And yet many people have the experience that when they speak, people don't listen to them." },
      { start: 29.2, end: 34.0, text: "Why is that? How can we speak powerfully to make change in the world?" },
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
      { start: 5.0, end: 10.0, text: "The Serengeti is one of the last great wildernesses on Earth." },
      { start: 10.2, end: 15.0, text: "Home to millions of animals across vast open plains." },
      { start: 15.2, end: 20.0, text: "Every year, an extraordinary migration takes place here." },
      { start: 20.2, end: 25.0, text: "Wildebeest travel hundreds of miles in search of fresh grass." },
    ],
  },
];

export function getVideo(id: string) {
  return videos.find((v) => v.id === id);
}

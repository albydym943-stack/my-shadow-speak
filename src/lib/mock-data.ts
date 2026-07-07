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
    title: "TED Talk: Inside the mind of a master procrastinator",
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
      { start: 50.2, end: 54.0, text: "And that would happen every single paper." },
      { start: 54.2, end: 58.5, text: "But then, once in a while, a paper would come along that was really big." },
      { start: 58.7, end: 63.0, text: "A paper you're supposed to spend a lot of time on." },
      { start: 63.2, end: 67.5, text: "And I knew, for a paper like that, my normal work flow was not an option." },
      { start: 67.7, end: 71.5, text: "It was way too big a project. So I planned things out." },
      { start: 71.7, end: 76.0, text: "And I decided I kind of had to go something like this." },
    ],
  },
  {
    id: "2",
    youtubeId: "H14bBuluwB8",
    title: "TED Talk: Grit — the power of passion and perseverance",
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
      { start: 49.2, end: 53.5, text: "Some of my smartest kids weren't doing so well." },
      { start: 53.7, end: 57.5, text: "And that got me thinking." },
      { start: 57.7, end: 63.0, text: "The kinds of things you need to learn in seventh grade math are hard:" },
      { start: 63.2, end: 68.0, text: "ratios, decimals, the area of a parallelogram." },
      { start: 68.2, end: 73.0, text: "But these concepts are not impossible," },
      { start: 73.2, end: 79.0, text: "and I was firmly convinced that every one of my students could learn the material" },
      { start: 79.2, end: 83.0, text: "if they worked hard and long enough." },
      { start: 83.2, end: 89.0, text: "After several more years of teaching, I came to the conclusion that what we need" },
      { start: 89.2, end: 93.5, text: "is a much better understanding of students and learning." },
    ],
  },
  {
    id: "3",
    youtubeId: "eIho2S0ZahI",
    title: "Casual English: How to speak so people want to listen",
    channel: "TED",
    duration: "9:58",
    thumbnail: "https://i.ytimg.com/vi/eIho2S0ZahI/hqdefault.jpg",
    transcript: [
      { start: 11.0, end: 14.5, text: "The human voice: it's the instrument we all play." },
      { start: 14.7, end: 18.5, text: "It's the most powerful sound in the world, probably." },
      { start: 18.7, end: 23.0, text: "It's the only one that can start a war or say I love you." },
      { start: 23.5, end: 29.0, text: "And yet many people have the experience that when they speak, people don't listen to them." },
      { start: 29.2, end: 34.0, text: "Why is that? How can we speak powerfully to make change in the world?" },
      { start: 34.2, end: 39.5, text: "What I'd like to suggest, there are a number of habits that we need to move away from." },
      { start: 39.7, end: 43.5, text: "I've assembled for your pleasure here seven deadly sins of speaking." },
      { start: 43.7, end: 48.0, text: "I'm not pretending this is an exhaustive list," },
      { start: 48.2, end: 52.5, text: "but these seven, I think, are pretty large habits that we can all fall into." },
      { start: 52.7, end: 57.0, text: "First, gossip. Speaking ill of somebody who's not present." },
      { start: 57.2, end: 62.0, text: "Not a nice habit, and we know perfectly well the person gossiping" },
      { start: 62.2, end: 65.5, text: "will, five minutes later, be gossiping about us." },
      { start: 65.7, end: 70.0, text: "Second, judging. We know people who are like this in conversation," },
      { start: 70.2, end: 75.0, text: "and it's very hard to listen to somebody if you know that you're being judged." },
      { start: 75.2, end: 79.0, text: "Third, negativity. You can fall into this." },
      { start: 79.2, end: 83.5, text: "My mother, in the last years of her life, became very negative," },
      { start: 83.7, end: 86.5, text: "and it's hard to listen." },
    ],
  },
];

export function getVideo(id: string) {
  return videos.find((v) => v.id === id);
}

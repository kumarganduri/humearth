// Kid copy (design decision 8A glossary): plain words, about 12 words or fewer, no units.
// The sentence names the biggest ACTIVITY (OV #2), and stays hopeful: stress goes quiet, never scolds.

import type { Footprint, KidComparisons } from '../footprint/engine';
import { CHANNELS, type Constants, type Plan } from '../footprint/types';

export type Band = 'great' | 'okay' | 'tired';

export function band(f: Footprint): Band {
  const worst = Math.min(...CHANNELS.map((c) => f.health[c]));
  return worst >= 0.8 ? 'great' : worst >= 0.5 ? 'okay' : 'tired';
}

const SENTENCES: Record<Footprint['dominantActivity'], Record<Band, string>> = {
  none: { great: 'Your world is happy and full of life.', okay: 'Your world is happy and full of life.', tired: 'Your world is resting.' },
  text: {
    great: 'AI questions used most of it. Your world is doing great.',
    okay: 'AI questions used most of it. Your world is a bit tired.',
    tired: 'AI questions used most of it. Your world is resting.',
  },
  images: {
    great: 'AI pictures used most of it. Your world is doing great.',
    okay: 'Your river is a little low. AI pictures used most of it.',
    tired: 'Your river is low. AI pictures used most of it.',
  },
  videos: {
    great: 'AI videos used most of it. Your world is doing great.',
    okay: 'Your river is a little low. AI videos used most of it.',
    tired: 'Your world is resting. AI videos used most of it.',
  },
};

export type Whose = 'mine' | 'friend';

/** On a friend's world the same sentence speaks about "your friend's" world. */
export function sentenceFor(f: Footprint, whose: Whose = 'mine'): string {
  const s = SENTENCES[f.dominantActivity][band(f)];
  return whose === 'friend' ? s.replace(/\bYour\b/g, "Your friend's").replace(/\byour\b/g, "your friend's") : s;
}

/** Live screen-reader description of the world (decision 11A). */
export function worldDescription(f: Footprint, whose: Whose = 'mine'): string {
  const birds = f.animals === 'present' ? 'birds are flying' : f.animals === 'some-hiding' ? 'some birds are hiding' : 'the birds are hiding';
  const river = f.health.water >= 0.8 ? 'your river is full' : f.health.water >= 0.5 ? 'your river is a little low' : 'your river is low';
  const text = `${sentenceFor(f)} In your world, ${river} and ${birds}.`;
  return whose === 'friend' ? text.replace(/\bYour\b/g, "Your friend's").replace(/\byour\b/g, "your friend's") : text;
}


export interface QuizOption {
  value: number;
  big: string; // Shantell numeral or word
  small: string; // plain words
}
export interface QuizQuestion {
  key: 'text' | 'images' | 'videos';
  ask: string;
  options: QuizOption[];
}

/** The 3-tap quiz (OV #4). Option labels come from the sourced quiz table, so words and math can't drift. */
export function quizQuestions(c: Constants): QuizQuestion[] {
  const q = c.quiz;
  const perWeek = (n: number) => (n === 0 ? 'none' : n === 1 ? 'about 1 a week' : `about ${n} a week`);
  return [
    {
      key: 'text',
      ask: 'How often do you ask an AI something?',
      options: [
        { value: 0, big: '0–2', small: 'a day, hardly ever' },
        { value: 1, big: '3–9', small: 'a day, a few times' },
        { value: 2, big: '10–49', small: 'a day, lots' },
        { value: 3, big: '50+', small: 'a day, all day' },
      ],
    },
    {
      key: 'images',
      ask: 'Do you make AI pictures?',
      options: [
        { value: 0, big: 'Never', small: perWeek(q.imagesPerWeek[0]!) },
        { value: 1, big: 'Sometimes', small: perWeek(q.imagesPerWeek[1]!) },
        { value: 2, big: 'A lot', small: perWeek(q.imagesPerWeek[2]!) },
      ],
    },
    {
      key: 'videos',
      ask: 'Do you make AI videos?',
      options: [
        { value: 0, big: 'Never', small: perWeek(q.videosPerWeek[0]!) },
        { value: 1, big: 'Sometimes', small: perWeek(q.videosPerWeek[1]!) },
        { value: 2, big: 'A lot', small: perWeek(q.videosPerWeek[2]!) },
      ],
    },
  ];
}

const PLAN_WORDS: Record<keyof Plan, string> = {
  fewerPictures: 'fewer AI pictures',
  fewerVideos: 'fewer AI videos',
  lighterAi: 'a lighter AI',
};

/** "fewer AI pictures and a lighter AI", or '' when there is no plan. */
export function planWords(p: Plan): string {
  const parts = (Object.keys(PLAN_WORDS) as (keyof Plan)[]).filter((k) => p[k]).map((k) => PLAN_WORDS[k]);
  return parts.length <= 1 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}

const round = (n: number) => (n >= 10 ? Math.round(n).toString() : n >= 1 ? n.toFixed(1).replace(/\.0$/, '') : n.toFixed(1));

/** Numbers as things you can picture (8A). Big fridge times switch to hours. */
export function comparisonWords(k: KidComparisons): { air: string; water: string; power: string } {
  const minutes = k.fridgeMinutes;
  return {
    air: k.balloons < 1 ? 'less than 1 balloon of CO2' : `${round(k.balloons)} ${k.balloons === 1 ? 'balloon' : 'balloons'} of CO2`,
    water: k.bathtubs >= 1 ? `${round(k.bathtubs)} bathtubs` : k.glasses < 1 ? 'less than 1 glass' : `${round(k.glasses)} glasses`,
    power: minutes >= 120 ? `a fridge for ${round(minutes / 60)} hours` : minutes < 1 ? 'a fridge for less than a minute' : `a fridge for ${round(minutes)} minutes`,
  };
}

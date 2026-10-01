// Kid copy (design decision 8A glossary): plain words, about 12 words or fewer, no units.
// The sentence names the biggest ACTIVITY (OV #2), and stays hopeful: stress goes quiet, never scolds.

import type { Footprint } from '../footprint/engine';
import { CHANNELS } from '../footprint/types';

export type Band = 'great' | 'okay' | 'tired';

export function band(f: Footprint): Band {
  const worst = Math.min(...CHANNELS.map((c) => f.health[c]));
  return worst >= 0.8 ? 'great' : worst >= 0.5 ? 'okay' : 'tired';
}

const SENTENCES: Record<Footprint['dominantActivity'], Record<Band, string>> = {
  none: { great: 'Your world is happy and full of life.', okay: 'Your world is happy and full of life.', tired: 'Your world is resting.' },
  text: {
    great: 'Lots of AI questions, and your world is still doing great.',
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

export function sentenceFor(f: Footprint): string {
  return SENTENCES[f.dominantActivity][band(f)];
}

/** Live screen-reader description of the world (decision 11A). */
export function worldDescription(f: Footprint): string {
  const birds = f.animals === 'present' ? 'birds are flying' : f.animals === 'some-hiding' ? 'some birds are hiding' : 'the birds are hiding';
  const river = f.health.water >= 0.8 ? 'your river is full' : f.health.water >= 0.5 ? 'your river is a little low' : 'your river is low';
  return `${sentenceFor(f)} In your world, ${river} and ${birds}.`;
}

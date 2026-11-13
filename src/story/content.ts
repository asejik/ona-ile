/** Prologue content, ported from prototype v0.1. */

export interface Who {
  name: string;
  role: string;
  /** Badge colour until portraits arrive. */
  colour: string;
  initial: string;
}

export const CAST = {
  baba: {
    name: 'Baba Ọ̀nà',
    role: 'Your grandfather · "Father of the Road"',
    colour: '#6B4A2B',
    initial: 'B',
  },
  mama: { name: 'Mama', role: 'Your grandmother', colour: '#9B2F4F', initial: 'M' },
} satisfies Record<string, Who>;

export interface Passenger {
  id: string;
  name: string;
  role: string;
  cloth: string;
  cap?: string;
  /** Mama Bisi rides once and has a story line about Baba. */
  special?: 'bisi';
}

export const PASSENGERS: Passenger[] = [
  { id: 'kudirat', name: 'Alhaja Kudirat', role: 'Trader', cloth: '#B0306A' },
  { id: 'sani', name: 'Mallam Sani', role: 'Tailor', cloth: '#2F5D8A', cap: '#F0ECE0' },
  { id: 'tolani', name: 'Tolani', role: 'Unilorin student', cloth: '#3F8A5A' },
  { id: 'chidi', name: 'Corper Chidi', role: 'NYSC corps member', cloth: '#B9A46E', cap: '#2F6B3F' },
  { id: 'joke', name: 'Nurse Joke', role: 'Nurse', cloth: '#E9EEF2' },
  { id: 'olaitan', name: 'Mr. Olaitan', role: 'Civil servant', cloth: '#6B6F78' },
  { id: 'ndagi', name: 'Ndagi', role: 'Electrician', cloth: '#D07B2A' },
  { id: 'halimat', name: 'Halimat', role: 'Hairdresser', cloth: '#7B3FA0' },
  { id: 'kareem', name: 'Baba Kareem', role: 'Retired teacher', cloth: '#F2EFE6', cap: '#7A2A2A' },
  { id: 'bisi', name: 'Mama Bisi', role: 'Knew Baba years ago', cloth: '#2A7F7A', special: 'bisi' },
];

const PASSENGER_COLOURS = [
  '#2F7FC1',
  '#B0306A',
  '#3F8A5A',
  '#B9A46E',
  '#6B6F78',
  '#D07B2A',
  '#7B3FA0',
  '#9B2F4F',
];
export function passengerWho(p: Passenger, i = 0): Who {
  return {
    name: p.name,
    role: p.role,
    colour: PASSENGER_COLOURS[i % PASSENGER_COLOURS.length]!,
    initial: p.name[0]!,
  };
}

export const LINES = {
  pickup: [
    "Abeg, {d}. And don't drive like Lagos people o.",
    'Keke! {d}! Quick quick, my oga is waiting.',
    "Good afternoon. {d}, please. Are you Baba Ọ̀nà's grandchild? You have his nose.",
    'Take me to {d}. I have exactly this money. Not one naira more.',
    '{d}, please. And gently. I am carrying eggs.',
    'How far! {d}. You know the place abi? Follow the road, it will show you.',
  ],
  chatter: [
    'This sun ehn. Even the harmattan is sweating.',
    'My brother, there is a pothole. And another one. And their mother.',
    "In Lagos you would still be in traffic. Ilorin is sweet, I'm telling you.",
    'Is this keke older than you?',
    'Drop me at the next junction. No, not this one. The next one.',
    'My phone is on 3 percent. Please drive with purpose.',
  ],
  goodEnd: [
    'Correct driver! Take something small for yourself.',
    'Ehen! Smooth like amala. God bless you.',
    'You drive like your Baba. Greet him for me.',
  ],
  badEnd: [
    'My back! I will pray for you, but not today.',
    'Is it a keke or a washing machine?',
    'I would have reached faster if I trekked.',
  ],
  lateEnd: ['Ah, I am late! Next time I will trek.', 'My meeting has started without me. Thank you, sha.'],
  okEnd: ['Thank you. We have reached.'],
  haggleYes: ['Okay o. But drive well.', "Ehen. You are your Baba's child. Let's go."],
  haggleNo: [
    'Ah! Is it gold I am sitting on? Let me find another keke.',
    'For that money I will buy the keke itself. Bye bye.',
  ],
  bump: ['Ehn! Gently!', 'Do you want to kill me before my wedding?', 'Haba! This is not Lagos!'],
  bisi: 'Your Baba carried me to my wedding in 1989 and refused my money. Tell him Bisi greets him.',
};

export const INTRO: { who: Who; text: string }[] = [
  {
    who: CAST.baba,
    text: 'Ayo! You finally came home. Come, the keke is outside. She is old, but she knows Ilorin better than you.',
  },
  {
    who: CAST.mama,
    text: "Your Baba's medicine has finished, and the pharmacy will not give us credit again. We need ₦5,000.",
  },
  {
    who: CAST.mama,
    text: 'You want to drive keke in Ilorin with your Lagos brain? You will learn. Respect the wardens and greet people well.',
  },
  {
    who: CAST.baba,
    text: 'Take my notebook too. When you pass the places inside it, take a picture for me. My memory is like an old radio now. It needs help to find the station.',
  },
];

export const STAGE_DONE: { who: Who; text: string }[] = [
  { who: CAST.mama, text: '₦5,000! Ehen. Maybe the Lagos brain is learning.' },
  { who: CAST.baba, text: 'Well done, my child. Tomorrow I will show you where the old 504 is sleeping.' },
];

/** The Prologue's money goal, in naira. */
export const PROLOGUE_GOAL = 5000;

export function pick<T>(list: readonly T[], rand: () => number = Math.random): T {
  return list[Math.floor(rand() * list.length)]!;
}

export function naira(n: number): string {
  return `₦${Math.round(n).toLocaleString('en-NG')}`;
}

/**
 * IDDSI Placemat Builder — data model
 *
 * Official IDDSI framework colours, level names, testing methods and
 * verified official IDDSI testing videos.
 *
 * © The International Dysphagia Diet Standardisation Initiative 2019
 * https://iddsi.org/standards/framework — CC BY-SA 4.0
 */

export interface IddsiLevelMeta {
  level: number;
  key: string;
  /** Official IDDSI level name */
  name: string;
  /** Official framework colour (hex) */
  color: string;
  /** Readable text colour on top of the framework colour */
  onColor: string;
  descriptor: string;
  image: string;
  /** Names of the IDDSI tests that apply to this level */
  tests: string[];
  /** Particle-size / key measurable requirement */
  particleSize: string;
  /** Verified official IDDSI testing video (watch URL used for the QR code) */
  videoUrl: string;
  videoTitle: string;
}

/** Official IDDSI framework colours */
export const IDDSI_COLORS = {
  thin: '#FFFFFF',
  slightlyThick: '#B7B9BC',
  mildlyThick: '#F49BC1',
  moderatelyThick: '#FFD24F',
  extremelyThick: '#66A70B',
  mincedMoist: '#F5871F',
  softBiteSized: '#0093D0',
  regular: '#231F20',
} as const;

/**
 * Verified official IDDSI testing videos (IDDSI YouTube channel).
 * Keyed by testing method so each level maps to a real, correct video.
 */
export const IDDSI_TEST_VIDEOS = {
  flowTest: {
    url: 'https://www.youtube.com/watch?v=--KHFRql39M',
    title: 'IDDSI Flow Test',
  },
  flowTestLevel1: {
    url: 'https://www.youtube.com/watch?v=5vQzueOjgsM',
    title: 'IDDSI Flow Test – Level 1 Slightly Thick',
  },
  flowTestLevel2: {
    url: 'https://www.youtube.com/watch?v=WuM-KCoBv4M',
    title: 'IDDSI Flow Test – Level 2 Mildly Thick',
  },
  flowAndForkDrip: {
    url: 'https://www.youtube.com/watch?v=SiFwiGgIPHA',
    title: 'IDDSI Flow Test & Fork Drip Test – Level 3',
  },
  spoonTilt: {
    url: 'https://www.youtube.com/watch?v=QgzlEAPZKy8',
    title: 'IDDSI Spoon Tilt Test – Level 4',
  },
  level5Tests: {
    url: 'https://www.youtube.com/watch?v=BcYuDst-t14',
    title: 'Fork Pressure, Fork Drip, Spoon Tilt, Chopstick & Finger Tests – Level 5',
  },
  level6Tests: {
    url: 'https://www.youtube.com/watch?v=1wfODug5BmQ',
    title: 'Fork Pressure, Chopstick & Finger Tests – Level 6',
  },
} as const;

/** Food levels 3–7 (7 has two official variants) */
export const PLACEMAT_FOOD_LEVELS: IddsiLevelMeta[] = [
  {
    level: 3,
    key: '3',
    name: 'Level 3 – Liquidised',
    color: IDDSI_COLORS.moderatelyThick,
    onColor: '#231F20',
    descriptor: 'Smooth, no lumps. Can be drunk from a cup, cannot be eaten with a fork.',
    image: '/food-level-3.png',
    tests: ['IDDSI Flow Test (10 mL syringe)', 'Fork Drip Test'],
    particleSize: 'No lumps or particles — completely smooth',
    videoUrl: IDDSI_TEST_VIDEOS.flowAndForkDrip.url,
    videoTitle: IDDSI_TEST_VIDEOS.flowAndForkDrip.title,
  },
  {
    level: 4,
    key: '4',
    name: 'Level 4 – Pureed',
    color: IDDSI_COLORS.extremelyThick,
    onColor: '#FFFFFF',
    descriptor: 'Smooth puree, holds shape on a spoon, not sticky, cannot be poured.',
    image: '/food-level-4.png',
    tests: ['Spoon Tilt Test', 'Fork Drip Test'],
    particleSize: 'No lumps — completely smooth',
    videoUrl: IDDSI_TEST_VIDEOS.spoonTilt.url,
    videoTitle: IDDSI_TEST_VIDEOS.spoonTilt.title,
  },
  {
    level: 5,
    key: '5',
    name: 'Level 5 – Minced & Moist',
    color: IDDSI_COLORS.mincedMoist,
    onColor: '#231F20',
    descriptor: 'Soft and moist, small visible lumps, easily mashed with a fork.',
    image: '/food-level-5.png',
    tests: ['Fork Pressure Test', 'Fork Drip Test', 'Spoon Tilt Test', 'Chopstick Test', 'Finger Test'],
    particleSize: 'Lumps no larger than 4 mm (adults), 2 mm (children)',
    videoUrl: IDDSI_TEST_VIDEOS.level5Tests.url,
    videoTitle: IDDSI_TEST_VIDEOS.level5Tests.title,
  },
  {
    level: 6,
    key: '6',
    name: 'Level 6 – Soft & Bite-Sized',
    color: IDDSI_COLORS.softBiteSized,
    onColor: '#FFFFFF',
    descriptor: 'Soft, tender and moist throughout. Can be mashed with fork pressure.',
    image: '/food-level-6.png',
    tests: ['Fork Pressure Test', 'Chopstick Test', 'Finger Test', 'Fork Separation Test'],
    particleSize: 'Pieces no larger than 15 mm × 15 mm (adults), 8 mm (children)',
    videoUrl: IDDSI_TEST_VIDEOS.level6Tests.url,
    videoTitle: IDDSI_TEST_VIDEOS.level6Tests.title,
  },
  {
    level: 7,
    key: '7_easy_to_chew',
    name: 'Level 7 – Regular Easy to Chew',
    color: IDDSI_COLORS.regular,
    onColor: '#FFFFFF',
    descriptor: 'Soft, tender everyday foods. No hard, tough, chewy, fibrous, crunchy or crumbly pieces.',
    image: '/food-level-7etc.png',
    tests: ['Fork Pressure Test', 'Fork Separation Test'],
    particleSize: 'Bite-sized pieces appropriate for the person (no size restriction)',
    videoUrl: IDDSI_TEST_VIDEOS.level6Tests.url,
    videoTitle: 'Fork Pressure Test method (IDDSI)',
  },
  {
    level: 7,
    key: '7_regular',
    name: 'Level 7 – Regular',
    color: IDDSI_COLORS.regular,
    onColor: '#FFFFFF',
    descriptor: 'Normal, everyday foods of any texture. No texture modification required.',
    image: '/food-level-7.png',
    tests: ['No IDDSI testing required'],
    particleSize: 'No texture or size restriction',
    videoUrl: 'https://iddsi.org/framework/food-testing-methods',
    videoTitle: 'IDDSI food testing methods (reference)',
  },
];

/** Drink levels 0–4 */
export const PLACEMAT_DRINK_LEVELS: IddsiLevelMeta[] = [
  {
    level: 0,
    key: '0',
    name: 'Level 0 – Thin',
    color: IDDSI_COLORS.thin,
    onColor: '#231F20',
    descriptor: 'Flows like water. All unthickened drinks.',
    image: '/drink-level-0.png',
    tests: ['IDDSI Flow Test (10 mL syringe)'],
    particleSize: 'Less than 1 mL remaining after 10 seconds',
    videoUrl: IDDSI_TEST_VIDEOS.flowTest.url,
    videoTitle: IDDSI_TEST_VIDEOS.flowTest.title,
  },
  {
    level: 1,
    key: '1',
    name: 'Level 1 – Slightly Thick',
    color: IDDSI_COLORS.slightlyThick,
    onColor: '#231F20',
    descriptor: 'Thicker than water. Flows through a straw or teat with a little effort.',
    image: '/drink-level-1.png',
    tests: ['IDDSI Flow Test (10 mL syringe)'],
    particleSize: '1–4 mL remaining after 10 seconds',
    videoUrl: IDDSI_TEST_VIDEOS.flowTestLevel1.url,
    videoTitle: IDDSI_TEST_VIDEOS.flowTestLevel1.title,
  },
  {
    level: 2,
    key: '2',
    name: 'Level 2 – Mildly Thick',
    color: IDDSI_COLORS.mildlyThick,
    onColor: '#231F20',
    descriptor: 'Sippable, flows off a spoon quickly. Some effort needed to drink through a straw.',
    image: '/drink-level-2.png',
    tests: ['IDDSI Flow Test (10 mL syringe)'],
    particleSize: '4–8 mL remaining after 10 seconds',
    videoUrl: IDDSI_TEST_VIDEOS.flowTestLevel2.url,
    videoTitle: IDDSI_TEST_VIDEOS.flowTestLevel2.title,
  },
  {
    level: 3,
    key: '3',
    name: 'Level 3 – Moderately Thick',
    color: IDDSI_COLORS.moderatelyThick,
    onColor: '#231F20',
    descriptor: 'Can be drunk from a cup. Drips slowly through fork tines in dollops.',
    image: '/drink-level-3.png',
    tests: ['IDDSI Flow Test (10 mL syringe)', 'Fork Drip Test'],
    particleSize: '8–10 mL remaining after 10 seconds — smooth, no lumps',
    videoUrl: IDDSI_TEST_VIDEOS.flowAndForkDrip.url,
    videoTitle: IDDSI_TEST_VIDEOS.flowAndForkDrip.title,
  },
  {
    level: 4,
    key: '4',
    name: 'Level 4 – Extremely Thick',
    color: IDDSI_COLORS.extremelyThick,
    onColor: '#FFFFFF',
    descriptor: 'Cannot be drunk from a cup. Must be taken with a spoon. Holds its shape.',
    image: '/drink-level-4.png',
    tests: ['Spoon Tilt Test', 'Fork Drip Test'],
    particleSize: 'Smooth — no lumps',
    videoUrl: IDDSI_TEST_VIDEOS.spoonTilt.url,
    videoTitle: IDDSI_TEST_VIDEOS.spoonTilt.title,
  },
];

export function getFoodLevelMeta(key: string | null): IddsiLevelMeta | null {
  return PLACEMAT_FOOD_LEVELS.find((l) => l.key === key) ?? null;
}

export function getDrinkLevelMeta(key: string | null): IddsiLevelMeta | null {
  return PLACEMAT_DRINK_LEVELS.find((l) => l.key === key) ?? null;
}

/** Equipment required for each IDDSI test — surfaced on the placemat */
export const TEST_EQUIPMENT: Record<string, string> = {
  'IDDSI Flow Test (10 mL syringe)': '10 mL slip-tip syringe',
  'Fork Drip Test': 'Standard dinner fork (4 mm gaps between tines)',
  'Spoon Tilt Test': 'Standard metal dessert spoon',
  'Fork Pressure Test': 'Standard dinner fork',
  'Chopstick Test': 'Chopsticks or 15 mm reference guide',
  'Finger Test': 'Clean hands / gloves',
  'Fork Separation Test': 'Side of a standard fork',
};

/** PIRATES mealtime strategies */
export interface PiratesItem {
  key: string;
  letter: string;
  label: string;
  hint: string;
  value: string;
}

export const DEFAULT_PIRATES: PiratesItem[] = [
  { key: 'positioning', letter: 'P', label: 'Positioning', hint: 'Upright 90°, feet supported, head midline', value: 'Seated fully upright (90°), hips to the back of the chair, feet supported, head in midline. Remain upright 30 minutes after eating.' },
  { key: 'implements', letter: 'I', label: 'Implements', hint: 'Utensils, cups, adaptive equipment', value: 'Teaspoon only. Use prescribed cup — no straws unless approved.' },
  { key: 'rate', letter: 'R', label: 'Rate', hint: 'Pace, bite size, single sips', value: 'Slow pace. One small mouthful at a time. Ensure mouth is empty before the next bite.' },
  { key: 'alertness', letter: 'A', label: 'Alertness', hint: 'Only eat when fully awake', value: 'Only offer food or drink when fully awake, alert and sitting up.' },
  { key: 'texture', letter: 'T', label: 'Texture', hint: 'Prescribed IDDSI levels only', value: 'Follow prescribed IDDSI food and drink levels exactly. Test every meal and drink.' },
  { key: 'environment', letter: 'E', label: 'Environment', hint: 'Calm, distraction-free', value: 'Quiet, calm environment. Minimise distractions — no TV or conversation while swallowing.' },
  { key: 'supervision', letter: 'S', label: 'Supervision', hint: 'Level of supervision required', value: 'Full supervision for all meals and drinks by a trained support worker.' },
];

export const EQUIPMENT_OPTIONS: string[] = [
  'Adaptive cutlery',
  'Teaspoon',
  'Dessert spoon',
  'Standard fork',
  'Prescribed cup',
  'Nosey / cut-out cup',
  'Lidded cup',
  'Straws (if approved)',
  'Plate guard',
  'Scoop plate / bowl',
  'Non-slip mat',
  'Thickener',
  'Measuring scoop',
  'Measuring jug',
  '10 mL slip-tip syringe',
  'Chopsticks / 15 mm guide',
  'Timer',
  'Suction equipment',
];

/**
 * Equipment shown on the placemat, derived automatically from the selected
 * food and drink levels (testing equipment + level-appropriate implements).
 */
export function buildEquipmentFromLevels(
  food: IddsiLevelMeta | null,
  drink: IddsiLevelMeta | null,
): string[] {
  const items = new Set<string>();

  for (const meta of [food, drink]) {
    if (!meta) continue;
    for (const test of meta.tests) {
      const eq = TEST_EQUIPMENT[test];
      if (eq) items.add(eq);
    }
  }

  return Array.from(items);
}


export const LAMINATING_STEPS: string[] = [
  'Print in A4 landscape orientation.',
  'Print at 100% / actual size — do not scale to fit.',
  'Print double-sided if possible so the choking first-aid guide is on the back.',
  "Check the person's food and drink levels are correct before laminating.",
  'Test both QR codes with a phone camera before laminating.',
  'Laminate the completed placemat (A4 pouch, gloss or matte).',
  'Position it where staff can easily see it during every meal.',
  "Replace the placemat whenever the person's Mealtime Management Plan or IDDSI requirements change.",
];

export const PLACEMAT_DISCLAIMER =
  'This placemat is a visual support tool and does not replace an individual’s current Mealtime Management Plan, swallowing assessment, or recommendations from a qualified health professional. Always follow the person’s current clinical recommendations.';

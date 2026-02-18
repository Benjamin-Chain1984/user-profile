/**
 * IDDSI & Safe Swallowing Types
 */

export interface IddsiConfig {
  id: string;
  clientId: string | null;
  foodLevel: number | null;
  foodLevelVariant: string | null;
  drinkLevel: number | null;
  foodLevelSetAt: string | null;
  drinkLevelSetAt: string | null;
  lastReviewDate: string | null;
  nextReviewDue: string | null;
  additionalInstructions: string | null;
  enableObservations: boolean;
  observationFrequency: 'daily' | 'weekly' | 'monthly';
  enableNotifications: boolean;
  amberRecipientIds: string[];
  redRecipientIds: string[];
  minSafeAngle: number;
  targetSafeAngle: number;
}

export interface MealtimeObservation {
  id: string;
  clientId: string | null;
  coughing: 'none' | 'occasional' | 'frequent';
  wetVoice: boolean;
  throatClearing: boolean;
  pocketing: boolean;
  fatigue: boolean;
  mealCompletionPct: number | null;
  refusal: boolean;
  severity: 'green' | 'amber' | 'red';
  notes: string | null;
  completedByName: string;
  eventOccurredAt: string;
  createdAt: string;
}

export interface PositioningCheck {
  id: string;
  clientId: string | null;
  angleDegrees: number;
  personUpright: boolean;
  hipsAtBack: boolean;
  feetSupported: boolean;
  headMidline: boolean;
  status: 'green' | 'amber' | 'red';
  completedByName: string;
  eventOccurredAt: string;
  createdAt: string;
  notes: string | null;
}

export interface VideoView {
  id: string;
  clientId: string | null;
  staffUserId: string | null;
  staffName: string;
  levelType: 'food' | 'drink';
  levelValue: number;
  skipped: boolean;
  viewedAt: string;
}

export type FoodLevelKey = 3 | 4 | 5 | 6 | 7;
export type DrinkLevelKey = 0 | 1 | 2 | 3 | 4;

export interface LevelInfo {
  level: number;
  name: string;
  image: string;
  description: string;
  textureRules: string[];
  testSummary: string;
  testSteps: string[];
  equipment: string[];
  videoUrl: string;
  videoTitle: string;
}

export const FOOD_LEVELS: Record<string, LevelInfo> = {
  '7_regular': {
    level: 7,
    name: 'Level 7 – Regular',
    image: '/food-level-7.png',
    description: 'Normal everyday foods of any texture that are developmentally and age appropriate.',
    textureRules: ['No texture modification required', 'All food types allowed', 'Normal bite-sized pieces'],
    testSummary: 'No specific testing required for regular foods.',
    testSteps: ['Regular foods do not require IDDSI testing.'],
    equipment: [],
    videoUrl: '',
    videoTitle: '',
  },
  '7_easy_to_chew': {
    level: 7,
    name: 'Level 7 – Regular Easy to Chew',
    image: '/food-level-7etc.png',
    description: 'Normal everyday foods that are soft and tender, but not a puree. No hard, tough, chewy, fibrous, stringy, crunchy, or crumbly foods.',
    textureRules: ['Soft and tender textures only', 'No hard, tough or chewy pieces', 'Can be eaten with any utensils', '15mm pieces for adults'],
    testSummary: 'Fork pressure test – food can be mashed with fork pressure.',
    testSteps: ['Use a fork to press on the food', 'Food should squash, break apart, or change shape', 'No hard lumps should remain'],
    equipment: ['Fork'],
    videoUrl: '',
    videoTitle: '',
  },
  '6': {
    level: 6,
    name: 'Level 6 – Soft & Bite-Sized',
    image: '/food-level-6.png',
    description: 'Soft, tender, and moist food. Can be mashed with a fork. 15mm pieces for adults, 8mm for children.',
    textureRules: ['Soft and tender throughout', '15mm × 15mm pieces for adults', 'Can be mashed with fork pressure', 'No hard, tough, chewy, or crunchy foods'],
    testSummary: 'Fork Pressure Test, Chopstick Test, and Finger Test.',
    testSteps: [
      'Fork Pressure Test: Press fork onto food – it should squash and change shape',
      'Chopstick Test: Check pieces are no larger than the width between chopsticks (15mm)',
      'Finger Test: Press between thumb and finger – it should squash easily',
    ],
    equipment: ['Fork', 'Chopsticks or ruler'],
    videoUrl: 'https://www.youtube.com/embed/BcYuDst-t14',
    videoTitle: 'IDDSI Fork Pressure, Chopstick, and Finger Tests – Level 6',
  },
  '5': {
    level: 5,
    name: 'Level 5 – Minced & Moist',
    image: '/food-level-5.png',
    description: 'Soft, moist food with no separate thin liquid. Small lumps visible, easily mashed with fork. 4mm pieces.',
    textureRules: ['4mm lumps – easily mashed', 'Moist throughout – no separate thin liquid', 'Smooth, no lumps if swallowing is very impaired', 'Holds shape on a spoon'],
    testSummary: 'Fork Pressure Test, Fork Drip Test, Spoon Tilt Test, Chopstick Test, Finger Test.',
    testSteps: [
      'Fork Pressure Test: Food squashes between fork tines',
      'Fork Drip Test: No liquid should drip through fork tines',
      'Spoon Tilt Test: Food holds shape and falls off easily when spoon is tilted',
      'Chopstick Test: Pieces ≤4mm wide',
      'Finger Test: Squashes easily between fingers',
    ],
    equipment: ['Fork', 'Spoon', 'Chopsticks or ruler'],
    videoUrl: 'https://www.youtube.com/embed/KjYJkI8Dm_A',
    videoTitle: 'Fork Pressure, Fork Drip, Spoon Tilt, Chopstick, and Finger Tests – Level 5',
  },
  '4': {
    level: 4,
    name: 'Level 4 – Pureed',
    image: '/food-level-4.png',
    description: 'Smooth puree with no lumps. Not sticky. Holds its shape on a spoon. Falls off a tilted spoon in a single spoonful.',
    textureRules: ['Smooth – no lumps, fibres, or bits', 'Not sticky or tacky', 'Holds shape on a spoon', 'Cannot be poured – too thick to drink'],
    testSummary: 'Spoon Tilt Test – food sits on spoon then falls off cleanly.',
    testSteps: [
      'Place a spoonful of food on a spoon',
      'Tilt the spoon sideways',
      'Food should hold its shape on the spoon initially',
      'When tilted enough, it should fall off in a cohesive mass',
      'It should not drip, flow, or stick to the spoon',
    ],
    equipment: ['Spoon'],
    videoUrl: 'https://www.youtube.com/embed/eLPVzMkSj2U',
    videoTitle: 'IDDSI Spoon Tilt Test – Level 4 Extremely Thick',
  },
  '3_food': {
    level: 3,
    name: 'Level 3 – Liquidised',
    image: '/food-level-3.png',
    description: 'Smooth texture with no lumps. Can be poured but not as fast as water. Drips slowly through fork tines.',
    textureRules: ['Smooth – no lumps or fibres', 'Can be drunk from a cup', 'Drips slowly through fork tines', 'Flows off a spoon in a steady stream'],
    testSummary: 'Flow Test (10mL syringe) and Fork Drip Test.',
    testSteps: [
      'Flow Test: Fill 10mL syringe, let flow for 10 seconds',
      'Between 4–8mL should remain in syringe',
      'Fork Drip Test: Liquid should drip through fork tines slowly',
    ],
    equipment: ['10mL slip-tip syringe', 'Fork'],
    videoUrl: 'https://www.youtube.com/embed/3gOq4K7Xxyg',
    videoTitle: 'IDDSI Flow Test and Fork Drip Test – Level 3',
  },
};

export const DRINK_LEVELS: Record<number, LevelInfo> = {
  4: {
    level: 4,
    name: 'Level 4 – Extremely Thick',
    image: '/drink-level-4.png',
    description: 'Holds its shape on a spoon. Cannot be drunk from a cup. Must be eaten with a spoon.',
    textureRules: ['Holds shape on spoon', 'Cannot pour', 'Must use spoon to eat', 'Same consistency as pureed food'],
    testSummary: 'Spoon Tilt Test.',
    testSteps: [
      'Place a spoonful on a spoon',
      'Tilt sideways – it should hold shape',
      'Falls off in a cohesive mass when tilted',
    ],
    equipment: ['Spoon'],
    videoUrl: 'https://www.youtube.com/embed/eLPVzMkSj2U',
    videoTitle: 'IDDSI Spoon Tilt Test – Level 4 Extremely Thick',
  },
  3: {
    level: 3,
    name: 'Level 3 – Moderately Thick',
    image: '/drink-level-3.png',
    description: 'Can be drunk from a cup. Drips slowly through fork tines in dollops.',
    textureRules: ['Drips through fork tines in dollops', 'Can be drunk from a cup with effort', 'Thick and smooth'],
    testSummary: 'Flow Test (10mL syringe) – 4–8mL remains after 10 seconds.',
    testSteps: [
      'Fill 10mL syringe to the 10mL mark',
      'Allow to flow freely for 10 seconds',
      'Between 4mL and 8mL should remain in syringe',
    ],
    equipment: ['10mL slip-tip syringe'],
    videoUrl: 'https://www.youtube.com/embed/3gOq4K7Xxyg',
    videoTitle: 'IDDSI Flow Test – Level 3',
  },
  2: {
    level: 2,
    name: 'Level 2 – Mildly Thick',
    image: '/drink-level-2.png',
    description: 'Flows off a spoon quickly. Sippable. Thicker than water but flows easily.',
    textureRules: ['Flows through fork tines quickly', 'Can be drunk through some straws', 'Leaves a thin coating on the back of a spoon'],
    testSummary: 'Flow Test (10mL syringe) – 1–4mL remains after 10 seconds.',
    testSteps: [
      'Fill 10mL syringe to the 10mL mark',
      'Allow to flow freely for 10 seconds',
      'Between 1mL and 4mL should remain in syringe',
    ],
    equipment: ['10mL slip-tip syringe'],
    videoUrl: 'https://www.youtube.com/embed/kBG5GQj7bXA',
    videoTitle: 'IDDSI Flow Test – Level 2',
  },
  1: {
    level: 1,
    name: 'Level 1 – Slightly Thick',
    image: '/drink-level-1.png',
    description: 'Thicker than water. Flows quickly off a spoon but slower than thin liquids.',
    textureRules: ['Slightly thicker than water', 'Flows through fork tines with minimal residue', 'Can be drunk through a straw'],
    testSummary: 'Flow Test (10mL syringe) – less than 1mL remains after 10 seconds.',
    testSteps: [
      'Fill 10mL syringe to the 10mL mark',
      'Allow to flow freely for 10 seconds',
      'Less than 1mL should remain in syringe',
    ],
    equipment: ['10mL slip-tip syringe'],
    videoUrl: 'https://www.youtube.com/embed/KwXbV6gAaKQ',
    videoTitle: 'IDDSI Flow Test – Level 1',
  },
  0: {
    level: 0,
    name: 'Level 0 – Thin',
    image: '/drink-level-0.png',
    description: 'Flows like water. All unthickened drinks including water, tea, coffee, juice.',
    textureRules: ['Flows like water', 'No thickening required', 'Fast flow through syringe'],
    testSummary: 'Flow Test (10mL syringe) – less than 1mL remains.',
    testSteps: [
      'Fill 10mL syringe to the 10mL mark',
      'Allow to flow freely for 10 seconds',
      'Less than 1mL should remain in syringe',
    ],
    equipment: ['10mL slip-tip syringe'],
    videoUrl: 'https://www.youtube.com/embed/Fi3_BjVzJkw',
    videoTitle: 'IDDSI Flow Test Instructions',
  },
};

export function getFoodLevelKey(level: number, variant?: string | null): string {
  if (level === 7) return variant === 'easy_to_chew' ? '7_easy_to_chew' : '7_regular';
  if (level === 3) return '3_food';
  return String(level);
}

export function calculateObservationSeverity(obs: {
  coughing: string;
  wetVoice: boolean;
  throatClearing: boolean;
  pocketing: boolean;
  fatigue: boolean;
  refusal: boolean;
}): 'green' | 'amber' | 'red' {
  // RED triggers
  if (obs.coughing === 'frequent' || obs.wetVoice) return 'red';
  // AMBER triggers
  if (obs.coughing === 'occasional' || obs.fatigue || obs.pocketing || obs.throatClearing) return 'amber';
  return 'green';
}

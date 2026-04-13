/**
 * Generates competency check questions from general knowledge + individual config
 */

import type { CompetencyQuestion } from '@/types/bowelCompetency';
import type { BowelCareConfig } from '@/types/bowelCare';
import type { PrnMedication } from '@/types/bowelCare';

// Static general knowledge questions
const GENERAL_QUESTIONS: CompetencyQuestion[] = [
  {
    id: 'gen-1',
    question: 'What is the Bristol Stool Chart used for?',
    options: [
      'Tracking fluid intake',
      'Classifying stool consistency on a scale of 1 to 7',
      'Measuring blood pressure',
      'Recording medication doses',
    ],
    correctIndex: 1,
    category: 'general',
  },
  {
    id: 'gen-2',
    question: 'Which Bristol Stool Types may indicate constipation?',
    options: [
      'Type 1 and Type 2',
      'Type 3 and Type 4',
      'Type 5 and Type 6',
      'Type 6 and Type 7',
    ],
    correctIndex: 0,
    category: 'general',
  },
  {
    id: 'gen-3',
    question: 'Which Bristol Stool Types may indicate diarrhoea?',
    options: [
      'Type 1 and Type 2',
      'Type 3 and Type 4',
      'Type 5 and Type 6',
      'Type 6 and Type 7',
    ],
    correctIndex: 3,
    category: 'general',
  },
  {
    id: 'gen-4',
    question: 'When should PRN laxatives be considered?',
    options: [
      'Every day as a routine',
      'When the person has not had a bowel movement for a set number of days',
      'Only when the person asks for them',
      'When the person has diarrhoea',
    ],
    correctIndex: 1,
    category: 'general',
  },
  {
    id: 'gen-5',
    question: 'What are common signs of constipation to monitor?',
    options: [
      'Bloating, abdominal pain, and changes in bowel pattern',
      'Increased appetite and thirst',
      'Frequent urination',
      'Improved sleep quality',
    ],
    correctIndex: 0,
    category: 'general',
  },
  {
    id: 'gen-6',
    question: 'Which symptoms require immediate escalation to a health professional?',
    options: [
      'A normal bowel movement',
      'Vomiting, severe abdominal pain, or blood in stool',
      'Passing soft stool once a day',
      'Drinking more water than usual',
    ],
    correctIndex: 1,
    category: 'general',
  },
  {
    id: 'gen-7',
    question: 'Why is hydration important for bowel health?',
    options: [
      'It helps soften stools and supports regular bowel movements',
      'It makes stools harder',
      'It has no effect on bowel movements',
      'It only matters for kidney health',
    ],
    correctIndex: 0,
    category: 'general',
  },
  {
    id: 'gen-8',
    question: 'What should staff do after giving PRN laxative medication?',
    options: [
      'No further action needed',
      'Monitor for bowel movement within the prescribed timeframe',
      'Give another dose immediately',
      'Record it next shift',
    ],
    correctIndex: 1,
    category: 'general',
  },
];

export function generateIndividualQuestions(
  config: BowelCareConfig | null,
  medications: PrnMedication[]
): CompetencyQuestion[] {
  const questions: CompetencyQuestion[] = [];

  if (!config) return questions;

  // Q: No BM threshold days
  if (config.no_bm_days_threshold) {
    const correct = config.no_bm_days_threshold;
    const wrongOptions = [correct - 1, correct + 1, correct + 3].filter(v => v > 0);
    const options = shuffleWithCorrect(
      wrongOptions.map(String),
      String(correct)
    );
    questions.push({
      id: 'ind-no-bm-days',
      question: 'After how many days without a bowel movement should PRN be considered for this person?',
      options: options.values,
      correctIndex: options.correctIdx,
      category: 'individual',
    });
  }

  // Q: Monitoring hours after PRN
  if (config.monitor_hours_after_prn) {
    const correct = config.monitor_hours_after_prn;
    const wrongOptions = [correct - 2, correct + 2, correct + 6].filter(v => v > 0);
    const options = shuffleWithCorrect(
      wrongOptions.map(v => `${v} hours`),
      `${correct} hours`
    );
    questions.push({
      id: 'ind-monitor-hours',
      question: 'How long should staff monitor after PRN administration for this person?',
      options: options.values,
      correctIndex: options.correctIdx,
      category: 'individual',
    });
  }

  // Q: Max PRN doses per 24h
  if (config.max_prn_doses_per_24h) {
    const correct = config.max_prn_doses_per_24h;
    const wrongOptions = [1, correct + 1, correct + 2].filter(v => v !== correct && v > 0);
    const options = shuffleWithCorrect(
      wrongOptions.slice(0, 3).map(String),
      String(correct)
    );
    questions.push({
      id: 'ind-max-doses',
      question: 'What is the maximum number of PRN doses allowed in 24 hours for this person?',
      options: options.values,
      correctIndex: options.correctIdx,
      category: 'individual',
    });
  }

  // Q: First PRN medication
  if (medications.length > 0) {
    const firstMed = medications[0];
    const otherNames = ['Paracetamol', 'Ibuprofen', 'Metformin']
      .filter(n => n.toLowerCase() !== firstMed.medication_name.toLowerCase());
    const options = shuffleWithCorrect(
      otherNames.slice(0, 3),
      firstMed.medication_name
    );
    questions.push({
      id: 'ind-first-prn',
      question: 'What is the first PRN medication to be used for this person?',
      options: options.values,
      correctIndex: options.correctIdx,
      category: 'individual',
    });
  }

  // Q: Escalation recipients
  if (config.escalation_recipients && config.escalation_recipients.length > 0) {
    const correctAnswer = config.escalation_recipients.join(', ');
    const wrongOptions = [
      'Family member only',
      'Pharmacist',
      'No one — wait and see',
    ];
    const options = shuffleWithCorrect(wrongOptions, correctAnswer);
    questions.push({
      id: 'ind-escalation',
      question: 'Who should be contacted if no bowel movement occurs after PRN for this person?',
      options: options.values,
      correctIndex: options.correctIdx,
      category: 'individual',
    });
  }

  return questions;
}

export function getAllQuestions(
  config: BowelCareConfig | null,
  medications: PrnMedication[]
): CompetencyQuestion[] {
  return [...GENERAL_QUESTIONS, ...generateIndividualQuestions(config, medications)];
}

// Helper: shuffle wrong answers and insert correct at random position
function shuffleWithCorrect(
  wrong: string[],
  correct: string
): { values: string[]; correctIdx: number } {
  const shuffled = [...wrong].sort(() => Math.random() - 0.5).slice(0, 3);
  const insertAt = Math.floor(Math.random() * (shuffled.length + 1));
  shuffled.splice(insertAt, 0, correct);
  return { values: shuffled, correctIdx: insertAt };
}

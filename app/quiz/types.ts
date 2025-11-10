export enum Category {
  PIPETTING_TECHNIQUE = 'Pipetting Technique',
  PIPETTE_SELECTION = 'Pipette Selection',
  CONTAMINATION_PREVENTION = 'Contamination Prevention',
  STERILE_TECHNIQUE = 'Sterile Technique',
  EQUIPMENT_HANDLING = 'Equipment Handling',
}

export enum Difficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export interface QuestionOption {
  id: 'A' | 'B';
  title: string;
  description: string;
}

export interface Question {
  id: number;
  category: Category;
  difficulty: Difficulty;
  questionText: string;
  options: QuestionOption[];
  correctOptionId: 'A' | 'B';
  explanation: string;
}

export interface QuizResult {
  question: Question;
  userAnswerId: 'A' | 'B';
  isCorrect: boolean;
}


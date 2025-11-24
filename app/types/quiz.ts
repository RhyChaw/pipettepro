// Extended quiz types for generated quizzes from notes

import { Difficulty } from '../quiz/types';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  FILL_IN_BLANK = 'fill_in_blank',
  SHORT_ANSWER = 'short_answer',
  PROCEDURE_ORDERING = 'procedure_ordering',
  SAFETY_RELATED = 'safety_related',
  CALCULATION = 'calculation',
}

export interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  questionText: string;
  options?: string[]; // For multiple choice
  correctAnswer: string | number | string[]; // Can be answer text, index, or ordered array
  explanation: string;
  sourceSection?: string; // Which section of notes this came from
  tags?: string[];
}

export interface GeneratedQuiz {
  id: string;
  noteId: string;
  title: string;
  questions: GeneratedQuestion[];
  createdAt: string;
  difficulty: Difficulty;
  estimatedTime?: number; // in minutes
}

export interface QuizResult {
  quizId: string;
  noteId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  answers: {
    questionId: string;
    userAnswer: string | number | string[];
    isCorrect: boolean;
  }[];
  completedAt: string;
}


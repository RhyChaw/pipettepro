'use client';

import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import HomeScreen from './components/HomeScreenPage';
import QuizScreen from './components/QuizScreen';
import ResultsScreen from './components/ResultsScreen';
import { Category, Difficulty, QuizResult } from './types';

type QuizState = 'home' | 'quiz' | 'results';

export default function QuizPage() {
  const [quizState, setQuizState] = useState<QuizState>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);

  const handleStartQuiz = (category: Category, difficulty: Difficulty) => {
    setSelectedCategory(category);
    setSelectedDifficulty(difficulty);
    setQuizState('quiz');
    setQuizResults([]);
  };

  const handleQuizComplete = (results: QuizResult[]) => {
    setQuizResults(results);
    setQuizState('results');
  };

  const handleNewQuiz = () => {
    setQuizState('home');
    setSelectedCategory(null);
    setSelectedDifficulty(null);
    setQuizResults([]);
  };

  return (
    <DashboardLayout>
      <div>
        {quizState === 'home' && <HomeScreen onStartQuiz={handleStartQuiz} />}
        {quizState === 'quiz' && selectedCategory && selectedDifficulty && (
          <QuizScreen
            category={selectedCategory}
            difficulty={selectedDifficulty}
            onQuizComplete={handleQuizComplete}
          />
        )}
        {quizState === 'results' && (
          <ResultsScreen results={quizResults} onNewQuiz={handleNewQuiz} />
        )}
      </div>
    </DashboardLayout>
  );
}



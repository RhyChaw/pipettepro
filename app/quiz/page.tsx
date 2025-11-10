'use client';

import React, { useState } from 'react';
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
    <div 
      className="min-h-screen p-4 md:p-8"
      style={{
        backgroundImage: 'linear-gradient(to bottom right, #9448B0, #332277, #001C3D)',
        color: '#f0f0f0',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-3 text-[#D8F878]"
            >
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"></path>
            </svg>
            <span>
              Pipette<span style={{ color: '#D8F878' }}>Pro</span>
            </span>
          </h1>
          <p className="text-lg text-gray-300">Test your knowledge with interactive quizzes</p>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-lg p-6 md:p-8 border border-white/20">
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
      </div>
    </div>
  );
}


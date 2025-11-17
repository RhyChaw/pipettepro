'use client';

import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import HomeScreen from './components/HomeScreenPage';
import QuizScreen from './components/QuizScreen';
import ResultsScreen from './components/ResultsScreen';
import { Category, Difficulty, QuizResult } from './types';
import { useAuth } from '../contexts/AuthContext';

type QuizState = 'home' | 'quiz' | 'results';

export default function QuizPage() {
  const { user, updateUserProfile } = useAuth();
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
    
    // Mark step 4 as completed when quiz is finished
    if (user?.email) {
      localStorage.setItem(`quiz_completed_${user.email}`, 'true');
      // Update roadmap completion
      const stored = localStorage.getItem(`roadmap_${user.email}`);
      const completed = stored ? new Set(JSON.parse(stored)) : new Set<number>();
      completed.add(4);
      localStorage.setItem(`roadmap_${user.email}`, JSON.stringify(Array.from(completed)));
      
      // Save to Firebase
      updateUserProfile({
        roadmapProgress: Array.from(completed),
      }).catch((error) => {
        console.error('Error saving roadmap progress:', error);
      });
    }
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



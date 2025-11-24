'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import HomeScreen from './components/HomeScreenPage';
import QuizScreen from './components/QuizScreen';
import GeneratedQuizScreen, { GeneratedQuizResult } from './components/GeneratedQuizScreen';
import GeneratedQuizResultsScreen from './components/GeneratedQuizResultsScreen';
import ResultsScreen from './components/ResultsScreen';
import { Category, Difficulty, QuizResult } from './types';
import { useAuth } from '../contexts/AuthContext';
import { GeneratedQuiz } from '../types/quiz';
import Image from 'next/image';

type QuizState = 'home' | 'quiz' | 'results';

export default function QuizPage() {
  const { user, userProfile, updateUserProfile } = useAuth();
  const router = useRouter();
  const [quizState, setQuizState] = useState<QuizState>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [showQuizWelcome, setShowQuizWelcome] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
  const [generatedQuizResults, setGeneratedQuizResults] = useState<GeneratedQuizResult[]>([]);

  // Check if this is first time visiting quiz
  useEffect(() => {
    if (user?.email && quizState === 'home') {
      const hasVisitedQuiz = localStorage.getItem(`visited_quiz_${user.email}`);
      if (!hasVisitedQuiz) {
        setShowQuizWelcome(true);
      }
    }
  }, [user, quizState]);

  const handleStartQuiz = (category: Category, difficulty: Difficulty) => {
    setSelectedCategory(category);
    setSelectedDifficulty(difficulty);
    setQuizState('quiz');
    setQuizResults([]);
    setGeneratedQuiz(null);
  };

  const handleStartGeneratedQuiz = (quiz: GeneratedQuiz) => {
    setGeneratedQuiz(quiz);
    setSelectedCategory(null);
    setSelectedDifficulty(null);
    setQuizState('quiz');
    setQuizResults([]);
  };

  const handleQuizWelcomeClose = async () => {
    if (user?.email) {
      localStorage.setItem(`visited_quiz_${user.email}`, 'true');
      setShowQuizWelcome(false);
    }
  };

  const handleGeneratedQuizComplete = async (results: GeneratedQuizResult[]) => {
    setGeneratedQuizResults(results);
    setQuizState('results');
  };

  const handleQuizComplete = async (results: QuizResult[]) => {
    setQuizResults(results);
    setQuizState('results');
    
    if (!user?.email || !selectedCategory || !selectedDifficulty) return;
    
    // Calculate correct and incorrect answers
    const correct = results.filter(r => r.isCorrect).length;
    const incorrect = results.filter(r => !r.isCorrect).length;
    
    // Update quiz progress
    const currentProgress = userProfile?.quizProgress || [];
    const progressKey = `${selectedCategory}-${selectedDifficulty}`;
    const existingIndex = currentProgress.findIndex(
      p => p.category === selectedCategory && p.difficulty === selectedDifficulty
    );
    
    const updatedProgress = [...currentProgress];
    if (existingIndex >= 0) {
      updatedProgress[existingIndex] = {
        category: selectedCategory,
        difficulty: selectedDifficulty,
        correct: updatedProgress[existingIndex].correct + correct,
        incorrect: updatedProgress[existingIndex].incorrect + incorrect,
        completed: true,
      };
    } else {
      updatedProgress.push({
        category: selectedCategory,
        difficulty: selectedDifficulty,
        correct,
        incorrect,
        completed: true,
      });
    }
    
    // Check if all quizzes are completed
    const allCategories = Object.values(Category);
    const allDifficulties = Object.values(Difficulty);
    const totalQuizzes = allCategories.length * allDifficulties.length;
    const completedQuizzes = updatedProgress.filter(p => p.completed).length;
    const allQuizzesCompleted = completedQuizzes >= totalQuizzes;
    
    // Check if this is the first time completing all quizzes
    const hadAllQuizzesBefore = userProfile?.quizProgress 
      ? userProfile.quizProgress.filter(p => p.completed).length >= totalQuizzes
      : false;
    
    // Update level if all quizzes completed for the first time
    const currentLevel = userProfile?.level || 0;
    const newLevel = allQuizzesCompleted && !hadAllQuizzesBefore 
      ? currentLevel + 1 
      : currentLevel;
    
    // Mark step 4 as completed when quiz is finished
    localStorage.setItem(`quiz_completed_${user.email}`, 'true');
    const stored = localStorage.getItem(`roadmap_${user.email}`);
    const completed = stored ? new Set<number>(JSON.parse(stored) as number[]) : new Set<number>();
    completed.add(4);
    const completedArray = Array.from(completed) as number[];
    localStorage.setItem(`roadmap_${user.email}`, JSON.stringify(completedArray));
    
    // Save to Firebase
    try {
      await updateUserProfile({
        roadmapProgress: completedArray,
        quizProgress: updatedProgress,
        level: newLevel,
      });
    } catch (error) {
      console.error('Error saving quiz progress:', error);
    }
  };

  const handleNewQuiz = () => {
    setQuizState('home');
    setSelectedCategory(null);
    setSelectedDifficulty(null);
    setQuizResults([]);
    setGeneratedQuiz(null);
    setGeneratedQuizResults([]);
  };

  return (
    <DashboardLayout>
      <div>
        {/* Quiz Welcome Popup - First Time Only */}
        {showQuizWelcome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-scale-in border-4 border-blue-200">
              {/* Mascot on Cloud */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  {/* Cloud background */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-40 h-20 bg-white/90 rounded-full blur-xl"></div>
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-32 h-16 bg-white/80 rounded-full blur-lg"></div>
                  
                  {/* Mascot */}
                  <div className="relative z-10">
                    <Image
                      src="/mascot_floating.png"
                      alt="PipettePro Mascot"
                      width={128}
                      height={128}
                      className="drop-shadow-2xl"
                      unoptimized
                      priority
                    />
                  </div>
                </div>

                {/* Speech Bubble */}
                <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg animate-slide-up">
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-blue-50"></div>
                  <p className="text-slate-800 font-semibold text-lg text-center leading-relaxed">
                    Ahha! You made it to the quiz section, here you can practice your skills
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    handleQuizWelcomeClose();
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Take a quiz
                </button>
                <button
                  onClick={() => {
                    handleQuizWelcomeClose();
                    router.push('/home');
                  }}
                  className="flex-1 bg-slate-200 text-slate-700 font-semibold py-4 px-6 rounded-xl hover:bg-slate-300 transform hover:scale-105 transition-all duration-200"
                >
                  Back to home
                </button>
              </div>
            </div>
          </div>
        )}

        {quizState === 'home' && (
          <HomeScreen 
            onStartQuiz={handleStartQuiz} 
            userProfile={userProfile}
            userId={user?.email || null}
            onStartGeneratedQuiz={handleStartGeneratedQuiz}
          />
        )}
        {quizState === 'quiz' && (
          <>
            {generatedQuiz ? (
              <GeneratedQuizScreen
                quiz={generatedQuiz}
                onQuizComplete={handleGeneratedQuizComplete}
              />
            ) : selectedCategory && selectedDifficulty ? (
              <QuizScreen
                category={selectedCategory}
                difficulty={selectedDifficulty}
                onQuizComplete={handleQuizComplete}
              />
            ) : null}
          </>
        )}
        {quizState === 'results' && (
          <>
            {generatedQuiz && generatedQuizResults.length > 0 ? (
              <GeneratedQuizResultsScreen
                quiz={generatedQuiz}
                results={generatedQuizResults}
                onNewQuiz={handleNewQuiz}
              />
            ) : (
              <ResultsScreen results={quizResults} onNewQuiz={handleNewQuiz} />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}



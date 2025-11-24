'use client';

import React, { useState, useEffect } from 'react';
import { Category, Difficulty } from '../types';
import { DnaIcon, PipetteIcon, BookOpenIcon, ChevronRightIcon } from './icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import { GeneratedQuiz } from '../../types/quiz';

interface QuizProgress {
  category: string;
  difficulty: string;
  correct: number;
  incorrect: number;
  completed: boolean;
}

interface UserProfile {
  quizProgress?: QuizProgress[];
  level?: number;
  highestLevel?: number;
}

interface HomeScreenProps {
  onStartQuiz: (category: Category, difficulty: Difficulty) => void;
  userProfile?: UserProfile | null;
  userId?: string | null;
  onStartGeneratedQuiz?: (quiz: GeneratedQuiz) => void;
}

const categoryIcons: { [key in Category]: React.ReactNode } = {
  [Category.PIPETTING_TECHNIQUE]: <PipetteIcon className="w-12 h-12" />,
  [Category.PIPETTE_SELECTION]: <PipetteIcon className="w-12 h-12" />,
  [Category.CONTAMINATION_PREVENTION]: <DnaIcon className="w-12 h-12" />,
  [Category.STERILE_TECHNIQUE]: <BookOpenIcon className="w-12 h-12" />,
  [Category.EQUIPMENT_HANDLING]: <PipetteIcon className="w-12 h-12" />,
};

const difficultyColors: { [key in Difficulty]: string } = {
  [Difficulty.BEGINNER]: 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-2 border-slate-300',
  [Difficulty.INTERMEDIATE]: 'bg-slate-700 hover:bg-slate-800 text-white border-2 border-slate-700',
  [Difficulty.ADVANCED]: 'bg-slate-900 hover:bg-slate-950 text-white border-2 border-slate-900',
};


const HomeScreen: React.FC<HomeScreenProps> = ({ onStartQuiz, userProfile, userId, onStartGeneratedQuiz }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [userQuizzes, setUserQuizzes] = useState<GeneratedQuiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  const categories = Object.values(Category);
  const difficulties = Object.values(Difficulty);
  
  // Get quizzes with mistakes
  const quizzesWithMistakes = userProfile?.quizProgress?.filter(
    p => p.incorrect > 0 && p.completed
  ) || [];

  // Load user's generated quizzes
  useEffect(() => {
    if (userId) {
      loadUserQuizzes();
    }
  }, [userId]);

  const loadUserQuizzes = async () => {
    if (!userId) return;
    
    setLoadingQuizzes(true);
    try {
      const quizzesRef = collection(db, 'userQuizzes');
      // Query without orderBy first to avoid index requirement, then sort in memory
      const q = query(quizzesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const quizzesData: GeneratedQuiz[] = [];
      querySnapshot.forEach((doc) => {
        quizzesData.push({ id: doc.id, ...doc.data() } as GeneratedQuiz);
      });
      // Sort by createdAt in memory (descending)
      quizzesData.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      setUserQuizzes(quizzesData);
    } catch (error) {
      console.error('Error loading user quizzes:', error);
      // If error is about index, show empty array (user can still use the app)
      setUserQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleDifficultySelect = (difficulty: Difficulty) => {
    if (selectedCategory) {
      onStartQuiz(selectedCategory, difficulty);
    }
  };

  const handleBack = () => {
      setSelectedCategory(null);
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {!selectedCategory ? (
        <>
          {/* Your Quizzes Section */}
          {loadingQuizzes ? (
            <div className="mb-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Your Quizzes</h3>
              <p className="text-slate-700">Loading your quizzes...</p>
            </div>
          ) : userQuizzes.length > 0 ? (
            <div className="mb-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Your Quizzes</h3>
              <p className="text-slate-700 mb-4">Quizzes generated from your notes:</p>
              <div className="space-y-2">
                {userQuizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    onClick={() => {
                      if (onStartGeneratedQuiz) {
                        onStartGeneratedQuiz(quiz);
                      }
                    }}
                    className="w-full text-left bg-white border-2 border-blue-300 rounded-lg p-4 hover:bg-blue-100 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-900">{quiz.title}</p>
                        <p className="text-sm text-slate-700">
                          {quiz.questions.length} questions • {quiz.difficulty} • {new Date(quiz.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-slate-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Your Quizzes</h3>
              <p className="text-slate-700">You haven't made any custom quizzes yet. Generate quizzes from your scanned notes to see them here!</p>
            </div>
          )}

          {/* Review Mistakes Section */}
          {quizzesWithMistakes.length > 0 && (
            <div className="mb-8 bg-red-50 border-2 border-red-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Review Quiz Mistakes</h3>
              <p className="text-slate-700 mb-4">Practice these quizzes again to improve your score:</p>
              <div className="space-y-2">
                {quizzesWithMistakes.map((quiz, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const category = quiz.category as Category;
                      const difficulty = quiz.difficulty as Difficulty;
                      if (Object.values(Category).includes(category) && Object.values(Difficulty).includes(difficulty)) {
                        onStartQuiz(category, difficulty);
                      }
                    }}
                    className="w-full text-left bg-white border-2 border-red-300 rounded-lg p-4 hover:bg-red-100 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-900">{quiz.category} - {quiz.difficulty}</p>
                        <p className="text-sm text-slate-700">
                          Correct: {quiz.correct} | Incorrect: {quiz.incorrect}
                        </p>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-slate-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Select a Category</h2>
            <p className="text-slate-700">Choose a topic to begin your quiz</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className="group bg-white border-2 border-slate-200 p-6 rounded-lg hover:border-slate-400 hover:shadow-md transition-all duration-200 text-left flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                   <div className="text-slate-700">
                     {categoryIcons[category as Category]}
                   </div>
                   <div>
                    <h3 className="text-base font-semibold text-slate-900">{category as string}</h3>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div>
          <button onClick={handleBack} className="text-slate-700 hover:text-slate-900 font-medium mb-6 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Categories
          </button>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Select Difficulty</h2>
            <p className="text-slate-700">Category: <span className="font-medium text-slate-900">{selectedCategory}</span></p>
          </div>
          <div className="flex flex-col md:flex-row justify-start items-stretch gap-4 max-w-2xl">
            {difficulties.map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => handleDifficultySelect(difficulty)}
                className={`flex-1 font-medium py-4 px-6 rounded-lg transition-all duration-200 ${difficultyColors[difficulty as Difficulty]}`}
              >
                {difficulty as string}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;

'use client';

import React, { useState } from 'react';
import { Category, Difficulty } from '../types';
import { DnaIcon, PipetteIcon, BookOpenIcon, ChevronRightIcon } from './icons';

interface HomeScreenProps {
  onStartQuiz: (category: Category, difficulty: Difficulty) => void;
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


const HomeScreen: React.FC<HomeScreenProps> = ({ onStartQuiz }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const categories = Object.values(Category);
  const difficulties = Object.values(Difficulty);

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
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Select a Category</h2>
            <p className="text-slate-600">Choose a topic to begin your quiz</p>
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
                <ChevronRightIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div>
          <button onClick={handleBack} className="text-slate-600 hover:text-slate-900 font-medium mb-6 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Categories
          </button>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Select Difficulty</h2>
            <p className="text-slate-600">Category: <span className="font-medium text-slate-900">{selectedCategory}</span></p>
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

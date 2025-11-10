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
  [Difficulty.BEGINNER]: 'bg-[#D8F878] hover:bg-[#C8E868] text-[#001C3D]',
  [Difficulty.INTERMEDIATE]: 'bg-[#E47CB8] hover:bg-[#D46CA8] text-white',
  [Difficulty.ADVANCED]: 'bg-[#9448B0] hover:bg-[#A058C0] text-white',
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
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      {!selectedCategory ? (
        <>
          <h2 className="text-3xl font-bold text-slate-700 text-center mb-2">Select a Category</h2>
          <p className="text-slate-500 text-center mb-8">Choose a topic to begin your training.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                   <div className="text-[#9448B0] group-hover:text-[#D8F878] transition-colors">
                     {categoryIcons[category as Category]}
                   </div>
                   <div>
                    <h3 className="text-lg font-semibold text-slate-800">{category as string}</h3>
                  </div>
                </div>
                <ChevronRightIcon className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div>
          <button onClick={handleBack} className="text-[#9448B0] hover:text-[#A058C0] font-semibold mb-6">&larr; Back to Categories</button>
          <h2 className="text-3xl font-bold text-slate-700 text-center mb-2">Select Difficulty</h2>
          <p className="text-slate-500 text-center mb-8">You chose: <span className="font-semibold text-[#9448B0]">{selectedCategory}</span></p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6">
            {difficulties.map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => handleDifficultySelect(difficulty)}
                className={`w-full md:w-auto font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ${difficultyColors[difficulty as Difficulty]}`}
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

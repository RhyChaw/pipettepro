'use client';

import React, { useState, useEffect } from 'react';
import { QUESTIONS } from '../constants';
import { Category, Difficulty, Question, QuizResult, QuestionOption } from '../types';
import { CheckIcon, XIcon } from './icons';

interface QuizScreenProps {
  category: Category;
  difficulty: Difficulty;
  onQuizComplete: (results: QuizResult[]) => void;
}

// Define the component outside of QuizScreen to prevent re-creation on re-renders
const OptionCard: React.FC<{
  option: QuestionOption;
  onClick: () => void;
  isSelected: boolean;
  isCorrect: boolean;
  isRevealed: boolean;
}> = ({ option, onClick, isSelected, isCorrect, isRevealed }) => {
  const getBorderColor = () => {
    if (!isRevealed) {
      return isSelected ? 'border-[#9448B0] ring-2 ring-[#9448B0]' : 'border-slate-300 hover:border-[#9448B0]';
    }
    if (isCorrect) {
      return 'border-green-500 ring-2 ring-green-500';
    }
    if (isSelected && !isCorrect) {
      return 'border-red-500 ring-2 ring-red-500';
    }
    return 'border-slate-300';
  };

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl shadow-md p-6 transition-all duration-300 cursor-pointer border-2 ${getBorderColor()}`}
    >
      <h3 className="text-lg font-bold text-slate-800 flex items-center">
        <span className="text-xl mr-3 font-black text-[#9448B0]">{option.id}</span>
        {option.title}
      </h3>
      <p className="text-slate-600 mt-1 pl-8">{option.description}</p>
      {isRevealed && (
        <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white ${isCorrect ? 'bg-green-500' : isSelected ? 'bg-red-500' : 'hidden'}`}>
          {isCorrect ? <CheckIcon className="w-5 h-5" /> : <XIcon className="w-5 h-5" />}
        </div>
      )}
    </div>
  );
};


const QuizScreen: React.FC<QuizScreenProps> = ({ category, difficulty, onQuizComplete }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);

  useEffect(() => {
    const filteredQuestions = QUESTIONS.filter(
      (q) => q.category === category && q.difficulty === difficulty
    );
    // Shuffle and take up to 10 questions
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setQuestions(shuffled.slice(0, 10));
    }, 0);
  }, [category, difficulty]);

  const handleAnswerSelect = (optionId: 'A' | 'B') => {
    if (isAnswerRevealed) return;
    setSelectedAnswer(optionId);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctOptionId;
    
    setResults([...results, { question: currentQuestion, userAnswerId: selectedAnswer, isCorrect }]);
    setIsAnswerRevealed(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
    } else {
      onQuizComplete(results);
    }
  };
  
  if (questions.length === 0) {
    return <div className="text-center p-8">Loading questions... If none appear, there may be no questions for this category/difficulty combination.</div>;
  }

  const question = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex) / questions.length) * 100;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2 text-slate-600 font-semibold">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{difficulty}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div className="bg-linear-to-r from-[#9448B0] to-[#332277] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        {/* Question */}
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 text-center mb-8">{question.questionText}</h2>
        
        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {question.options.map((option: QuestionOption) => (
            <OptionCard
              key={option.id}
              option={option}
              onClick={() => handleAnswerSelect(option.id)}
              isSelected={selectedAnswer === option.id}
              isCorrect={option.id === question.correctOptionId}
              isRevealed={isAnswerRevealed}
            />
          ))}
        </div>

        {/* Feedback and Actions */}
        {isAnswerRevealed && (
          <div className="bg-slate-100 rounded-lg p-4 my-6 text-slate-700 animate-fade-in">
            <h4 className="font-bold text-lg mb-2">Explanation</h4>
            <p>{question.explanation}</p>
          </div>
        )}
        
        <div className="text-center mt-6">
          {!isAnswerRevealed ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className="bg-[#9448B0] text-white font-bold py-3 px-12 rounded-lg shadow-md hover:bg-[#A058C0] transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="bg-[#D8F878] text-[#001C3D] font-bold py-3 px-12 rounded-lg shadow-md hover:bg-[#C8E868] transition-all animate-fade-in"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizScreen;

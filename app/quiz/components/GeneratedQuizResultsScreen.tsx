'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GeneratedQuiz, GeneratedQuestion } from '../../types/quiz';
import { GeneratedQuizResult } from './GeneratedQuizScreen';

interface GeneratedQuizResultsScreenProps {
  quiz: GeneratedQuiz;
  results: GeneratedQuizResult[];
  onNewQuiz: () => void;
}

const GeneratedQuizResultsScreen: React.FC<GeneratedQuizResultsScreenProps> = ({ quiz, results, onNewQuiz }) => {
  const router = useRouter();
  const [reviewing, setReviewing] = useState(false);
  const correctAnswers = results.filter(r => r.isCorrect).length;
  const totalQuestions = results.length;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const incorrectResults = results.filter(r => !r.isCorrect);

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getAnswerDisplay = (answer: string | number | string[]): string => {
    if (Array.isArray(answer)) {
      return answer.join(' → ');
    }
    return String(answer);
  };

  if (reviewing) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4 md:p-8">
        <button 
          onClick={() => setReviewing(false)} 
          className="text-[#9448B0] hover:text-[#A058C0] font-semibold mb-6"
        >
          &larr; Back to Results
        </button>
        <h2 className="text-3xl font-bold text-slate-700 text-center mb-6">Review Incorrect Answers</h2>
        <div className="space-y-6">
          {incorrectResults.length > 0 ? incorrectResults.map((result, index) => {
            const question = result.question;
            const correctAnswer = Array.isArray(question.correctAnswer) 
              ? question.correctAnswer.join(' → ')
              : typeof question.correctAnswer === 'number' && question.options
                ? question.options[question.correctAnswer]
                : String(question.correctAnswer);

            return (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-lg font-semibold text-slate-800 mb-2">{question.questionText}</p>
                <p className="text-sm text-slate-700 mb-4">
                  You answered: <span className="font-bold text-red-600">{getAnswerDisplay(result.userAnswer)}</span>
                </p>
                <p className="text-sm text-slate-700 mb-4">
                  Correct answer: <span className="font-bold text-green-600">{correctAnswer}</span>
                </p>
                <div className="bg-slate-100 rounded p-4">
                  <h4 className="font-bold text-slate-700 mb-2">Explanation:</h4>
                  <p className="text-slate-700">{question.explanation}</p>
                </div>
              </div>
            );
          }) : (
            <p className="text-center text-slate-700">No incorrect answers to review. Great job!</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-8 text-center">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-slate-700 mb-2">Quiz Complete!</h2>
        <p className="text-slate-700 mb-2">{quiz.title}</p>
        <p className="text-slate-600 mb-6">Here&apos;s how you performed.</p>
        
        <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
          <svg className="absolute w-full h-full" viewBox="0 0 36 36">
            <path
              className="text-slate-200"
              d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className={getScoreColor()}
              d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${score}, 100`}
              strokeLinecap="round"
              transform="rotate(270 18 18)"
            />
          </svg>
          <span className={`text-5xl font-bold ${getScoreColor()}`}>{score}%</span>
        </div>

        <p className="text-xl text-slate-700 font-semibold">{correctAnswers} / {totalQuestions} Correct</p>

        <div className="border-t my-8"></div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onNewQuiz}
            className="w-full bg-[#9448B0] text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-[#A058C0] transition-all"
          >
            Start New Quiz
          </button>
          {incorrectResults.length > 0 && (
            <button
              onClick={() => setReviewing(true)}
              className="w-full bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-lg hover:bg-slate-300 transition-all"
            >
              Review Incorrect ({incorrectResults.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratedQuizResultsScreen;


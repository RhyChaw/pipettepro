'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GeneratedQuiz, GeneratedQuestion, QuestionType } from '../../types/quiz';
import { CheckIcon, XIcon } from './icons';
import AudioPlayer from '../../components/AudioPlayer';

interface GeneratedQuizScreenProps {
  quiz: GeneratedQuiz;
  onQuizComplete: (results: GeneratedQuizResult[]) => void;
}

export interface GeneratedQuizResult {
  question: GeneratedQuestion;
  userAnswer: string | number | string[];
  isCorrect: boolean;
}

const GeneratedQuizScreen: React.FC<GeneratedQuizScreenProps> = ({ quiz, onQuizComplete }) => {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | string[] | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [results, setResults] = useState<GeneratedQuizResult[]>([]);

  const question = quiz.questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex) / quiz.questions.length) * 100;

  const handleAnswerSelect = (answer: string | number) => {
    if (isAnswerRevealed) return;
    setSelectedAnswer(answer);
  };

  const handleTextAnswerChange = (value: string) => {
    if (isAnswerRevealed) return;
    setTextAnswer(value);
  };

  const checkAnswer = (userAnswer: string | number | string[], correctAnswer: string | number | string[]): boolean => {
    if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
      return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
    }
    if (typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
      return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    }
    return userAnswer === correctAnswer;
  };

  const handleSubmit = () => {
    let userAnswer: string | number | string[];
    
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      if (selectedAnswer === null) return;
      userAnswer = selectedAnswer;
    } else if (question.type === QuestionType.FILL_IN_BLANK || question.type === QuestionType.SHORT_ANSWER) {
      if (!textAnswer.trim()) return;
      userAnswer = textAnswer.trim();
    } else {
      // For other types, use selectedAnswer or textAnswer
      userAnswer = selectedAnswer !== null ? selectedAnswer : textAnswer.trim();
    }

    const isCorrect = checkAnswer(userAnswer, question.correctAnswer);
    const newResults = [...results, { question, userAnswer, isCorrect }];
    
    setResults(newResults);
    setIsAnswerRevealed(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTextAnswer('');
      setIsAnswerRevealed(false);
    } else {
      // This is the last question, complete the quiz
      onQuizComplete(results);
    }
  };

  const getQuestionTypeLabel = (type: QuestionType): string => {
    const labels: Record<QuestionType, string> = {
      [QuestionType.MULTIPLE_CHOICE]: 'Multiple Choice',
      [QuestionType.FILL_IN_BLANK]: 'Fill in the Blank',
      [QuestionType.SHORT_ANSWER]: 'Short Answer',
      [QuestionType.PROCEDURE_ORDERING]: 'Procedure Ordering',
      [QuestionType.SAFETY_RELATED]: 'Safety Question',
      [QuestionType.CALCULATION]: 'Calculation',
    };
    return labels[type] || 'Question';
  };

  const isAnswerSelected = () => {
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      return selectedAnswer !== null;
    }
    return textAnswer.trim().length > 0;
  };

  const getCorrectAnswerDisplay = (): string => {
    if (Array.isArray(question.correctAnswer)) {
      return question.correctAnswer.join(' → ');
    }
    if (typeof question.correctAnswer === 'number' && question.options) {
      return question.options[question.correctAnswer];
    }
    return String(question.correctAnswer);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{quiz.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-700">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
              {quiz.difficulty}
            </span>
            <span>{getQuestionTypeLabel(question.type)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2 text-slate-700 font-semibold">
            <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-[#9448B0] to-[#332277] h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 text-center flex-1">
            {question.questionText}
          </h2>
          <AudioPlayer text={question.questionText} size="md" />
        </div>
        
        {/* Options - Multiple Choice */}
        {question.type === QuestionType.MULTIPLE_CHOICE && question.options && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {question.options.map((option, idx) => {
              const optionId = idx;
              const isSelected = selectedAnswer === optionId;
              const isCorrect = optionId === question.correctAnswer;
              
              return (
                <div
                  key={idx}
                  onClick={() => handleAnswerSelect(optionId)}
                  className={`relative bg-white rounded-xl shadow-md p-6 transition-all duration-300 cursor-pointer border-2 ${
                    !isAnswerRevealed
                      ? isSelected 
                        ? 'border-[#9448B0] ring-2 ring-[#9448B0]' 
                        : 'border-slate-300 hover:border-[#9448B0]'
                      : isCorrect
                        ? 'border-green-500 ring-2 ring-green-500'
                        : isSelected && !isCorrect
                          ? 'border-red-500 ring-2 ring-red-500'
                          : 'border-slate-300'
                  }`}
                >
                  <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <span className="text-xl mr-3 font-black text-[#9448B0]">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </h3>
                  {isAnswerRevealed && (
                    <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white ${
                      isCorrect ? 'bg-green-500' : isSelected ? 'bg-red-500' : 'hidden'
                    }`}>
                      {isCorrect ? <CheckIcon className="w-5 h-5" /> : <XIcon className="w-5 h-5" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Text Input - Fill in Blank / Short Answer */}
        {(question.type === QuestionType.FILL_IN_BLANK || question.type === QuestionType.SHORT_ANSWER) && (
          <div className="mb-6">
            <textarea
              value={textAnswer}
              onChange={(e) => handleTextAnswerChange(e.target.value)}
              disabled={isAnswerRevealed}
              placeholder={question.type === QuestionType.FILL_IN_BLANK ? 'Type your answer...' : 'Write your answer...'}
              className="w-full p-4 border-2 border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9448B0] focus:border-[#9448B0] disabled:bg-slate-100 disabled:cursor-not-allowed"
              rows={question.type === QuestionType.SHORT_ANSWER ? 4 : 2}
            />
            {isAnswerRevealed && (
              <div className={`mt-4 p-4 rounded-lg ${
                checkAnswer(textAnswer.trim(), question.correctAnswer) 
                  ? 'bg-green-50 border-2 border-green-200' 
                  : 'bg-red-50 border-2 border-red-200'
              }`}>
                <p className="font-semibold text-slate-900 mb-1">
                  {checkAnswer(textAnswer.trim(), question.correctAnswer) ? 'Correct!' : 'Incorrect'}
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Your answer:</span> {textAnswer || '(no answer)'}
                </p>
                <p className="text-sm text-slate-700 mt-1">
                  <span className="font-semibold">Correct answer:</span> {getCorrectAnswerDisplay()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Feedback and Actions */}
        {isAnswerRevealed && question.explanation && (
          <div className="bg-slate-100 rounded-lg p-4 my-6 text-slate-700 animate-fade-in">
            <div className="flex items-start gap-2 mb-2">
              <h4 className="font-bold text-lg">Explanation</h4>
              <AudioPlayer text={question.explanation} size="sm" />
            </div>
            <p>{question.explanation}</p>
          </div>
        )}
        
        <div className="text-center mt-6">
          {!isAnswerRevealed ? (
            <button
              onClick={handleSubmit}
              disabled={!isAnswerSelected()}
              className="bg-[#9448B0] text-white font-bold py-3 px-12 rounded-lg shadow-md hover:bg-[#A058C0] transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={() => {
                if (currentQuestionIndex < quiz.questions.length - 1) {
                  handleNextQuestion();
                } else {
                  // Complete quiz with all results (including current question)
                  onQuizComplete(results);
                }
              }}
              className="bg-[#D8F878] text-[#001C3D] font-bold py-3 px-12 rounded-lg shadow-md hover:bg-[#C8E868] transition-all animate-fade-in"
            >
              {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratedQuizScreen;


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { FlashcardSet, Flashcard } from '../types/flashcards';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import AudioPlayer from '../components/AudioPlayer';

export default function FlashcardsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (user?.email) {
      loadFlashcardSets();
    }
  }, [user]);

  const loadFlashcardSets = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      const setsRef = collection(db, 'userFlashcards');
      const q = query(setsRef, where('userId', '==', user.email));
      const querySnapshot = await getDocs(q);
      const setsData: FlashcardSet[] = [];
      querySnapshot.forEach((doc) => {
        setsData.push({ id: doc.id, ...doc.data() } as FlashcardSet);
      });
      // Sort by createdAt in memory (descending)
      setsData.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      setFlashcardSets(setsData);
    } catch (error) {
      console.error('Error loading flashcard sets:', error);
      setFlashcardSets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = (set: FlashcardSet) => {
    setSelectedSet(set);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
  };

  const handleNextCard = () => {
    if (selectedSet && currentCardIndex < selectedSet.flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setShowAnswer(!showAnswer);
  };

  const handleBackToSets = () => {
    setSelectedSet(null);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-700 text-xl">Loading flashcards...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Practice View
  if (selectedSet) {
    const currentCard = selectedSet.flashcards[currentCardIndex];
    const progress = ((currentCardIndex + 1) / selectedSet.flashcards.length) * 100;

    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={handleBackToSets}
              className="text-slate-700 hover:text-slate-900 font-medium mb-4 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Flashcard Sets
            </button>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">{selectedSet.title}</h1>
                  <p className="text-sm text-slate-700">
                    Card {currentCardIndex + 1} of {selectedSet.flashcards.length}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedSet.noteId && (
                    <button
                      onClick={() => router.push(`/notes`)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      View Source Note
                    </button>
                  )}
                  <button
                    onClick={handleBackToSets}
                    className="text-sm text-slate-600 hover:text-slate-700 font-semibold"
                  >
                    All Sets
                  </button>
                </div>
              </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#9448B0] to-[#332277] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Flashcard */}
          <div className="mb-8">
            <div
              onClick={handleFlip}
              className="bg-white rounded-2xl shadow-xl p-12 min-h-[400px] flex items-center justify-center cursor-pointer transform transition-all hover:scale-[1.02]"
            >
              {!isFlipped ? (
                <div className="p-8 text-center w-full">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Front</p>
                    <AudioPlayer text={currentCard.front} size="sm" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">{currentCard.front}</h2>
                  {currentCard.difficulty && (
                    <span className={`inline-block mt-4 px-3 py-1 rounded-full text-xs font-semibold ${
                      currentCard.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      currentCard.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {currentCard.difficulty}
                    </span>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center w-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Back</p>
                    <AudioPlayer text={currentCard.back} size="sm" />
                  </div>
                  <p className="text-xl text-slate-900 leading-relaxed">{currentCard.back}</p>
                </div>
              )}
            </div>
            <p className="text-center text-sm text-slate-600 mt-4">Click card to flip</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousCard}
              disabled={currentCardIndex === 0}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button
              onClick={handleFlip}
              className="px-6 py-3 bg-[#9448B0] text-white rounded-lg font-semibold hover:bg-[#A058C0] transition-colors"
            >
              {isFlipped ? 'Show Question' : 'Show Answer'}
            </button>
            <button
              onClick={handleNextCard}
              disabled={currentCardIndex === selectedSet.flashcards.length - 1}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Sets List View
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">My Flashcards</h1>
            <p className="text-slate-700 mt-1">Practice with flashcards generated from your notes</p>
          </div>
          <button
            onClick={() => router.push('/your-docs')}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
          >
            + Generate New Flashcards
          </button>
        </div>

        {flashcardSets.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
            <p className="text-slate-700 text-lg mb-4">No flashcard sets yet.</p>
            <p className="text-sm text-slate-600 mb-6">Generate flashcards from your scanned notes to see them here.</p>
            <button
              onClick={() => router.push('/your-docs')}
              className="px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
            >
              Generate Your First Flashcards
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flashcardSets.map((set) => (
              <div
                key={set.id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleStartPractice(set)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 text-lg line-clamp-2 flex-1">{set.title}</h3>
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold ml-2">
                      {set.flashcards.length} cards
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mb-4">
                    {new Date(set.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartPractice(set);
                      }}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors text-sm"
                    >
                      Practice
                    </button>
                    {set.noteId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/notes`);
                        }}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors text-sm"
                        title="View source note"
                      >
                        View Note
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { ProcessingResult, NoteSection, NoteSectionType, ExtractedNote } from '../types/notes';
import { GeneratedQuiz } from '../types/quiz';
import { SimulationScenario } from '../types/simulation';
import { FlashcardSet } from '../types/flashcards';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';

export default function YourDocsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [activeTab, setActiveTab] = useState<'raw' | 'cleaned' | 'sections'>('sections');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
  const [generatedScenario, setGeneratedScenario] = useState<SimulationScenario | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<FlashcardSet | null>(null);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [savedNotes, setSavedNotes] = useState<ExtractedNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [lastSavedNoteId, setLastSavedNoteId] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setTextInput('');
    setProcessingResult(null);
    setError(null);
  };

  const handleTextInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(event.target.value);
    setSelectedFile(null);
    setProcessingResult(null);
    setError(null);
  };

  const processDocument = async () => {
    if (!user?.email) {
      setError('Please log in to process documents.');
      return;
    }

    if (!selectedFile && !textInput.trim()) {
      setError('Please upload a file or enter text.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingResult(null);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('text', textInput);
      }

      const response = await fetch('/api/scan/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process document');
      }

      const result: ProcessingResult = await response.json();
      setProcessingResult(result);
      setActiveTab('sections');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process document. Please try again.';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToNotes = async () => {
    if (!user?.email || !processingResult) {
      setError('Please process a document first.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const noteTitle = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'Scanned Notes';
      
      const noteData = {
        title: noteTitle,
        originalFileName: selectedFile?.name || 'text-input.txt',
        rawText: processingResult.rawText,
        cleanedText: processingResult.cleanedText,
        sections: processingResult.sections,
        tags: extractTags(processingResult.sections),
        date: new Date().toISOString(),
      };

      const response = await fetch('/api/notes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.email,
          note: noteData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save note');
      }

      const saveData = await response.json();
      const savedNoteId = saveData.noteId;
      setLastSavedNoteId(savedNoteId); // Store for flashcard linking

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        router.push('/notes');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save note. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateQuiz = useCallback(async () => {
    if (!processingResult || !user?.email) {
      setError('Please process a document first.');
      return;
    }

    setIsGeneratingQuiz(true);
    setError(null);

    try {
      const response = await fetch('/api/notes/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteContent: processingResult.cleanedText,
          sections: processingResult.sections,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate quiz');
      }

      const quiz: GeneratedQuiz = await response.json();
      
      // Save quiz to userQuizzes table
      const saveResponse = await fetch('/api/quizzes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.email,
          quiz: {
            ...quiz,
            noteId: '', // Will be set if saving from a note
          },
        }),
      });

      if (saveResponse.ok) {
        const saveData = await saveResponse.json();
        quiz.id = saveData.quizId || quiz.id;
      }

      setGeneratedQuiz(quiz);
      setShowQuizModal(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate quiz. Please try again.';
      setError(errorMessage);
    } finally {
      setIsGeneratingQuiz(false);
    }
  }, [processingResult, user]);

  const handleGenerateScenario = useCallback(async () => {
    if (!processingResult) {
      setError('Please process a document first.');
      return;
    }

    setIsGeneratingScenario(true);
    setError(null);

    try {
      const response = await fetch('/api/notes/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteContent: processingResult.cleanedText,
          sections: processingResult.sections,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate scenario');
      }

      const scenario: SimulationScenario = await response.json();
      setGeneratedScenario(scenario);
      setShowScenarioModal(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate scenario. Please try again.';
      setError(errorMessage);
    } finally {
      setIsGeneratingScenario(false);
    }
  }, [processingResult]);

  const handleGenerateFlashcards = useCallback(async () => {
    if (!processingResult || !user?.email) {
      setError('Please process a document first.');
      return;
    }

    setIsGeneratingFlashcards(true);
    setError(null);

    try {
      const response = await fetch('/api/notes/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteContent: processingResult.cleanedText,
          sections: processingResult.sections,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate flashcards');
      }

      const flashcardSet: FlashcardSet = await response.json();
      flashcardSet.userId = user.email;
      
      // Get noteId from URL params, last saved note, or try to find matching note
      const params = new URLSearchParams(window.location.search);
      const noteIdFromUrl = params.get('noteId');
      
      let noteIdToLink = noteIdFromUrl || lastSavedNoteId;
      
      // If no noteId yet, try to find a matching note by title/content
      if (!noteIdToLink && processingResult) {
        const matchingNote = savedNotes.find(note => 
          note.cleanedText === processingResult.cleanedText ||
          note.title === (selectedFile?.name.replace(/\.[^/.]+$/, '') || 'Scanned Notes')
        );
        if (matchingNote) {
          noteIdToLink = matchingNote.id;
        }
      }
      
      if (noteIdToLink) {
        flashcardSet.noteId = noteIdToLink;
      }
      
      // Save flashcards to Firestore
      const saveResponse = await fetch('/api/flashcards/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.email,
          flashcardSet,
        }),
      });

      if (saveResponse.ok) {
        const saveData = await saveResponse.json();
        flashcardSet.id = saveData.setId || flashcardSet.id;
      }

      setGeneratedFlashcards(flashcardSet);
      setShowFlashcardModal(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate flashcards. Please try again.';
      setError(errorMessage);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  }, [processingResult, user, savedNotes, selectedFile, lastSavedNoteId]);

  const extractTags = (sections: NoteSection[]): string[] => {
    const tags = new Set<string>();
    sections.forEach((section) => {
      tags.add(section.type);
      // Extract keywords from section content
      const words = section.content.toLowerCase().match(/\b\w{4,}\b/g) || [];
      words.slice(0, 3).forEach((word) => tags.add(word));
    });
    return Array.from(tags).slice(0, 10);
  };

  const getSectionTypeLabel = (type: NoteSectionType): string => {
    const labels: Record<NoteSectionType, string> = {
      [NoteSectionType.MATERIALS]: 'Materials',
      [NoteSectionType.EQUIPMENT]: 'Equipment',
      [NoteSectionType.PROCEDURE_STEPS]: 'Procedure Steps',
      [NoteSectionType.SAFETY_NOTES]: 'Safety Notes',
      [NoteSectionType.CALCULATIONS]: 'Calculations',
      [NoteSectionType.CONCEPTUAL_THEORY]: 'Conceptual Theory',
      [NoteSectionType.TROUBLESHOOTING]: 'Troubleshooting',
      [NoteSectionType.OTHER]: 'Other',
    };
    return labels[type] || 'Other';
  };

  const getSectionTypeColor = (type: NoteSectionType): string => {
    const colors: Record<NoteSectionType, string> = {
      [NoteSectionType.MATERIALS]: 'bg-blue-100 text-blue-800',
      [NoteSectionType.EQUIPMENT]: 'bg-green-100 text-green-800',
      [NoteSectionType.PROCEDURE_STEPS]: 'bg-purple-100 text-purple-800',
      [NoteSectionType.SAFETY_NOTES]: 'bg-red-100 text-red-800',
      [NoteSectionType.CALCULATIONS]: 'bg-yellow-100 text-yellow-800',
      [NoteSectionType.CONCEPTUAL_THEORY]: 'bg-indigo-100 text-indigo-800',
      [NoteSectionType.TROUBLESHOOTING]: 'bg-orange-100 text-orange-800',
      [NoteSectionType.OTHER]: 'bg-slate-100 text-slate-800',
    };
    return colors[type] || 'bg-slate-100 text-slate-800';
  };

  // Check for URL params to load note and trigger action
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('noteId');
    const action = params.get('action');
    
    if (noteId && user?.email) {
      // Load note from Firestore
      fetch(`/api/notes/save?userId=${user.email}&noteId=${noteId}`)
        .then(res => res.json())
        .then(data => {
          if (data.note) {
            const note = data.note as ExtractedNote;
            const result: ProcessingResult = {
              rawText: note.rawText,
              cleanedText: note.cleanedText,
              sections: note.sections,
              metadata: {
                fileName: note.originalFileName,
                fileSize: 0,
                fileType: 'text/plain',
                uploadedAt: note.createdAt,
                processedAt: note.updatedAt,
                status: 'completed',
              },
            };
            setProcessingResult(result);
            setActiveTab('sections');
            
            // Trigger action if specified
            if (action === 'quiz') {
              setTimeout(() => handleGenerateQuiz(), 500);
            } else if (action === 'scenario') {
              setTimeout(() => handleGenerateScenario(), 500);
            } else if (action === 'flashcards') {
              setTimeout(() => handleGenerateFlashcards(), 500);
            }
          }
        })
        .catch(err => console.error('Error loading note:', err));
    }
  }, [user, handleGenerateQuiz, handleGenerateScenario, handleGenerateFlashcards]);

  const loadSavedNotes = useCallback(async () => {
    if (!user?.email) return;

    setLoadingNotes(true);
    try {
      const notesRef = collection(db, 'userNotes');
      const q = query(notesRef, where('userId', '==', user.email));
      const querySnapshot = await getDocs(q);
      const notesData: ExtractedNote[] = [];
      querySnapshot.forEach((doc) => {
        notesData.push({ id: doc.id, ...doc.data() } as ExtractedNote);
      });
      // Sort by createdAt in memory (descending)
      notesData.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      setSavedNotes(notesData);
    } catch (error) {
      console.error('Error loading saved notes:', error);
      setSavedNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  }, [user]);

  // Load saved notes
  useEffect(() => {
    if (user?.email) {
      loadSavedNotes();
    }
  }, [user, loadSavedNotes]);

  const handleLoadNote = (note: ExtractedNote) => {
    // Convert note back to ProcessingResult format
    const result: ProcessingResult = {
      rawText: note.rawText,
      cleanedText: note.cleanedText,
      sections: note.sections,
      metadata: {
        fileName: note.originalFileName,
        fileSize: 0,
        fileType: 'text/plain',
        uploadedAt: note.createdAt,
        processedAt: note.updatedAt,
        status: 'completed',
      },
    };
    setProcessingResult(result);
    setActiveTab('sections');
    // Scroll to top of processing results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-slate-700 font-semibold">Lab Manuals</p>
          <h1 className="text-3xl font-semibold text-slate-900">Scan Lab Manual → Step-by-Step Instructions</h1>
          <p className="text-slate-600">
            Scan PDFs, Word documents, or paste handwritten notes. Our AI will extract, clean, and organize the content
            into structured sections. Then generate quizzes and simulation scenarios automatically.
          </p>
        </div>

        {/* Input Mode Toggle */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setInputMode('file')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                inputMode === 'file'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                inputMode === 'text'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Paste Text / Handwritten Notes
            </button>
          </div>

          {inputMode === 'file' ? (
            <div>
              <label
                htmlFor="doc-upload"
                className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-300 rounded-xl py-10 cursor-pointer hover:border-slate-400 transition-colors"
              >
                <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6.1 4.5 4.5 0 1119 13h-6" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v9m0 0l-3-3m3 3l3-3" />
                </svg>
                <div className="text-center">
                  <p className="text-slate-900 font-semibold">Drag &amp; drop or click to upload</p>
                  <p className="text-sm text-slate-700">PDF, DOC, DOCX, or images. Max size 20MB.</p>
                </div>
                <input
                  id="doc-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {selectedFile && (
                <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setProcessingResult(null);
                    }}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <textarea
                value={textInput}
                onChange={handleTextInputChange}
                placeholder="Paste your handwritten notes or lab manual text here..."
                className="w-full h-48 p-4 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
              <p className="text-xs text-slate-500 mt-2">
                For handwritten notes, you can transcribe them first or upload an image.
              </p>
            </div>
          )}

          {(selectedFile || textInput.trim()) && !processingResult && (
            <button
              onClick={processDocument}
              disabled={isProcessing}
              className="mt-4 w-full px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Process Document'}
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
            Note saved successfully! Redirecting to Notes...
          </div>
        )}

        {/* Processing Results */}
        {processingResult && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Processing Results</h2>
                <p className="text-sm text-slate-700">Review extracted content and take actions</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleSaveToNotes}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-emerald-400"
                >
                  {isSaving ? 'Saving...' : 'Save to Notes'}
                </button>
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGeneratingQuiz}
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                >
                  {isGeneratingQuiz ? 'Generating...' : 'Generate Quiz'}
                </button>
                <button
                  onClick={handleGenerateScenario}
                  disabled={isGeneratingScenario}
                  className="px-4 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400"
                >
                  {isGeneratingScenario ? 'Generating...' : 'Generate Scenario'}
                </button>
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={isGeneratingFlashcards}
                  className="px-4 py-2 text-sm font-semibold bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-400"
                >
                  {isGeneratingFlashcards ? 'Generating...' : 'Generate Flashcards'}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-100">
              <div className="flex gap-4 px-6">
                <button
                  onClick={() => setActiveTab('sections')}
                  className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
                    activeTab === 'sections'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sections
                </button>
                <button
                  onClick={() => setActiveTab('cleaned')}
                  className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
                    activeTab === 'cleaned'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cleaned Text
                </button>
                <button
                  onClick={() => setActiveTab('raw')}
                  className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
                    activeTab === 'raw'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Raw Text
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'sections' && (
                <div className="space-y-4">
                  {processingResult.sections.map((section, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSectionTypeColor(section.type)}`}>
                          {getSectionTypeLabel(section.type)}
                        </span>
                        <span className="text-xs text-slate-500">Step {section.order}</span>
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">{section.title}</h3>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{section.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'cleaned' && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                    {processingResult.cleanedText}
                  </pre>
                </div>
              )}

              {activeTab === 'raw' && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                    {processingResult.rawText}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quiz Modal */}
        {showQuizModal && generatedQuiz && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">{generatedQuiz.title}</h2>
                  <p className="text-sm text-slate-600">{generatedQuiz.questions.length} questions</p>
                </div>
                <button
                  onClick={() => {
                    setShowQuizModal(false);
                    router.push(`/quiz?generated=${generatedQuiz.id}`);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Start Quiz
                </button>
                <button
                  onClick={() => setShowQuizModal(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-4">
                {generatedQuiz.questions.map((q, idx) => (
                  <div key={q.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-700">Q{idx + 1}</span>
                      <span className="text-xs px-2 py-1 bg-slate-100 rounded-full">{q.difficulty}</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 rounded-full">{q.type}</span>
                    </div>
                    <p className="font-medium text-slate-900 mb-2">{q.questionText}</p>
                    {q.options && (
                      <ul className="list-disc list-inside text-sm text-slate-700 ml-4">
                        {q.options.map((opt, optIdx) => (
                          <li key={optIdx}>{opt}</li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-slate-700 mt-2">Answer: {q.correctAnswer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scenario Modal */}
        {showScenarioModal && generatedScenario && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">{generatedScenario.title}</h2>
                  <p className="text-sm text-slate-600">{generatedScenario.steps.length} steps</p>
                </div>
                <button
                  onClick={() => {
                    setShowScenarioModal(false);
                    // Store scenario in localStorage for simulator to pick up
                    localStorage.setItem('pendingScenario', JSON.stringify(generatedScenario));
                    router.push('/simulator');
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                >
                  Start Simulation
                </button>
                <button
                  onClick={() => setShowScenarioModal(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                  <p className="text-sm text-slate-700">{generatedScenario.description}</p>
                </div>
                {generatedScenario.equipment.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Equipment</h3>
                    <div className="flex flex-wrap gap-2">
                      {generatedScenario.equipment.map((eq, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {generatedScenario.missingInfo && generatedScenario.missingInfo.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 mb-2">Missing Information</h3>
                    <ul className="list-disc list-inside text-sm text-yellow-800">
                      {generatedScenario.missingInfo.map((info, idx) => (
                        <li key={idx}>{info}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Steps</h3>
                  <ol className="space-y-2">
                    {generatedScenario.steps.map((step, idx) => (
                      <li key={step.id} className="flex items-start gap-3 border border-slate-200 rounded-lg p-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-900 text-sm font-semibold text-slate-900 shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                              {step.type}
                            </span>
                            {step.targetVolume && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                {step.targetVolume} µL
                              </span>
                            )}
                            {step.pipetteId && (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                {step.pipetteId}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-900">{step.instruction}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Flashcard Modal */}
        {showFlashcardModal && generatedFlashcards && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">{generatedFlashcards.title}</h2>
                  <p className="text-sm text-slate-700">{generatedFlashcards.flashcards.length} flashcards</p>
                </div>
                <button
                  onClick={() => setShowFlashcardModal(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedFlashcards.flashcards.map((flashcard, idx) => (
                    <div
                      key={flashcard.id}
                      className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold">
                          Card {idx + 1}
                        </span>
                        {flashcard.difficulty && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            flashcard.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            flashcard.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {flashcard.difficulty}
                          </span>
                        )}
                      </div>
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-slate-600 mb-1">Front:</p>
                        <p className="text-sm font-semibold text-slate-900">{flashcard.front}</p>
                      </div>
                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-xs font-semibold text-slate-600 mb-1">Back:</p>
                        <p className="text-sm text-slate-700">{flashcard.back}</p>
                      </div>
                      {flashcard.tags && flashcard.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {flashcard.tags.map((tag, tagIdx) => (
                            <span key={tagIdx} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Previously Saved Notes Section */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Previously Saved Notes</h2>
            <p className="text-sm text-slate-700">Click on any note to load it and generate quizzes or scenarios</p>
          </div>
          <div className="p-6">
            {loadingNotes ? (
              <div className="text-center text-slate-700 py-8">Loading your notes...</div>
            ) : savedNotes.length === 0 ? (
              <div className="text-center text-slate-700 py-8">
                <p className="mb-2">No saved notes yet.</p>
                <p className="text-sm text-slate-600">Process and save a document to see it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => handleLoadNote(note)}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 flex-1">{note.title}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/notes`);
                        }}
                        className="text-slate-600 hover:text-blue-600 text-xs ml-2"
                        title="View in Notes"
                      >
                        →
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 mb-2">
                      {new Date(note.createdAt).toLocaleDateString()} • {note.sections.length} sections
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs">
                          +{note.tags.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadNote(note);
                          setTimeout(() => {
                            handleGenerateQuiz();
                          }, 500);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Generate Quiz
                      </button>
                      <span className="text-slate-500">•</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadNote(note);
                          setTimeout(() => {
                            handleGenerateScenario();
                          }, 500);
                        }}
                        className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                      >
                        Generate Scenario
                      </button>
                      <span className="text-slate-500">•</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/your-docs?noteId=${note.id}&action=flashcards`);
                        }}
                        className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                      >
                        Generate Flashcards
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

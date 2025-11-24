'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { ExtractedNote, NoteSectionType } from '../types/notes';
import { FlashcardSet } from '../types/flashcards';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import AudioPlayer from '../components/AudioPlayer';

export default function NotesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<ExtractedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<ExtractedNote | null>(null);
  const [showSummary, setShowSummary] = useState<Record<string, boolean>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [noteFlashcards, setNoteFlashcards] = useState<Record<string, FlashcardSet[]>>({});

  useEffect(() => {
    if (user?.email) {
      loadNotes();
    }
  }, [user]);

  // Load flashcards for notes when they're selected
  useEffect(() => {
    if (selectedNote?.id && user?.email) {
      loadFlashcardsForNote(selectedNote.id);
    }
  }, [selectedNote, user]);

  const loadNotes = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      const notesRef = collection(db, 'userNotes');
      // Query without orderBy first to avoid index requirement, then sort in memory
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
      setNotes(notesData);
    } catch (error) {
      console.error('Error loading notes:', error);
      // If error is about index, show empty array (user can still use the app)
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user?.email || !confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteDoc(doc(db, 'userNotes', noteId));
      setNotes(notes.filter((n) => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  const handleRenameNote = async (noteId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      alert('Title cannot be empty');
      return;
    }

    try {
      await updateDoc(doc(db, 'userNotes', noteId), {
        title: newTitle.trim(),
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setNotes(notes.map((n) => n.id === noteId ? { ...n, title: newTitle.trim() } : n));
      if (selectedNote?.id === noteId) {
        setSelectedNote({ ...selectedNote, title: newTitle.trim() });
      }
      setEditingNoteId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Error renaming note:', error);
      alert('Failed to rename note');
    }
  };

  const startEditing = (note: ExtractedNote) => {
    setEditingNoteId(note.id);
    setEditingTitle(note.title);
  };

  const loadFlashcardsForNote = async (noteId: string) => {
    if (!user?.email) return;

    try {
      const response = await fetch(`/api/flashcards/get-by-note?noteId=${noteId}&userId=${user.email}`);
      if (response.ok) {
        const data = await response.json();
        setNoteFlashcards({ ...noteFlashcards, [noteId]: data.flashcardSets });
      }
    } catch (error) {
      console.error('Error loading flashcards for note:', error);
    }
  };

  const generateSummary = async (note: ExtractedNote) => {
    // Simple summary generation - in production, use AI
    const summary = `This note contains ${note.sections.length} sections covering ${note.sections.map((s) => s.type).join(', ')}.`;
    return summary;
  };

  const toggleSummary = async (noteId: string) => {
    if (showSummary[noteId]) {
      setShowSummary({ ...showSummary, [noteId]: false });
    } else {
      const note = notes.find((n) => n.id === noteId);
      if (note && !note.summary) {
        note.summary = await generateSummary(note);
      }
      setShowSummary({ ...showSummary, [noteId]: true });
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.cleanedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = !filterTag || note.tags.includes(filterTag);

    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags)));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-700 text-xl">Loading notes...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">My Notes</h1>
            <p className="text-slate-700 mt-1">Manage your scanned lab manuals and notes</p>
          </div>
          <button
            onClick={() => router.push('/your-docs')}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
          >
            + Scan New Document
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes by title, content, or tags..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {allTags.slice(0, 10).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                    filterTag === tag
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {filterTag && (
                <button
                  onClick={() => setFilterTag(null)}
                  className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
            <p className="text-slate-700 text-lg mb-4">
              {searchQuery || filterTag ? 'No notes match your search.' : 'No notes yet.'}
            </p>
            {!searchQuery && !filterTag && (
              <button
                onClick={() => router.push('/your-docs')}
                className="px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
              >
                Scan Your First Document
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedNote(note)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    {editingNoteId === note.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleRenameNote(note.id, editingTitle)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameNote(note.id, editingTitle);
                            } else if (e.key === 'Escape') {
                              setEditingNoteId(null);
                              setEditingTitle('');
                            }
                          }}
                          className="flex-1 px-2 py-1 border border-blue-500 rounded text-slate-900 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold text-slate-900 text-lg line-clamp-2 flex-1">{note.title}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(note);
                            }}
                            className="text-slate-600 hover:text-blue-600 transition-colors"
                            title="Rename"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            className="text-slate-600 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 mb-3">
                    {new Date(note.date).toLocaleDateString()} • {note.sections.length} sections
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.slice(0, 5).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSummary(note.id);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      {showSummary[note.id] ? 'Hide' : 'Show'} Summary
                    </button>
                    <span className="text-slate-500">•</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/your-docs?noteId=${note.id}&action=quiz`);
                      }}
                      className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                    >
                      Generate Quiz
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
                    <span className="text-slate-500">•</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/flashcards`);
                      }}
                      className="text-xs text-green-600 hover:text-green-700 font-semibold"
                    >
                      View Flashcards
                    </button>
                  </div>
                  {showSummary[note.id] && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                      {note.summary || 'Generating summary...'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Note Detail Modal */}
        {selectedNote && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-semibold text-slate-900">{selectedNote.title}</h2>
                    <AudioPlayer text={selectedNote.title} size="sm" />
                  </div>
                  <p className="text-sm text-slate-700">
                    {new Date(selectedNote.date).toLocaleDateString()} • {selectedNote.sections.length} sections
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => router.push(`/your-docs?noteId=${selectedNote.id}&action=quiz`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm"
                  >
                    Generate Quiz
                  </button>
                  <button
                    onClick={() => router.push(`/your-docs?noteId=${selectedNote.id}&action=scenario`)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 text-sm"
                  >
                    Generate Scenario
                  </button>
                  <button
                    onClick={() => router.push(`/your-docs?noteId=${selectedNote.id}&action=flashcards`)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 text-sm"
                  >
                    Generate Flashcards
                  </button>
                  {noteFlashcards[selectedNote.id] && noteFlashcards[selectedNote.id].length > 0 && (
                    <button
                      onClick={() => router.push(`/flashcards`)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 text-sm"
                    >
                      View Flashcards ({noteFlashcards[selectedNote.id].length})
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedNote(null)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedNote.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Sections</h3>
                    <AudioPlayer text={selectedNote.sections.map(s => `${s.title}. ${s.content}`).join(' ')} size="sm" />
                  </div>
                  <div className="space-y-3">
                    {selectedNote.sections.map((section, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            {section.type}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-700">Step {section.order}</span>
                            <AudioPlayer text={`${section.title}. ${section.content}`} size="sm" />
                          </div>
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-1">{section.title}</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{section.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Full Text</h3>
                    <AudioPlayer text={selectedNote.cleanedText} size="sm" />
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                      {selectedNote.cleanedText}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


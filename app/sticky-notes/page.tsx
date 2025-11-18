'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { STICKY_NOTE_COLORS, StickyNote, StickyNoteColor } from '../constants/stickyNotes';

export default function StickyNotesPage() {
  const { userProfile, updateUserProfile } = useAuth();
  const [notes, setNotes] = useState<StickyNote[]>(userProfile?.stickyNotes || []);
  const [selectedColor, setSelectedColor] = useState<StickyNoteColor>('yellow');
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNotes(userProfile?.stickyNotes || []);
  }, [userProfile?.stickyNotes]);

  const sortedNotes = useMemo(
    () =>
      [...notes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [notes]
  );

  const handleSaveNotes = async (updated: StickyNote[]) => {
    try {
      setSaving(true);
      await updateUserProfile({ stickyNotes: updated });
      setNotes(updated);
      setNoteText('');
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to save note right now. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    const text = noteText.trim();
    if (!text) return;

    const newNote: StickyNote = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      text: text.slice(0, 220),
      color: selectedColor,
      createdAt: new Date().toISOString(),
    };

    await handleSaveNotes([newNote, ...notes]);
  };

  const handleDeleteNote = async (id: string) => {
    await handleSaveNotes(notes.filter((note) => note.id !== id));
  };

  if (!userProfile) {
    return (
      <DashboardLayout>
        <div className="min-h-[300px] flex items-center justify-center text-slate-500">
          Loading your sticky notes...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-slate-500 font-semibold">Sticky wall</p>
          <h1 className="text-3xl font-semibold text-slate-900">Your lab notes wall</h1>
          <p className="text-slate-600">
            Collect bite-sized learnings from simulations, color-code them, and revisit before lab sessions.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Choose a color</label>
            <div className="flex gap-3 mt-2">
              {Object.entries(STICKY_NOTE_COLORS).map(([key, palette]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedColor(key as StickyNoteColor)}
                  className={`w-10 h-10 rounded-full border-2 transition-transform ${
                    selectedColor === key ? 'ring-2 ring-slate-900 scale-105' : ''
                  } ${palette.bg} ${palette.border}`}
                  aria-label={palette.label}
                />
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="sticky-note-input" className="text-sm font-semibold text-slate-700">
              Write a quick note
            </label>
            <textarea
              id="sticky-note-input"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Example: Remember to pre-wet tips twice for viscous samples."
              maxLength={220}
              className="w-full mt-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
              rows={3}
            />
            <div className="text-right text-xs text-slate-500 mt-1">{noteText.length}/220</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddNote}
              disabled={!noteText.trim() || saving}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold disabled:bg-slate-400"
            >
              {saving ? 'Saving...' : 'Pin note'}
            </button>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          {sortedNotes.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-10">
              No notes yet. Add one from here or while running a simulation.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedNotes.map((note) => {
                const palette = STICKY_NOTE_COLORS[note.color] || STICKY_NOTE_COLORS.yellow;
                return (
                  <div
                    key={note.id}
                    className={`rounded-xl border shadow-sm p-4 min-h-[140px] flex flex-col ${palette.bg} ${palette.text} ${palette.border}`}
                  >
                    <div className="flex-1 whitespace-pre-wrap break-words text-sm">
                      {note.text}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs opacity-75">
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-xs font-semibold underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}


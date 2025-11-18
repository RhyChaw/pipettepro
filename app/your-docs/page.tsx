'use client';

import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';

interface ParsedInstruction {
  id: number;
  text: string;
  status: 'pending' | 'ready';
}

export default function YourDocsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [instructions, setInstructions] = useState<ParsedInstruction[]>([]);
  const [notes, setNotes] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    simulateParsing(file);
  };

  const simulateParsing = (file: File) => {
    setIsUploading(true);
    setInstructions([]);
    setNotes('');

    setTimeout(() => {
      setInstructions([
        { id: 1, text: 'Prepare your workbench and lay out all required consumables.', status: 'ready' },
        { id: 2, text: `Follow the volume setup described in ${file.name}.`, status: 'ready' },
        { id: 3, text: 'Load the reagents into the simulator to preview each transfer.', status: 'pending' },
      ]);
      setNotes('These steps are generated from your document. We will refine the AI parser soon.');
      setIsUploading(false);
    }, 1200);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-slate-500 font-semibold">Lab Manuals</p>
          <h1 className="text-3xl font-semibold text-slate-900">Upload Manual &amp; Generate Steps</h1>
          <p className="text-slate-600">
            Scan PDFs or Word documents of your lab manuals and automatically create step-by-step instructions
            that you can replay inside the simulator. AI parsing will be connected soon—this page sets up the workflow.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Upload your document</h2>
            <p className="text-sm text-slate-600">
              Accepted formats: PDF, DOC, DOCX. Max size 20MB.
            </p>
          </div>
          <div className="p-6">
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
                <p className="text-sm text-slate-500">We scan your manual and build simulator-ready steps.</p>
              </div>
              <input
                id="doc-upload"
                type="file"
                accept=".pdf,.doc,.docx"
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
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  isUploading ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {isUploading ? 'Parsing…' : 'Ready'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Generated Instructions</h2>
              <p className="text-sm text-slate-600">We’ll use AI to map your manual into simulator steps.</p>
            </div>
            {instructions.length > 0 && (
              <button className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                Send to Simulator
              </button>
            )}
          </div>
          <div className="p-6 space-y-4">
            {instructions.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-10">
                Upload a document to preview extracted steps.
              </div>
            ) : (
              <ol className="space-y-3">
                {instructions.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-900 text-sm font-semibold text-slate-900">
                      {item.id}
                    </span>
                    <div>
                      <p className="text-slate-900 font-medium">{item.text}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Status: {item.status === 'ready' ? 'Ready for simulator' : 'Needs validation'}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {notes && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
                {notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


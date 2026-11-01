import React, { useState } from 'react';
import {
  Layers,
  FileText,
  Bookmark,
  CheckCircle2,
  Search,
  Download,
  HelpCircle,
  Sparkles,
  Upload,
  BookOpen,
  ChevronRight,
  Folder,
  ArrowRight,
  Check,
  FileUp,
  FileCode,
  ShieldCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { MBASubject, MBADocument } from '../types';
import { AIService, QuizQuestion } from '../services/aiService';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notificationService';
import { WashiTape, PaperClip, PopStamp, StickerBadge, NotebookBinder } from '../components/ScrapbookElements';

interface MBAHubViewProps {
  subjects: MBASubject[];
  onUpdateSubjects: (subjects: MBASubject[]) => void;
  onOpenAICoach: (context: string) => void;
  geminiApiKey?: string;
}

export const MBAHubView: React.FC<MBAHubViewProps> = ({
  subjects,
  onUpdateSubjects,
  onOpenAICoach,
  geminiApiKey,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0].id);
  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [activeDocument, setActiveDocument] = useState<MBADocument | null>(
    activeSubject.documents[0] || null
  );

  // On-demand AI explanation state
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // On-demand Quiz state
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  // User Document Note
  const [userDocNote, setUserDocNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFilesPreview, setUploadedFilesPreview] = useState<
    { name: string; size: string; type: string }[]
  >([]);

  // Filter docs by search
  const filteredDocs = activeSubject.documents.filter((d) => {
    return (
      d.title.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      d.summary.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      d.keyTopics.some((t) => t.toLowerCase().includes(searchDocQuery.toLowerCase()))
    );
  });

  const handleSelectDoc = (doc: MBADocument) => {
    setActiveDocument(doc);
    setAiExplanation(null);
    setActiveQuiz(null);
    setUserDocNote(doc.notes || '');
  };

  const handleToggleDocComplete = (docId: string) => {
    const updatedSubjects = subjects.map((subj) => {
      if (subj.id === activeSubject.id) {
        return {
          ...subj,
          documents: subj.documents.map((d) =>
            d.id === docId ? { ...d, completed: !d.completed } : d
          ),
        };
      }
      return subj;
    });
    onUpdateSubjects(updatedSubjects);
    StorageService.saveMBASubjects(updatedSubjects);
    NotificationService.triggerCelebration();
  };

  const handleToggleBookmark = (docId: string) => {
    const updatedSubjects = subjects.map((subj) => {
      if (subj.id === activeSubject.id) {
        return {
          ...subj,
          documents: subj.documents.map((d) =>
            d.id === docId ? { ...d, bookmarked: !d.bookmarked } : d
          ),
        };
      }
      return subj;
    });
    onUpdateSubjects(updatedSubjects);
    StorageService.saveMBASubjects(updatedSubjects);
  };

  const handleExplainInSimpleEnglish = async () => {
    if (!activeDocument) return;
    setLoadingExplanation(true);
    try {
      const expl = await AIService.explainAcademicConcept(
        activeSubject.code,
        activeDocument.title,
        'Please explain the main idea of this session in simple English with an Indian business example.'
      );
      setAiExplanation(expl);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleGenerateOnDemandQuiz = async () => {
    if (!activeDocument) return;
    setGeneratingQuiz(true);
    try {
      const questions = await AIService.generateQuiz(activeSubject.code, activeDocument.title);
      setActiveQuiz(questions);
      setQuizAnswers({});
      setQuizSubmitted(false);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSaveDocNote = () => {
    if (!activeDocument) return;
    const updatedSubjects = subjects.map((subj) => {
      if (subj.id === activeSubject.id) {
        return {
          ...subj,
          documents: subj.documents.map((d) =>
            d.id === activeDocument.id ? { ...d, notes: userDocNote } : d
          ),
        };
      }
      return subj;
    });
    onUpdateSubjects(updatedSubjects);
    StorageService.saveMBASubjects(updatedSubjects);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const previews = Array.from(files).map((f) => ({
      name: f.name,
      size: `${Math.round(f.size / 1024)} KB`,
      type: f.name.split('.').pop()?.toUpperCase() || 'FILE',
    }));
    setUploadedFilesPreview(previews);
  };

  const handleConfirmImport = () => {
    if (uploadedFilesPreview.length === 0) return;

    const newDocs: MBADocument[] = uploadedFilesPreview.map((item, idx) => ({
      id: `doc-up-${Date.now()}-${idx}`,
      title: item.name.replace(/\.[^/.]+$/, ''),
      fileName: item.name,
      sessionNumber: activeSubject.documents.length + idx + 1,
      fileType: (item.type.toLowerCase() as any) || 'pptx',
      fileSize: item.size,
      summary: 'Uploaded course material awaiting AI indexing & concept extraction.',
      keyTopics: ['Uploaded Lecture', 'Term II Syllabus'],
      contentSnippet: 'Document uploaded directly by student. Ready for on-demand explanation.',
      bookmarked: false,
      completed: false,
    }));

    const updated = subjects.map((s) => {
      if (s.id === activeSubject.id) {
        return {
          ...s,
          documents: [...s.documents, ...newDocs],
        };
      }
      return s;
    });

    onUpdateSubjects(updated);
    StorageService.saveMBASubjects(updated);
    setShowUploadModal(false);
    setUploadedFilesPreview([]);
    NotificationService.triggerCelebration();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-cream-200 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StickerBadge
              text="Study Notebook"
              icon={<BookOpen className="w-3.5 h-3.5 text-cobalt-600" />}
              bg="bg-cyan-300"
              rotation="rotate-[-1deg]"
            />
            <span className="text-xs text-ink-500 font-bold uppercase tracking-wider">
              Term II (2026) · Clean Reading
            </span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-ink-900 tracking-tight mt-1.5">
            MBA Hub
          </h1>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-300 border-2 border-ink-900 text-ink-950 font-black text-xs hover:bg-yellow-400 transition-all self-start sm:self-auto shadow-pop-sm hover-wiggle"
        >
          <Upload className="w-4 h-4" />
          <span>Import ZIP / PPT Files</span>
        </button>
      </div>

      {/* Subject Selector Tabs (Colorful Notebook Tabs) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {subjects.map((subj, idx) => {
          const isActive = subj.id === activeSubject.id;
          const tabColors = [
            'hover:bg-yellow-100',
            'hover:bg-cyan-100',
            'hover:bg-pink-100',
            'hover:bg-lime-100',
            'hover:bg-blue-100',
            'hover:bg-purple-100',
          ];
          return (
            <button
              key={subj.id}
              onClick={() => {
                setSelectedSubjectId(subj.id);
                setActiveDocument(subj.documents[0] || null);
                setAiExplanation(null);
                setActiveQuiz(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all border-2 ${
                isActive
                  ? 'bg-cobalt-600 text-white border-ink-900 shadow-pop-sm scale-102 font-extrabold'
                  : `bg-white text-ink-800 border-ink-900/40 ${tabColors[idx % tabColors.length]}`
              }`}
            >
              <span>{subj.name}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border border-ink-900 font-black ${
                  isActive ? 'bg-yellow-300 text-ink-950' : 'bg-cream-200 text-ink-700'
                }`}
              >
                {subj.documents.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Subject Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Documents & Sessions List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={`Search ${activeSubject.code} lectures & notes...`}
              value={searchDocQuery}
              onChange={(e) => setSearchDocQuery(e.target.value)}
              className="w-full bg-white border border-cream-200 rounded-2xl pl-10 pr-4 py-2 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-400"
            />
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredDocs.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-cream-200 text-xs text-ink-400 space-y-2">
                <Folder className="w-8 h-8 text-cream-300 mx-auto" />
                <p>No documents uploaded in this subject folder yet.</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="text-cobalt-600 font-bold hover:underline"
                >
                  Upload PPT or ZIP files →
                </button>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = activeDocument?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-white border-cobalt-400 shadow-soft-md'
                        : 'bg-white/80 border-cream-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-cobalt-600">
                        {doc.sessionNumber ? `Session ${doc.sessionNumber}` : doc.fileType.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleBookmark(doc.id);
                          }}
                          className={`p-1 rounded-lg ${
                            doc.bookmarked ? 'text-cobalt-500' : 'text-cream-300 hover:text-ink-500'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDocComplete(doc.id);
                          }}
                          className={`p-1 rounded-lg ${
                            doc.completed ? 'text-emerald-500' : 'text-cream-300 hover:text-ink-500'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-display font-bold text-xs text-ink-900 line-clamp-2">
                      {doc.title}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-ink-400">
                      <span>{doc.fileSize}</span>
                      <span className="uppercase font-mono">{doc.fileType}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Document Reader & Study Panel (8 cols) */}
        <div className="lg:col-span-8 relative bg-white rounded-3xl border-2 border-ink-900 p-6 sm:p-8 shadow-pop space-y-6 scrapbook-card overflow-hidden">
          {/* Notebook Spiral Binder Strip */}
          <NotebookBinder count={10} className="rounded-t-2xl -mt-6 -mx-6 sm:-mt-8 sm:-mx-8 mb-4 border-b-2 border-ink-900" />
          <WashiTape color="cyan" position="top-right" width="w-24" />

          {activeDocument ? (
            <>
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-cream-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-yellow-300 text-ink-950 uppercase border border-ink-900">
                      {activeSubject.code} · {activeDocument.fileType}
                    </span>
                    <span className="text-xs text-ink-500 font-bold">{activeDocument.fileName}</span>
                  </div>
                  <h3 className="font-display font-black text-xl sm:text-2xl text-ink-900 mt-1.5">
                    {activeDocument.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/documents/${activeDocument.fileName}`}
                    download={activeDocument.fileName}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-ink-900 font-black text-xs border-2 border-ink-900 shadow-pop-sm hover:bg-cream-100 transition-all hover-wiggle"
                    title="Download original session file"
                  >
                    <Download className="w-3.5 h-3.5 text-cobalt-600" />
                    <span>Download ({activeDocument.fileSize})</span>
                  </a>

                  <button
                    onClick={handleExplainInSimpleEnglish}
                    disabled={loadingExplanation}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-yellow-300 text-ink-950 font-black text-xs border-2 border-ink-900 shadow-pop-sm hover:bg-yellow-400 transition-all hover-wiggle disabled:opacity-40"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                    <span>{loadingExplanation ? 'Explaining...' : 'Explain Concept'}</span>
                  </button>

                  <button
                    onClick={handleGenerateOnDemandQuiz}
                    disabled={generatingQuiz}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cobalt-600 text-white font-black text-xs border-2 border-ink-900 shadow-pop-sm hover:bg-cobalt-700 transition-all hover-wiggle disabled:opacity-40"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{generatingQuiz ? 'Generating...' : 'Take 5-Q Quiz'}</span>
                  </button>
                </div>
              </div>

              {/* Summary & Core Concepts */}
              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-3 text-xs leading-relaxed">
                <div>
                  <span className="font-bold text-ink-900 block mb-1">Pedagogical Summary:</span>
                  <p className="text-ink-700">{activeDocument.summary}</p>
                </div>

                {activeDocument.keyTopics.length > 0 && (
                  <div>
                    <span className="font-bold text-ink-900 block mb-1">Key Topics & Terms:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeDocument.keyTopics.map((top, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white border border-cream-200 text-ink-700 font-medium"
                        >
                          {top}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="font-bold text-ink-900 block mb-1">Curriculum Concept Snippet:</span>
                  <blockquote className="italic border-l-2 border-cobalt-400 pl-3 text-ink-600">
                    "{activeDocument.contentSnippet}"
                  </blockquote>
                </div>
              </div>

              {/* On-Demand AI Explanation Box */}
              {aiExplanation && (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 animate-fadeIn text-xs leading-relaxed">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      AI Simple English Concept Breakdown
                    </span>
                    <button
                      onClick={() => setAiExplanation(null)}
                      className="text-ink-400 hover:text-ink-600 text-[11px]"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="text-ink-800 whitespace-pre-line font-normal">
                    {aiExplanation}
                  </div>
                </div>
              )}

              {/* On-Demand Interactive Quiz */}
              {activeQuiz && (
                <div className="p-5 rounded-2xl bg-cream-50 border border-cream-300 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                      On-Demand Knowledge Check (5 Questions)
                    </span>
                    <button
                      onClick={() => setActiveQuiz(null)}
                      className="text-xs text-ink-400 hover:text-ink-600"
                    >
                      Close Quiz
                    </button>
                  </div>

                  <div className="space-y-4">
                    {activeQuiz.map((q) => {
                      const selected = quizAnswers[q.id];
                      return (
                        <div key={q.id} className="p-3 bg-white rounded-xl border border-cream-200 space-y-2 text-xs">
                          <p className="font-bold text-ink-900">
                            {q.id}. {q.question}
                          </p>
                          <div className="space-y-1">
                            {q.options.map((opt, optIdx) => {
                              const isPicked = selected === optIdx;
                              const isCorrect = q.correctIndex === optIdx;
                              let btnClass = 'bg-cream-50 border-cream-200 text-ink-700';

                              if (quizSubmitted) {
                                if (isCorrect) btnClass = 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold';
                                else if (isPicked) btnClass = 'bg-red-100 border-red-400 text-red-900';
                              } else if (isPicked) {
                                btnClass = 'bg-cobalt-100 border-cobalt-400 text-cobalt-900 font-bold';
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => {
                                    if (!quizSubmitted) {
                                      setQuizAnswers({ ...quizAnswers, [q.id]: optIdx });
                                    }
                                  }}
                                  className={`w-full text-left p-2 rounded-lg border text-xs transition-colors ${btnClass}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {quizSubmitted && (
                            <p className="text-[11px] text-ink-500 pt-1 italic">
                              <strong>Explanation:</strong> {q.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!quizSubmitted ? (
                    <button
                      onClick={() => {
                        setQuizSubmitted(true);
                        NotificationService.triggerCelebration();
                      }}
                      className="w-full py-2.5 rounded-xl bg-cobalt-500 text-white font-bold text-xs hover:bg-cobalt-600"
                    >
                      Submit Quiz & Check Explanations
                    </button>
                  ) : (
                    <div className="text-center font-bold text-xs text-emerald-700">
                      Quiz Completed! Great recall practice.
                    </div>
                  )}
                </div>
              )}

              {/* Personal Study Notes on this Document (Lined Notebook Paper) */}
              <div className="relative space-y-2 pt-3 border-t-2 border-cream-200">
                <PaperClip color="cobalt" position="top-right" />
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-ink-900 flex items-center gap-1.5">
                    <span>My Study Notes & Lecture Questions</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream-200 text-ink-700">
                      Notebook Page
                    </span>
                  </label>
                  {noteSaved && (
                    <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Saved to Database!
                    </span>
                  )}
                </div>
                <textarea
                  value={userDocNote}
                  onChange={(e) => setUserDocNote(e.target.value)}
                  placeholder="Record your personal notes, questions to ask in class, or exam formulas..."
                  rows={4}
                  className="w-full bg-notebook-lines border-2 border-ink-900 rounded-2xl p-4 text-xs font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 shadow-sm"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveDocNote}
                    className="px-4 py-2 rounded-xl bg-cobalt-600 text-white text-xs font-black border-2 border-ink-900 shadow-pop-sm hover:bg-cobalt-700 transition-all uppercase tracking-wide active:translate-y-0.5"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-ink-400 space-y-2">
              <Folder className="w-10 h-10 text-cream-300 mx-auto" />
              <p>Select a document from the left to inspect slides and summaries.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload & ZIP Extraction Preview Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-cream-50 w-full max-w-lg rounded-3xl border border-cream-200 shadow-soft-lg p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-ink-900">
              Import Subject Materials into {activeSubject.name}
            </h3>
            <p className="text-xs text-ink-600 leading-relaxed">
              Upload PDF, PPTX, or ZIP archives containing Term II presentations. The system validates file types and organizes session notes automatically.
            </p>

            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-cream-300 rounded-2xl bg-white hover:bg-cobalt-50/20 cursor-pointer transition-colors">
              <FileUp className="w-8 h-8 text-cobalt-500 mb-2" />
              <span className="text-xs font-bold text-ink-800">
                Click to browse files or drop archives here
              </span>
              <span className="text-[11px] text-ink-400 mt-1">
                Supports .pptx, .ppt, .pdf, .docx, .md, .zip
              </span>
              <input
                type="file"
                multiple
                accept=".pptx,.ppt,.pdf,.docx,.md,.zip"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {uploadedFilesPreview.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                <span className="text-xs font-bold text-ink-700 block">Files to import:</span>
                {uploadedFilesPreview.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-cream-200 text-xs"
                  >
                    <span className="font-semibold text-ink-800 line-clamp-1">{item.name}</span>
                    <span className="text-ink-400 font-mono text-[10px]">{item.size}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-cream-200">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadedFilesPreview([]);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-ink-500 hover:bg-cream-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={uploadedFilesPreview.length === 0}
                className="px-5 py-2 rounded-xl bg-cobalt-500 text-white font-bold text-xs hover:bg-cobalt-600 disabled:opacity-40"
              >
                Confirm Import ({uploadedFilesPreview.length} files)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

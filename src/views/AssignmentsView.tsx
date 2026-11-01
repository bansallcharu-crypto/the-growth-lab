import React, { useState } from 'react';
import {
  CheckSquare,
  Calendar,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Bell,
  Trash2,
  FileText,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Assignment, MBASubject } from '../types';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notificationService';
import { WashiTape, PaperClip, PopStamp, StickerBadge } from '../components/ScrapbookElements';

interface AssignmentsViewProps {
  assignments: Assignment[];
  onUpdateAssignments: (assignments: Assignment[]) => void;
  subjects: MBASubject[];
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assignments,
  onUpdateAssignments,
  subjects,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [showOutlookConfig, setShowOutlookConfig] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState(subjects[0]?.id || 'subj-pm2');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<Assignment['priority']>('medium');
  const [newDesc, setNewDesc] = useState('');

  const [notificationEnabled, setNotificationEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const handleRequestNotifications = async () => {
    const granted = await NotificationService.requestPermission();
    setNotificationEnabled(granted);
    if (granted) {
      NotificationService.sendNotification(
        'The Growth Lab Reminders Active',
        'You will receive notifications for upcoming MBA deadlines!'
      );
    }
  };

  const handleToggleComplete = (id: string) => {
    const updated = assignments.map((a) => {
      if (a.id === id) {
        const nextStatus = a.status === 'completed' ? 'pending' : 'completed';
        return { ...a, status: nextStatus as Assignment['status'] };
      }
      return a;
    });
    onUpdateAssignments(updated);
    StorageService.saveAssignments(updated);
    NotificationService.triggerCelebration();
  };

  const handleDelete = (id: string) => {
    const updated = assignments.filter((a) => a.id !== id);
    onUpdateAssignments(updated);
    StorageService.saveAssignments(updated);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const matchedSubj = subjects.find((s) => s.id === newSubjectId);
    const newAsg: Assignment = {
      id: `asg-${Date.now()}`,
      title: newTitle.trim(),
      subjectId: newSubjectId,
      subjectName: matchedSubj?.name || 'MBA Coursework',
      dueDate: newDueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      priority: newPriority,
      status: 'pending',
      description: newDesc.trim() || 'No description provided.',
    };

    const updated = [newAsg, ...assignments];
    onUpdateAssignments(updated);
    StorageService.saveAssignments(updated);
    setIsAdding(false);
    setNewTitle('');
    setNewDesc('');
    NotificationService.triggerCelebration();
  };

  const filtered = assignments.filter((a) => {
    if (filterStatus === 'pending') return a.status !== 'completed';
    if (filterStatus === 'completed') return a.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-cream-200 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StickerBadge
              text="Creative Calendar"
              icon={<Calendar className="w-3.5 h-3.5 text-cobalt-600" />}
              bg="bg-yellow-300"
              rotation="rotate-[-1deg]"
            />
            <span className="text-xs text-ink-500 font-bold uppercase tracking-wider">
              Term II Milestones
            </span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-ink-900 tracking-tight mt-1.5">
            Academic Planner & Deadlines
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowOutlookConfig(!showOutlookConfig)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border-2 border-ink-900 text-ink-900 font-black text-xs hover:bg-cream-100 transition-all shadow-pop-sm hover-wiggle"
          >
            <Calendar className="w-4 h-4 text-cobalt-600" />
            <span>Outlook Sync</span>
          </button>

          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cobalt-600 text-white font-black text-xs border-2 border-ink-900 shadow-pop-sm hover:bg-cobalt-700 transition-all active:translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Assignment</span>
          </button>
        </div>
      </div>

      {/* Browser Notification Banner */}
      {!notificationEnabled && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-amber-900 font-medium">
              Enable browser alerts to receive upcoming deadline reminders 24 hours in advance.
            </span>
          </div>
          <button
            onClick={handleRequestNotifications}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shrink-0"
          >
            Enable Reminders
          </button>
        </div>
      )}

      {/* Microsoft Outlook Integration Info Panel */}
      {showOutlookConfig && (
        <div className="p-5 rounded-3xl bg-white border border-cream-300 shadow-soft-md space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cobalt-500" />
              <h3 className="font-display font-bold text-sm text-ink-900">
                Microsoft Outlook & Graph Calendar Integration
              </h3>
            </div>
            <button
              onClick={() => setShowOutlookConfig(false)}
              className="text-xs text-ink-400 hover:text-ink-600"
            >
              Close
            </button>
          </div>
          <p className="text-xs text-ink-600 leading-relaxed">
            The Growth Lab supports importing calendar deadlines via Microsoft Graph REST API (`/me/calendar/events`). Because college tenant policies often restrict automated third-party LMS scraping, you can either authenticate your student Office 365 account or manually enter tasks above for 100% reliable tracking.
          </p>
          <div className="p-3 bg-cream-50 rounded-xl border border-cream-200 flex items-center justify-between text-xs">
            <span className="text-ink-700 font-medium">
              Status: <strong>Manual & Local Persistence Active</strong> (No OAuth app client secret committed)
            </span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Ready for OAuth Client ID
            </span>
          </div>
        </div>
      )}

      {/* Add Assignment Modal Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateAssignment}
          className="p-6 rounded-3xl bg-white border border-cobalt-200 shadow-soft-lg space-y-4 animate-fadeIn"
        >
          <h3 className="font-display font-bold text-base text-ink-900">New Academic Assignment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">Title</label>
              <input
                type="text"
                placeholder="e.g. Microeconomics Telecom Pricing Memo"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full bg-cream-50 border border-cream-200 rounded-xl px-3 py-2 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">Subject</label>
              <select
                value={newSubjectId}
                onChange={(e) => setNewSubjectId(e.target.value)}
                className="w-full bg-cream-50 border border-cream-200 rounded-xl px-3 py-2 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-400"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">Due Date</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full bg-cream-50 border border-cream-200 rounded-xl px-3 py-2 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full bg-cream-50 border border-cream-200 rounded-xl px-3 py-2 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-400"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-ink-700 block mb-1">Description & Deliverables</label>
            <textarea
              placeholder="Outline submission instructions, team members, or rubrics..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              className="w-full bg-cream-50 border border-cream-200 rounded-xl p-3 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-ink-500 hover:bg-cream-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cobalt-500 text-white font-bold text-xs hover:bg-cobalt-600 shadow-soft"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
            filterStatus === 'all'
              ? 'bg-ink-900 text-white border-ink-900 shadow-pop-sm'
              : 'bg-white text-ink-700 border-ink-900/40 hover:bg-cream-100'
          }`}
        >
          All ({assignments.length})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
            filterStatus === 'pending'
              ? 'bg-cobalt-600 text-white border-ink-900 shadow-pop-sm'
              : 'bg-white text-ink-700 border-ink-900/40 hover:bg-cream-100'
          }`}
        >
          Pending ({assignments.filter((a) => a.status !== 'completed').length})
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
            filterStatus === 'completed'
              ? 'bg-emerald-500 text-ink-950 border-ink-900 shadow-pop-sm'
              : 'bg-white text-ink-700 border-ink-900/40 hover:bg-cream-100'
          }`}
        >
          Completed ({assignments.filter((a) => a.status === 'completed').length})
        </button>
      </div>

      {/* Assignments List */}
      <div className="space-y-3.5">
        {filtered.map((asg) => {
          const isDone = asg.status === 'completed';
          const priorityStyle =
            asg.priority === 'high'
              ? 'bg-pink-100 text-pink-900 border-2 border-pink-400 font-black'
              : asg.priority === 'medium'
              ? 'bg-yellow-100 text-amber-900 border-2 border-yellow-400 font-black'
              : 'bg-cream-200 text-ink-700 border border-ink-900/40 font-bold';

          return (
            <div
              key={asg.id}
              className={`relative p-5 rounded-3xl bg-white border-2 border-ink-900 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-pop-sm hover:shadow-pop hover:-translate-y-1 scrapbook-card ${
                isDone ? 'opacity-80 bg-cream-50/70' : ''
              }`}
            >
              {asg.priority === 'high' && !isDone && (
                <PaperClip color="pink" position="top-right" />
              )}

              <div className="flex items-start gap-3.5">
                <button
                  onClick={() => handleToggleComplete(asg.id)}
                  className={`mt-0.5 p-1 rounded-xl transition-transform hover:scale-110 ${
                    isDone ? 'text-emerald-500' : 'text-cream-300 hover:text-cobalt-600'
                  }`}
                  title={isDone ? 'Mark as Pending' : 'Mark as Complete'}
                >
                  <CheckCircle2 className="w-5 h-5 fill-current" />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cream-200 text-ink-900 border border-ink-900/40">
                      {asg.subjectName}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityStyle}`}>
                      {asg.priority} Priority
                    </span>
                    {isDone && <PopStamp label="SUBMITTED ★" variant="emerald" />}
                  </div>

                  <h4
                    className={`font-display font-black text-sm ${
                      isDone ? 'line-through text-ink-400' : 'text-ink-900'
                    }`}
                  >
                    {asg.title}
                  </h4>
                  <p className="text-xs text-ink-600 font-medium mt-1 leading-relaxed">
                    {asg.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pl-9 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-cream-100">
                <div className="text-right">
                  <div className="text-xs font-bold text-ink-800 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cobalt-500" />
                    <span>
                      {new Date(asg.dueDate).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="text-[10px] text-ink-400 capitalize">{asg.status}</div>
                </div>

                <button
                  onClick={() => handleDelete(asg.id)}
                  className="p-2 rounded-xl text-ink-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete assignment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

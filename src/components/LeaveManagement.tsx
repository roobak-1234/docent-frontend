import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, ClipboardList, Send, CheckCircle, XCircle, Clock, X } from 'lucide-react';
import { authService } from '../services/AuthService';
import { leaveService, LeaveApplication } from '../services/LeaveService';

interface ReviewModalState {
    id: number;
    action: 'Approved' | 'Rejected';
}

const LeaveManagement: React.FC = () => {
    const [currentUser] = useState(authService.getCurrentUser());
    const isAdmin = currentUser?.userType === 'doctor' || currentUser?.staffType === 'Administrator';

    const [activeTab, setActiveTab] = useState<'apply' | 'my-leaves' | 'pending' | 'all'>(isAdmin ? 'pending' : 'apply');
    const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
    const [pendingLeaves, setPendingLeaves] = useState<LeaveApplication[]>([]);
    const [allLeaves, setAllLeaves] = useState<LeaveApplication[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [dateError, setDateError] = useState('');

    const [reviewModal, setReviewModal] = useState<ReviewModalState | null>(null);
    const [reviewComment, setReviewComment] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    const loadMyLeaves = useCallback(async () => {
        if (!currentUser) return;
        try {
            const data = await leaveService.getMyLeaves(currentUser.username);
            setLeaves(data);
        } catch {
            // silently fail — user sees empty state
        }
    }, [currentUser]);

    const loadPendingLeaves = useCallback(async () => {
        if (!currentUser) return;
        try {
            const data = await leaveService.getPendingLeaves(currentUser.username);
            setPendingLeaves(data);
        } catch {
            // silently fail
        }
    }, [currentUser]);

    const loadAllLeaves = useCallback(async () => {
        if (!currentUser) return;
        try {
            const data = await leaveService.getAllLeaves(currentUser.username);
            setAllLeaves(data);
        } catch {
            // silently fail
        }
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;
        loadMyLeaves();
        if (isAdmin) {
            loadPendingLeaves();
            loadAllLeaves();
        }
    }, [currentUser, isAdmin, loadMyLeaves, loadPendingLeaves, loadAllLeaves]);

    const validateDates = (start: string, end: string) => {
        if (!start || !end) return '';
        if (end < start) return 'End date cannot be before start date';
        if (start < today) return 'Start date cannot be in the past';
        return '';
    };

    const handleStartDateChange = (val: string) => {
        setStartDate(val);
        setDateError(validateDates(val, endDate));
    };

    const handleEndDateChange = (val: string) => {
        setEndDate(val);
        setDateError(validateDates(startDate, val));
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const err = validateDates(startDate, endDate);
        if (err) { setDateError(err); return; }

        setIsSubmitting(true);
        try {
            await leaveService.applyLeave({
                username: currentUser.username,
                staffType: currentUser.staffType || currentUser.userType || 'Staff',
                startDate,
                endDate,
                reason
            });
            setMessage({ text: 'Leave application submitted successfully!', type: 'success' });
            setStartDate('');
            setEndDate('');
            setReason('');
            setDateError('');
            loadMyLeaves();
            setTimeout(() => {
                setActiveTab('my-leaves');
                setMessage(null);
            }, 2000);
        } catch {
            setMessage({ text: 'Failed to submit leave. Please try again.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openReviewModal = (id: number, action: 'Approved' | 'Rejected') => {
        setReviewComment('');
        setReviewModal({ id, action });
    };

    const handleReviewSubmit = async () => {
        if (!currentUser || !reviewModal) return;
        setIsReviewing(true);
        try {
            await leaveService.reviewLeave(reviewModal.id, reviewModal.action, currentUser.username, reviewComment);
            setReviewModal(null);
            loadPendingLeaves();
            loadAllLeaves();
        } catch {
            setMessage({ text: 'Failed to update leave status. Please try again.', type: 'error' });
        } finally {
            setIsReviewing(false);
        }
    };

    const displayList = activeTab === 'my-leaves' ? leaves : activeTab === 'pending' ? pendingLeaves : allLeaves;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white">
                    <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-docent-primary" />
                        Leave Management
                    </h1>
                    <p className="text-slate-400 font-medium">Applied & Approved exclusively via Docent Neural Cloud</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-50 p-2 gap-2 overflow-x-auto">
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex-shrink-0 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-white text-docent-primary shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                        >
                            <Clock className="h-4 w-4" />
                            Pending Review
                            {pendingLeaves.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingLeaves.length}</span>
                            )}
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-shrink-0 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'all' ? 'bg-white text-docent-primary shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                        >
                            <ClipboardList className="h-4 w-4" />
                            All Records
                        </button>
                    )}
                    {!isAdmin && (
                        <button
                            onClick={() => setActiveTab('apply')}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'apply' ? 'bg-white text-docent-primary shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                        >
                            <Send className="h-4 w-4" />
                            Apply New
                        </button>
                    )}
                    {!isAdmin && (
                        <button
                            onClick={() => setActiveTab('my-leaves')}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'my-leaves' ? 'bg-white text-docent-primary shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                        >
                            <ClipboardList className="h-4 w-4" />
                            My History
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-8">
                    {message && (
                        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {message.type === 'error' ? <XCircle className="h-5 w-5 flex-shrink-0" /> : <CheckCircle className="h-5 w-5 flex-shrink-0" />}
                            <span className="text-sm font-bold">{message.text}</span>
                            <button onClick={() => setMessage(null)} className="ml-auto"><X className="h-4 w-4" /></button>
                        </div>
                    )}

                    {activeTab === 'apply' && (
                        <form onSubmit={handleApply} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={today}
                                        value={startDate}
                                        onChange={(e) => handleStartDateChange(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-docent-primary focus:bg-white transition-all text-slate-700 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={startDate || today}
                                        value={endDate}
                                        onChange={(e) => handleEndDateChange(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-docent-primary focus:bg-white transition-all text-slate-700 font-bold"
                                    />
                                </div>
                            </div>
                            {dateError && (
                                <p className="text-red-500 text-sm font-bold flex items-center gap-2">
                                    <XCircle className="h-4 w-4" />{dateError}
                                </p>
                            )}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Reason for Leave</label>
                                <textarea
                                    required
                                    minLength={5}
                                    maxLength={1000}
                                    rows={4}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Explain your medical or personal reasons..."
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-docent-primary focus:bg-white transition-all text-slate-700 font-bold placeholder:text-slate-300"
                                />
                                <p className="text-[10px] text-slate-400 text-right">{reason.length}/1000</p>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || !!dateError}
                                className="w-full py-5 bg-docent-primary text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-green-500/30 hover:shadow-2xl hover:bg-green-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? 'Submitting...' : (<>Submit Leave Request <Send className="h-5 w-5" /></>)}
                            </button>
                        </form>
                    )}

                    {(activeTab === 'my-leaves' || activeTab === 'pending' || activeTab === 'all') && (
                        <div className="space-y-4">
                            {displayList.length === 0 ? (
                                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                    <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-200" />
                                    <p className="text-slate-400 font-bold">No leave records found</p>
                                </div>
                            ) : (
                                displayList.map((l) => (
                                    <div key={l.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-docent-primary/30 transition-all relative overflow-hidden">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 relative z-10">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${l.status === 'Approved' ? 'bg-green-100 text-green-600' : l.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {l.status === 'Approved' ? <CheckCircle className="h-5 w-5" /> : l.status === 'Rejected' ? <XCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{l.username} • {l.staffType}</p>
                                                        <h4 className="text-sm font-black text-slate-800">
                                                            {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                                                        </h4>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-500 font-bold italic ml-13 line-clamp-2">"{l.reason}"</p>
                                                {l.comments && (
                                                    <div className="mt-3 p-3 bg-white/70 rounded-xl border border-slate-100">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                            {l.status === 'Approved' ? 'Approved' : 'Rejected'} by {l.approvedBy}
                                                        </p>
                                                        <p className="text-xs text-slate-600 font-bold">{l.comments}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${l.status === 'Approved' ? 'bg-green-200 text-green-700' : l.status === 'Rejected' ? 'bg-red-200 text-red-700' : 'bg-blue-200 text-blue-700'}`}>
                                                    {l.status}
                                                </span>
                                                {activeTab === 'pending' && isAdmin && (
                                                    <div className="flex gap-2 mt-2 w-full">
                                                        <button
                                                            onClick={() => openReviewModal(l.id!, 'Approved')}
                                                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-black hover:bg-green-600 transition-all shadow-md shadow-green-500/20"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => openReviewModal(l.id!, 'Rejected')}
                                                            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-black hover:bg-red-600 transition-all shadow-md shadow-red-500/20"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                                            <Calendar className="h-24 w-24 text-slate-900" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Authorized Leave Records • Docent Neural Cloud</p>
                </div>
            </div>

            {/* Inline Review Modal */}
            {reviewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-xl font-black ${reviewModal.action === 'Approved' ? 'text-green-700' : 'text-red-700'}`}>
                                {reviewModal.action === 'Approved' ? '✓ Approve Leave' : '✗ Reject Leave'}
                            </h3>
                            <button onClick={() => setReviewModal(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                                    Comments <span className="text-slate-300 normal-case font-normal">(optional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    maxLength={500}
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Add a note for the staff member..."
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-docent-primary focus:bg-white transition-all text-slate-700 font-bold placeholder:text-slate-300"
                                />
                                <p className="text-[10px] text-slate-400 text-right mt-1">{reviewComment.length}/500</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setReviewModal(null)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReviewSubmit}
                                    disabled={isReviewing}
                                    className={`flex-1 py-3 text-white rounded-2xl font-black transition-all disabled:opacity-50 ${reviewModal.action === 'Approved' ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20' : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
                                >
                                    {isReviewing ? 'Saving...' : `Confirm ${reviewModal.action}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveManagement;

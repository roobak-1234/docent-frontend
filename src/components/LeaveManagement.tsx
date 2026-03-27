import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, ClipboardList, Send, CheckCircle, XCircle, Clock } from 'lucide-react';
import { authService } from '../services/AuthService';
import { leaveService, LeaveApplication } from '../services/LeaveService';

const LeaveManagement: React.FC = () => {
    const [currentUser] = useState(authService.getCurrentUser());
    const [activeTab, setActiveTab] = useState<'apply' | 'my-leaves' | 'pending'>(authService.getCurrentUser()?.userType === 'doctor' || authService.getCurrentUser()?.staffType === 'Administrator' ? 'pending' : 'apply');
    const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
    const [pendingLeaves, setPendingLeaves] = useState<LeaveApplication[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    // Form fields
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    const isAdmin = currentUser?.userType === 'doctor' || currentUser?.staffType === 'Administrator';

    const loadMyLeaves = useCallback(async () => {
        if (!currentUser) return;
        try {
            const data = await leaveService.getMyLeaves(currentUser.username);
            setLeaves(data);
        } catch (err) {
            console.error("Failed to load leaves:", err);
        }
    }, [currentUser]);

    const loadPendingLeaves = useCallback(async () => {
        try {
            const data = await leaveService.getPendingLeaves();
            setPendingLeaves(data);
        } catch (err) {
            console.error("Failed to load pending leaves:", err);
        }
    }, []);

    useEffect(() => {
        if (currentUser) {
            loadMyLeaves();
            if (isAdmin) {
                loadPendingLeaves();
                setActiveTab('pending');
            }
        }
    }, [currentUser, isAdmin, loadMyLeaves, loadPendingLeaves]);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        
        setIsSubmitting(true);
        try {
            await leaveService.applyLeave({
                username: currentUser.username,
                staffType: currentUser.staffType || currentUser.userType || 'Staff',
                startDate,
                endDate,
                reason
            });
            setMessage('Leave application submitted successfully!');
            setStartDate('');
            setEndDate('');
            setReason('');
            loadMyLeaves();
            setTimeout(() => {
                setActiveTab('my-leaves');
                setMessage('');
            }, 2000);
        } catch (err) {
            setMessage('Error submitting leave. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReview = async (id: number, status: 'Approved' | 'Rejected') => {
        if (!currentUser) return;
        const comments = prompt(`Reason for ${status.toLowerCase()} (optional):`) || "";
        
        try {
            await leaveService.reviewLeave(id, status, currentUser.username, comments);
            loadPendingLeaves();
        } catch (err) {
            alert("Error updating leave status.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white relative">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                            <Calendar className="h-8 w-8 text-docent-primary" />
                            Leave Management
                        </h1>
                        <p className="text-slate-400 font-medium">Applied & Approved exclusively via Docent Neural Cloud</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-50 p-2 gap-2">
                    {isAdmin && (
                        <button 
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'pending' ? 'bg-white text-docent-primary shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                        >
                            <Clock className="h-4 w-4" />
                            Pending Review
                            {pendingLeaves.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingLeaves.length}</span>
                            )}
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
                        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {message.includes('Error') ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                            <span className="text-sm font-bold">{message}</span>
                        </div>
                    )}

                    {activeTab === 'apply' && (
                        <form onSubmit={handleApply} className="space-y-6 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Start Date</label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-docent-primary focus:bg-white transition-all text-slate-700 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">End Date</label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-docent-primary focus:bg-white transition-all text-slate-700 font-bold"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Reason for Leave</label>
                                <textarea 
                                    required 
                                    rows={4}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Explain your medical or personal reasons..."
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-docent-primary focus:bg-white transition-all text-slate-700 font-bold placeholder:text-slate-300"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full py-5 bg-docent-primary text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-green-500/30 hover:shadow-2xl hover:bg-green-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? 'Transmitting Request...' : (
                                    <>
                                        Submit Leave Request 
                                        <Send className="h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {(activeTab === 'my-leaves' || (activeTab === 'pending' && isAdmin)) && (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            {(activeTab === 'my-leaves' ? leaves : pendingLeaves).length === 0 ? (
                                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                    <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-200" />
                                    <p className="text-slate-400 font-bold tracking-tight">No leave records found in the neural cache</p>
                                </div>
                            ) : (
                                (activeTab === 'my-leaves' ? leaves : pendingLeaves).map((l) => (
                                    <div key={l.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-docent-primary/30 transition-all group relative overflow-hidden">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 relative z-10">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${l.status === 'Approved' ? 'bg-green-100 text-green-600' : l.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {l.status === 'Approved' ? <CheckCircle className="h-5 w-5" /> : l.status === 'Rejected' ? <XCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{l.username} • {l.staffType}</p>
                                                        <h4 className="text-sm font-black text-slate-800">
                                                            {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                                                        </h4>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-500 font-bold pl-13 line-clamp-2 italic">"{l.reason}"</p>
                                                
                                                {l.comments && (
                                                    <div className="mt-4 p-3 bg-white/70 rounded-xl border border-slate-100">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Admin Notes</p>
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
                                                            onClick={() => handleReview(l.id!, 'Approved')}
                                                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-black hover:bg-green-600 transition-all shadow-md shadow-green-500/20"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => handleReview(l.id!, 'Rejected')}
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
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Authorized Leave Records • No Local Cache Enabled</p>
                </div>
            </div>
        </div>
    );
};

export default LeaveManagement;

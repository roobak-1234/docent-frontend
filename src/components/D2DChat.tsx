import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Shield, Users, Clock } from 'lucide-react';
import { authService } from '../services/AuthService';

interface Doctor {
  id: string;
  username: string;
  email: string;
  uniqueDoctorId: string;
  specialty?: string;
  isOnline: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  isEncrypted: boolean;
}

interface D2DChatProps {
  onBack: () => void;
}

const D2DChat: React.FC<D2DChatProps> = ({ onBack }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentUser] = useState(authService.getCurrentUser());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const registeredDoctors = await authService.getAllDoctors();
      setDoctors(registeredDoctors as Doctor[]);

      const savedMessages = localStorage.getItem('d2d_messages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !currentUser) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.username,
      content: newMessage.trim(),
      timestamp: Date.now(),
      isEncrypted: true
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    localStorage.setItem('d2d_messages', JSON.stringify(updatedMessages));
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!currentUser || currentUser.userType !== 'doctor') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Access Restricted</h3>
          <p className="text-slate-600 max-w-xs mx-auto">D2D Chat is only available to registered doctors for secure consultation.</p>
          <button
            onClick={onBack}
            className="mt-6 px-6 py-2.5 bg-lifelink-primary text-white rounded-xl hover:bg-green-600 transition-all font-bold shadow-lg shadow-green-500/20 active:scale-95"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pt-20 bg-slate-50 flex flex-col z-10">
      <div className="flex-1 m-0 sm:m-4 flex flex-col bg-white sm:rounded-2xl shadow-xl sm:border border-slate-100 overflow-hidden relative">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-lifelink-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-lifelink-primary" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">D2D Secured Chat</h2>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                   <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Consultation Active</p>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-600"
          >
            <Users className="h-5 w-5" />
          </button>
          <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <Users className="h-3 w-3" />
            <span>{doctors.filter(d => d.isOnline).length} CONSULTANTS ONLINE</span>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 relative">
          {/* Sidebar - Responsive */}
          <div className={`
            ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            absolute lg:relative z-20 w-72 sm:w-80 h-full border-r border-slate-100 bg-slate-50 p-4 overflow-y-auto transition-transform duration-300 ease-in-out
          `}>
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Available Consultants</h3>
               <button onClick={() => setShowSidebar(false)} className="lg:hidden p-1 text-slate-400">
                  <ArrowLeft className="h-4 w-4 rotate-180" />
               </button>
            </div>
            <div className="space-y-3">
              {doctors.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 text-center">No other doctors found in your network.</p>
              ) : (
                doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className={`p-3 rounded-xl transition-all border ${doctor.id === currentUser.id
                      ? 'bg-lifelink-primary/5 border-lifelink-primary/20 ring-1 ring-lifelink-primary/10'
                      : 'bg-white border-transparent hover:border-slate-200 shadow-sm hover:shadow-md'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-lifelink-primary/10 flex items-center justify-center text-lifelink-primary font-black text-sm border border-lifelink-primary/5">
                          {doctor.username.charAt(0).toUpperCase()}
                        </div>
                        {doctor.isOnline && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white ring-1 ring-green-100"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          Dr. {doctor.username}
                          {doctor.id === currentUser.id && ' (You)'}
                        </p>
                        <p className="text-[10px] font-bold text-lifelink-primary uppercase tracking-tighter">{doctor.specialty || 'Medical Officer'}</p>
                        <p className="text-[9px] text-slate-400 font-mono font-medium truncate opacity-60 mt-0.5">{doctor.uniqueDoctorId}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-slate-50/30">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6 border border-slate-50">
                    <Shield className="h-10 w-10 text-slate-200" />
                  </div>
                  <h4 className="text-xl font-black text-slate-800 mb-2">End-to-End Encrypted</h4>
                  <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                    Messages are protected with AES-256 for secure medical consultations.
                  </p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const showDate = index === 0 ||
                    formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
                  const isOwnMessage = message.senderId === currentUser.id;

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex items-center gap-4 my-8">
                          <div className="flex-1 h-[1px] bg-slate-200"></div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                            {formatDate(message.timestamp)}
                          </span>
                          <div className="flex-1 h-[1px] bg-slate-200"></div>
                        </div>
                      )}
                      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-[70%] lg:max-w-md ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm ${isOwnMessage
                            ? 'bg-lifelink-primary text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                            }`}>
                            {!isOwnMessage && (
                              <p className="text-[10px] font-black mb-1.5 uppercase tracking-wider text-lifelink-primary">
                                Dr. {message.senderName}
                              </p>
                            )}
                            <p className="leading-relaxed whitespace-pre-wrap font-medium">{message.content}</p>
                            <div className={`flex items-center gap-2 mt-2 pt-1 border-t ${isOwnMessage ? 'border-white/10' : 'border-slate-50'} ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              <Clock className={`h-3 w-3 ${isOwnMessage ? 'opacity-60' : 'text-slate-300'}`} />
                              <span className={`text-[10px] font-bold ${isOwnMessage ? 'opacity-70' : 'text-slate-400'}`}>{formatTime(message.timestamp)}</span>
                              {message.isEncrypted && (
                                <Shield className={`h-3 w-3 ${isOwnMessage ? 'opacity-60' : 'text-slate-300'}`} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 sm:p-6 bg-white border-t border-slate-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full relative group">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your secure message..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-lifelink-primary focus:border-transparent focus:bg-white transition-all text-sm font-medium resize-none shadow-inner"
                    rows={2}
                  />
                  <div className="absolute top-2 right-4 flex items-center gap-1.5">
                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest hidden sm:inline">Secured Channel</span>
                     <Shield className="h-3.5 w-3.5 text-slate-200" />
                  </div>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="w-full sm:w-auto px-8 py-4 bg-lifelink-primary hover:bg-green-600 disabled:bg-slate-200 text-white rounded-2xl transition-all shadow-lg shadow-green-500/10 disabled:shadow-none flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs active:scale-95"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default D2DChat;
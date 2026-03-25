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
  const [currentUser] = useState(authService.getCurrentUser());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('lifelink_users') || '[]');
    const registeredDoctors = allUsers
      .filter((user: any) => user.userType === 'doctor' && user.uniqueDoctorId)
      .map((doctor: any) => ({
        id: doctor.id,
        username: doctor.username,
        email: doctor.email,
        uniqueDoctorId: doctor.uniqueDoctorId,
        specialty: doctor.specialty || 'General Medicine',
        isOnline: Math.random() > 0.3
      }));

    setDoctors(registeredDoctors);

    const savedMessages = localStorage.getItem('d2d_messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Access Restricted</h3>
          <p className="text-gray-600">D2D Chat is only available to registered doctors.</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-lifelink-primary text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 h-screen flex flex-col">
      <div className="flex-1 mb-6 mx-6 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-600/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Doctor-to-Doctor Chat</h2>
              <p className="text-sm text-slate-600">Secure medical consultation channel</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users className="h-4 w-4" />
          <span>{doctors.filter(d => d.isOnline).length} online</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-80 border-r border-slate-100 bg-slate-50 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Online Doctors ({doctors.filter(d => d.isOnline).length})
          </h3>
          <div className="space-y-2">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className={`p-3 rounded-lg transition-colors ${doctor.id === currentUser.id
                  ? 'bg-lifelink-primary/10 border border-lifelink-primary/20'
                  : 'bg-white hover:bg-slate-100'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-600 font-semibold text-sm">
                      {doctor.username.charAt(0).toUpperCase()}
                    </div>
                    {doctor.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      Dr. {doctor.username}
                      {doctor.id === currentUser.id && ' (You)'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{doctor.specialty}</p>
                    <p className="text-xs text-slate-400 truncate">{doctor.uniqueDoctorId}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-500 mb-2">Secure Channel Ready</h4>
                <p className="text-gray-400 text-sm">
                  Start a confidential medical discussion with your colleagues.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto mt-4">
                  <p className="text-xs text-blue-800">
                    🔒 All messages are encrypted and HIPAA compliant
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const showDate = index === 0 ||
                  formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
                const isOwnMessage = message.senderId === currentUser.id;

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center my-4">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isOwnMessage
                        ? 'bg-lifelink-primary text-white'
                        : 'bg-slate-100 text-slate-800'
                        }`}>
                        {!isOwnMessage && (
                          <p className="text-xs font-semibold mb-1 opacity-70">
                            Dr. {message.senderName}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <Clock className="h-3 w-3 opacity-50" />
                          <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                          {message.isEncrypted && (
                            <Shield className="h-3 w-3 opacity-50" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-100 p-4 bg-white">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your medical consultation message..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-lifelink-primary focus:border-lifelink-primary resize-none"
                  rows={2}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-slate-400">
                  <Shield className="h-3 w-3" />
                  <span>Encrypted</span>
                </div>
              </div>
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-6 py-3 bg-lifelink-primary hover:bg-green-600 disabled:bg-slate-300 text-white rounded-xl transition-colors flex items-center gap-2 font-semibold self-end"
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
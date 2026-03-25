import React, { useState } from 'react';
import { Send, User } from 'lucide-react';

interface Message {
    id: string;
    sender: string;
    text: string;
    timestamp: Date;
    isSelf: boolean;
}

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'Dr. Smith', text: 'Patient #2024-001 showing irregular heart rhythm.', timestamp: new Date(Date.now() - 1000 * 60 * 5), isSelf: true },
        { id: '2', sender: 'Dr. Jones', text: 'I see it. SpO2 is stable though. Let\'s monitor for another hour.', timestamp: new Date(Date.now() - 1000 * 60 * 2), isSelf: false },
    ]);
    const [inputText, setInputText] = useState('');

    const handleSend = () => {
        if (!inputText.trim()) return;
        const newItem: Message = {
            id: Date.now().toString(),
            sender: 'Dr. Smith',
            text: inputText,
            timestamp: new Date(),
            isSelf: true
        };
        setMessages([...messages, newItem]);
        setInputText('');
    };

    return (
        <div className="flex flex-col h-[600px] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-lifelink-primary/10 rounded-full">
                        <User className="text-lifelink-primary w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Cardiology Team Chat</h3>
                        <p className="text-xs text-slate-400 max-w-[200px] truncate">Secure D2D Encrypted Channel</p>
                    </div>
                </div>
                <span className="px-3 py-1 text-xs font-bold text-lifelink-primary bg-lifelink-card rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-lifelink-primary"></span> Online
                </span>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isSelf ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${msg.isSelf ? 'bg-lifelink-secondary text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'}`}>
                            {!msg.isSelf && <p className="text-xs font-bold text-lifelink-primary mb-1">{msg.sender}</p>}
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            <p className={`text-[10px] mt-2 text-right ${msg.isSelf ? 'text-blue-50' : 'text-slate-400'}`}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-5 bg-white border-t border-slate-100 flex gap-3">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a secure message..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-lifelink-secondary/50 focus:border-lifelink-secondary outline-none transition-all shadow-inner"
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                    onClick={handleSend}
                    className="bg-lifelink-secondary hover:bg-blue-400 text-white p-3 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;

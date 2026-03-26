import React from 'react';
import { Bell } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {

    return (
        <div className="flex h-screen bg-docent-bg text-docent-text overflow-hidden font-sans relative">
            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-docent-bg relative pt-20">
                {/* Decorative Background Blur */}
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-docent-primary/5 to-transparent pointer-events-none" />

                {/* Header */}
                <header className="h-20 flex items-center justify-between px-4 sm:px-8 z-10 w-full">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">Patient Console</h1>
                        <p className="hidden sm:block text-sm text-slate-500 font-medium">Real-time telemetry & analytics</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 sm:p-2.5 bg-white hover:bg-slate-50 border border-slate-100 shadow-sm rounded-xl transition-all relative group">
                            <Bell className="w-5 h-5 text-slate-400 group-hover:text-docent-primary transition-colors" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-docent-warning rounded-full animate-pulse ring-2 ring-white"></span>
                        </button>
                    </div>
                </header>

                {/* Dashboard View */}
                <div className="flex-1 overflow-auto p-4 sm:p-8 pt-2 sm:pt-4 z-10 w-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;

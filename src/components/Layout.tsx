import React from 'react';
import { Activity, MessageSquare, Bell } from 'lucide-react';
import { authService } from '../services/AuthService';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const currentUser = authService.getCurrentUser();

    return (
        <div className="flex h-screen bg-lifelink-bg text-lifelink-text overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col z-10">
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-lifelink-primary/10 p-2 rounded-lg">
                        <Activity className="text-lifelink-primary w-6 h-6" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-800">Docent</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {currentUser?.userType !== 'nurse' && (
                        <>
                            <NavItem icon={<Activity />} label="RPM Dashboard" active />
                            <NavItem icon={<MessageSquare />} label="D2D Chat" onClick={() => window.location.href = '/d2d-chat'} />
                        </>
                    )}
                </nav>

                {currentUser?.userType !== 'nurse' && (
                    <div className="p-4 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-lifelink-secondary/20 flex items-center justify-center font-bold text-lifelink-secondary">
                                {currentUser?.userType === 'doctor' ? 'Dr' : currentUser?.userType?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">
                                    {currentUser?.userType === 'doctor' ? `Dr. ${currentUser.username}` : currentUser?.username || 'User'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {currentUser?.userType === 'doctor' ? 'Doctor' :
                                        currentUser?.userType === 'staff' ? currentUser.staffType || 'Staff' :
                                            'Patient'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-lifelink-bg relative pt-20">
                {/* Decorative Background Blur */}
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-lifelink-primary/5 to-transparent pointer-events-none" />

                {/* Header */}
                <header className="h-20 flex items-center justify-between px-8 z-10">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Patient Monitoring Console</h1>
                        <p className="text-sm text-slate-500">Real-time telemetry & analytics</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 bg-white hover:bg-slate-50 border border-slate-100 shadow-sm rounded-full transition-all relative group">
                            <Bell className="w-5 h-5 text-slate-400 group-hover:text-lifelink-primary transition-colors" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-lifelink-warning rounded-full animate-pulse"></span>
                        </button>
                    </div>
                </header>

                {/* Dashboard View */}
                <div className="flex-1 overflow-auto p-8 pt-4 z-10">
                    {children}
                </div>
            </main>
        </div>
    );
};

// Updated NavItem to handle props correctly and style active state
const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
    <button onClick={onClick} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-lifelink-primary text-white shadow-lg shadow-lifelink-primary/30' : 'text-slate-500 hover:bg-slate-50 hover:text-lifelink-primary'}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 20, className: active ? 'text-white' : 'group-hover:text-lifelink-primary transition-colors' })}
        <span className="font-medium">{label}</span>
    </button>
);

export default Layout;

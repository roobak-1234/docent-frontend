import React from 'react';
import { Menu, X, LogOut } from 'lucide-react';

interface HeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  currentUser: any;
  onSignup: () => void;
  onSignin: () => void;
  onSignout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isMenuOpen, setIsMenuOpen, currentUser, onSignup, onSignin, onSignout }) => {
  const handleSignout = () => {
    onSignout();
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all duration-300">
      <div className="w-full">
        <div className="flex justify-between items-center h-20 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center space-x-4 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-transparent group-hover:scale-105 transition-transform duration-300">
              <img src="/docent_logo.png" alt="Docent Logo" className="h-[72px] w-[72px] object-contain" />
            </div>
            <span className="text-4xl font-black text-slate-900 tracking-tighter">Docent</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {!currentUser ? (
              <>
                <a href="#features" className="text-sm font-medium text-slate-600 hover:text-lifelink-primary transition-colors">Features</a>
                <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-lifelink-primary transition-colors">How It Works</a>

                <div className="h-6 w-px bg-slate-200 mx-2"></div>

                <button
                  onClick={onSignin}
                  className="text-sm font-bold text-slate-700 hover:text-lifelink-primary transition-colors px-4 py-2"
                >
                  Sign In
                </button>
                <button
                  onClick={onSignup}
                  className="bg-lifelink-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-green-600 transition-all shadow-md shadow-green-500/20 hover:-translate-y-0.5"
                >
                  Get Started
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-6">
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-700">
                    Hi, {currentUser.username}
                  </span>
                </div>

                <button
                  onClick={handleSignout}
                  className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 transition-colors bg-red-50 px-4 py-2 rounded-full hover:bg-red-100"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white absolute w-full shadow-xl">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {!currentUser ? (
              <>
                <a href="#features" className="block px-4 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Features</a>
                <a href="#how-it-works" className="block px-4 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 rounded-lg">How It Works</a>
                <div className="border-t border-slate-100 my-2"></div>
                <button onClick={onSignin} className="block w-full text-left px-4 py-3 text-base font-bold text-slate-700 hover:bg-slate-50 rounded-lg">Sign In</button>
                <button onClick={onSignup} className="block w-full text-center px-4 py-3 mt-2 text-base font-bold text-white bg-lifelink-primary rounded-xl">Get Started</button>
              </>
            ) : (
              <>
                <div className="px-4 py-3">
                  <span className="text-sm text-slate-500">Signed in as {currentUser.username}</span>
                </div>
                <button onClick={handleSignout} className="block w-full text-left px-4 py-3 text-base font-bold text-red-500 hover:bg-red-50 rounded-lg">
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
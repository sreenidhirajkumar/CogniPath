import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatBot from './ChatBot';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
            <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="bg-indigo-500 p-2 rounded-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                            </div>
                            <span className="font-bold text-xl tracking-tight">CogniPath</span>
                        </Link>
                        <div className="flex gap-6 items-center">
                            {user ? (
                                <>
                                    <Link to="/dashboard" className="text-sm font-medium hover:text-indigo-400 transition-colors">Dashboard</Link>
                                    <Link to="/learning-path" className="text-sm font-medium hover:text-indigo-400 transition-colors">My Path</Link>
                                    <div className="h-4 w-px bg-slate-700"></div>
                                    <span className="text-sm text-slate-400">Hi, {user.username}</span>
                                    <button onClick={handleLogout} className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors">Logout</button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="text-sm font-medium hover:text-indigo-400 transition-colors">Login</Link>
                                    <Link to="/register" className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 rounded-full transition-colors">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
            {user && <ChatBot />}
        </div>
    );
};

export default Layout;

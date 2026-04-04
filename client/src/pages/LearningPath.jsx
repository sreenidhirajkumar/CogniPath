import React, { useEffect, useState } from 'react';
import api from '../api';
import Assessment from '../components/Assessment';
import CodeChallenge from '../components/CodeChallenge';
import { motion } from 'framer-motion';

const LearningPath = () => {
    const [pathData, setPathData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [activeQuizId, setActiveQuizId] = useState(null);
    const [activeCodeChallenge, setActiveCodeChallenge] = useState(null);

    useEffect(() => {
        const fetchPath = async () => {
            try {
                const response = await api.get('/learning-path');
                setPathData(response.data);
            } catch (error) {
                console.error("Failed to fetch learning path", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPath();
    }, []);

    const handleVisit = async (itemId, url) => {
        try {
            await api.post(`/learning-path/item/${itemId}/visit`);
            // Update local state
            setPathData(prev => ({
                ...prev,
                modules: prev.modules.map(m =>
                    m.id === itemId ? { ...m, is_visited: true } : m
                )
            }));
            // Open link in new tab
            window.open(url, '_blank');
        } catch (error) {
            console.error("Failed to record visit", error);
            // Still open the link even if API fails for UX
            window.open(url, '_blank');
        }
    };

    const handleComplete = async (itemId) => {
        try {
            await api.post(`/learning-path/item/${itemId}/complete`);
            // Update local state
            setPathData(prev => ({
                ...prev,
                modules: prev.modules.map(m =>
                    m.id === itemId ? { ...m, status: 'completed' } : m
                )
            }));
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to mark course as completed";
            alert(errorMsg);
            console.error(errorMsg, error);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

    if (activeQuizId) {
        return (
            <div className="py-8 animate-in fade-in">
                <button
                    onClick={() => setActiveQuizId(null)}
                    className="mb-6 text-slate-400 hover:text-white flex items-center gap-2"
                >
                    &larr; Back to Path
                </button>
                <Assessment quizId={activeQuizId} difficulty={pathData?.user_skill_level} onComplete={() => { setActiveQuizId(null); handleComplete(pathData.modules.find(m => m.quiz_id === activeQuizId)?.id); }} />
            </div>
        );
    }

    if (activeCodeChallenge) {
        return <CodeChallenge
            challengeDescription={`Write the core logic to master: ${activeCodeChallenge.course_title}. Make sure it is clean and efficient.`}
            onComplete={() => { handleComplete(activeCodeChallenge.id); setActiveCodeChallenge(null); }}
            onBack={() => setActiveCodeChallenge(null)}
        />;
    }

    if (!pathData) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-slate-300">No Learning Path Found</h2>
            <p className="text-slate-500 mt-2">Go to dashboard to select a goal.</p>
        </div>
    );

    // Calculate Progress
    const completedCount = pathData.modules.filter(m => m.status === 'completed').length;
    const totalCount = pathData.modules.length;
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-10 text-center">
                <span className="text-indigo-400 font-bold tracking-wider text-sm uppercase">Your Personalized Roadmap</span>
                <h1 className="text-4xl font-bold text-white mt-2 mb-4">{pathData.title}</h1>



                {/* Progress Bar */}
                <div className="max-w-xl mx-auto mb-8 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex justify-between text-sm text-slate-400 mb-2 font-mono">
                        <span>Progress</span>
                        <span>{progressPercentage}% ({completedCount}/{totalCount})</span>
                    </div>
                    <div className="h-4 bg-slate-700 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="relative flex flex-col items-center gap-16 pb-20 mt-12 w-full">
                {/* Central animated spine */}
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "100%" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute top-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-slate-800 z-0 hidden md:block"
                />

                {pathData.modules.map((module, index) => {
                    const prevModule = index > 0 ? pathData.modules[index - 1] : null;
                    const isLocked = prevModule && (prevModule.status !== 'completed' || prevModule.assessment_score === 0);
                    const failedQuiz = module.assessment_score === 0;
                    const isCodeEligible = module.course_title.toLowerCase().match(/(javascript|python|react|flask)/);

                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 50, x: index % 2 === 0 ? -50 : 50 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            transition={{ delay: index * 0.2, duration: 0.6, type: 'spring' }}
                            key={index}
                            className={`relative z-10 w-full md:w-[45%] ${index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'} transition-all duration-500 ${isLocked ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100 hover:scale-[1.03]'}`}
                        >
                            {/* Branch connector connecting node to central spine */}
                            <div className={`absolute top-1/2 w-10 border-b-4 hidden md:block z-0 ${module.status === 'completed' ? 'border-green-500' : 'border-indigo-500/50'} ${index % 2 === 0 ? '-right-10' : '-left-10'}`}></div>

                            {/* Node Core */}
                            <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 hidden md:block z-20 bg-slate-900 ${module.status === 'completed' ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.7)]' : 'border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.7)]'} ${index % 2 === 0 ? '-right-12' : '-left-12'}`}></div>

                            <div className={`rounded-3xl p-7 border-2 shadow-2xl backdrop-blur-sm transition-all duration-300 ${module.status === 'completed' ? 'bg-slate-800/80 border-green-500/40 shadow-green-900/20' : 'bg-slate-800/90 border-slate-600 hover:border-indigo-500 shadow-indigo-900/30'}`}>
                                <div className="flex flex-col gap-5">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 justify-between">
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide bg-slate-700 text-slate-300 shadow-inner">{module.difficulty}</span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-inner ${module.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                {module.status === 'completed' ? 'COMPLETED' : 'PENDING'}
                                            </span>
                                        </div>
                                        {module.is_visited && module.status !== 'completed' && (
                                            <span className="text-xs text-indigo-400 font-bold italic flex items-center gap-2">
                                                <span className="h-2 w-2 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    {/* Main Tite */}
                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-2 leading-tight">
                                            {isLocked && <span className="mr-2 opacity-70">🔒</span>}
                                            {module.course_title}
                                        </h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">{module.description}</p>
                                    </div>

                                    {/* Alerts */}
                                    {failedQuiz && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                                            <span className="text-xl">⚠️</span>
                                            <p className="text-red-400 text-xs font-bold leading-snug">
                                                Assessment Failed. Please review the material and try again.
                                            </p>
                                        </div>
                                    )}

                                    {module.assessment_score > 0 && (
                                        <div className="text-green-400 text-sm font-mono font-bold bg-green-500/10 inline-block px-3 py-1 rounded-lg w-fit">
                                            Last Score: {module.assessment_score}%
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-3 mt-2 border-t border-slate-700/50 pt-5">
                                        {module.url && (
                                            <button
                                                onClick={() => handleVisit(module.id, module.url)}
                                                className="flex-1 min-w-[120px] py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-all border-b-4 border-slate-900 active:border-b-0 active:translate-y-1"
                                            >
                                                {module.is_visited ? 'Review Material' : '📖 Study Course'}
                                            </button>
                                        )}

                                        {module.has_quiz && (
                                            <button
                                                onClick={() => setActiveQuizId(module.quiz_id)}
                                                disabled={!module.is_visited}
                                                className={`flex-1 min-w-[120px] py-2.5 text-sm font-bold rounded-xl transition-all border-b-4 ${module.is_visited
                                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-900 active:border-b-0 active:translate-y-1'
                                                    : 'bg-slate-800 text-slate-600 border-slate-900 cursor-not-allowed'
                                                    }`}
                                            >
                                                📝 {failedQuiz ? 'Retry Quiz' : 'Take Quiz'}
                                            </button>
                                        )}

                                        {isCodeEligible && module.status !== 'completed' && (
                                            <button
                                                onClick={() => setActiveCodeChallenge(module)}
                                                disabled={!module.is_visited}
                                                className={`flex-1 min-w-[120px] overflow-hidden relative py-2.5 text-sm font-bold rounded-xl transition-all border-b-4 ${module.is_visited
                                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-900 shadow-[0_0_15px_rgba(79,70,229,0.3)] active:border-b-0 active:translate-y-1 hover:brightness-110'
                                                    : 'bg-slate-800 text-slate-600 border-slate-900 cursor-not-allowed'
                                                    }`}
                                            >
                                                💻 Code Challenge
                                            </button>
                                        )}

                                        {module.status !== 'completed' && !module.has_quiz && !isCodeEligible && (
                                            <button
                                                onClick={() => handleComplete(module.id)}
                                                disabled={!module.is_visited}
                                                className={`flex-1 min-w-[120px] py-2.5 text-sm font-bold rounded-xl transition-all border-b-4 ${module.is_visited
                                                    ? 'bg-green-600 hover:bg-green-500 text-white border-green-900 active:border-b-0 active:translate-y-1'
                                                    : 'bg-slate-800 text-slate-600 border-slate-900 cursor-not-allowed'
                                                    }`}
                                            >
                                                ✅ Mark Done
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Completion Prompt */}
            {pathData.is_completed && (
                <div className="mt-8 p-10 bg-gradient-to-br from-indigo-900/50 to-slate-800 rounded-3xl border border-indigo-500/40 text-center animate-in slide-in-from-bottom-10 duration-700 shadow-[0_0_50px_rgba(79,70,229,0.15)]">
                    <div className="text-5xl mb-6">🏆</div>
                    <h2 className="text-3xl font-bold text-white mb-4">
                        {pathData.user_skill_level === 'Beginner' ? 'Basics Mastered!' : 'Tier Completed!'}
                    </h2>
                    <p className="text-indigo-200 text-lg mb-8 max-w-lg mx-auto">
                        {pathData.user_skill_level === 'Beginner'
                            ? "You've successfully completed all beginner courses in this path. It's time to take your level-up assessment and decide your next move."
                            : "You've finished this tier! Ready to continue your journey or explore a new career horizon?"}
                    </p>

                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            {/* If there's a final quiz in the path, use it, otherwise link to a general one */}
                            <button
                                onClick={() => {
                                    const lastModule = pathData.modules[pathData.modules.length - 1];
                                    if (lastModule && lastModule.has_quiz) {
                                        setActiveQuizId(lastModule.quiz_id);
                                    } else {
                                        window.location.href = '/dashboard';
                                    }
                                }}
                                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95"
                            >
                                Take Final Assessment &rarr;
                            </button>
                        </div>

                        <div className="pt-6 border-t border-slate-700/50">
                            <p className="text-slate-400 text-sm mb-4">What's your next move?</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={async () => {
                                        // Re-trigger path generation for the same goal (it will pick the next skill level if upgraded)
                                        try {
                                            // We need the goal_id. For now, assuming current goal is still primary.
                                            // In a real app, we'd store goal_id in pathData.
                                            // Fallback to nav to dashboard if goal selection is needed.
                                            window.location.href = '/dashboard';
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }}
                                    className="px-8 py-3 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 font-bold rounded-xl transition-all"
                                >
                                    Continue in Same Goal
                                </button>
                                <button
                                    onClick={() => window.location.href = '/dashboard'}
                                    className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all"
                                >
                                    Change Career Goal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearningPath;

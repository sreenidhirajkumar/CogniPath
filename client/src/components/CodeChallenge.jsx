import React, { useState } from 'react';
import api from '../api';

const CodeChallenge = ({ challengeDescription, onComplete, onBack }) => {
    const [code, setCode] = useState('');
    const [grading, setGrading] = useState(false);
    const [result, setResult] = useState(null);

    const handleGrade = async () => {
        if (!code.trim()) return;
        setGrading(true);
        try {
            const res = await api.post('/ai/code/grade', {
                challenge: challengeDescription,
                code: code
            });
            setResult(res.data);
        } catch (error) {
            console.error(error);
            alert("Failed to grade code");
        } finally {
            setGrading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-8 animate-in fade-in duration-500">
            <button onClick={onBack} className="mb-6 text-slate-400 hover:text-white flex items-center gap-2">
                &larr; Back to Path
            </button>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-slate-700 bg-slate-900/80">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span>💻</span> Smart Code Grader
                    </h2>
                    <p className="text-slate-300 mt-2 text-lg leading-relaxed">{challengeDescription}</p>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-800/50">
                    {/* Left: Editor */}
                    <div className="flex flex-col h-full">
                        <label className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center justify-between">
                            Your Solution
                            <span className="text-xs font-normal text-indigo-400">framer-motion, python, etc</span>
                        </label>
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="bg-[#1e1e1e] border-2 border-slate-700 hover:border-indigo-500/50 rounded-xl p-5 text-emerald-400 font-mono text-sm w-full h-[400px] focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                            placeholder="Write your code here...&#10;&#10;function solve() {&#10;    // logic&#10;}"
                            spellCheck="false"
                        ></textarea>
                    </div>

                    {/* Right: Feedback */}
                    <div className="flex flex-col h-full">
                        <label className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">AI Verification</label>
                        <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-6 h-[400px] overflow-y-auto">
                            {!result && !grading && (
                                <div className="text-slate-500 text-center flex flex-col items-center justify-center h-full">
                                    <div className="text-5xl mb-4 opacity-50">🤖</div>
                                    <p className="text-lg">Waiting for submission...</p>
                                    <p className="text-sm mt-2 opacity-60">The AI will review your code for bugs and efficiency.</p>
                                </div>
                            )}
                            {grading && (
                                <div className="text-indigo-400 flex flex-col items-center justify-center h-full animate-pulse">
                                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    Analyzing code syntax & logic...
                                </div>
                            )}
                            {result && !grading && (
                                <div className="animate-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-700">
                                        <div className={`text-5xl font-black ${result.score >= 80 ? 'text-green-500' : 'text-yellow-500'} drop-shadow-lg`}>
                                            {result.score}%
                                        </div>
                                        <div>
                                            <h3 className="text-white text-xl font-bold">{result.score >= 80 ? 'Test Passed!' : 'Needs More Work'}</h3>
                                            <p className="text-sm text-slate-400">Score Evaluation</p>
                                        </div>
                                    </div>

                                    <h4 className="text-white font-bold text-lg mb-2">Feedback</h4>
                                    <p className="text-slate-300 text-sm leading-relaxed mb-6 bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                                        {result.feedback}
                                    </p>

                                    {result.hints && result.hints.length > 0 && (
                                        <>
                                            <h4 className="text-white font-bold text-lg mb-3">Hints & Best Practices</h4>
                                            <ul className="space-y-3 mb-6">
                                                {result.hints.map((hint, i) => (
                                                    <li key={i} className="text-sm text-yellow-100 bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl flex gap-3 shadow-lg">
                                                        <span className="text-xl">💡</span> <span className="leading-relaxed">{hint}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    )}

                                    {result.score >= 80 && (
                                        <button
                                            onClick={onComplete}
                                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all hover:scale-[1.02]"
                                        >
                                            Complete Path Item
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-700 bg-slate-900">
                    <button
                        onClick={handleGrade}
                        disabled={grading || !code.trim() || (result && result.score >= 80)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold py-4 text-lg rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                    >
                        {grading ? 'Evaluating via AI...' : (result && result.score >= 80) ? 'Challenge Completed' : 'Submit Code for AI Verification'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CodeChallenge;

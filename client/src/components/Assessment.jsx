import React, { useState, useEffect } from 'react';
import api from '../api';

const Assessment = ({ quizId, difficulty, onComplete }) => {
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [generatingAI, setGeneratingAI] = useState(false);

    const handleGenerateAIQuiz = async () => {
        setGeneratingAI(true);
        try {
            const res = await api.post('/ai/quiz/generate', {
                topic: currentQuiz.title,
                difficulty: difficulty || 'Intermediate'
            });
            if (res.data.questions) {
                setCurrentQuiz(prev => ({ ...prev, questions: res.data.questions }));
                setAnswers({});
                setResult(null);
            } else if (res.data.error) {
                alert("AI Generation Error: " + res.data.error);
            }
        } catch (error) {
            console.error("Failed to generate AI quiz", error);
            alert("Error connecting to AI service.");
        } finally {
            setGeneratingAI(false);
        }
    };

    useEffect(() => {
        const fetchQuizData = async () => {
            try {
                if (quizId) {
                    const res = await api.get(`/quiz/${quizId}`);
                    setCurrentQuiz(res.data);
                } else {
                    // Fallback to fetching recommended quiz
                    const res = await api.get('/quizzes');
                    if (res.data.length > 0) {
                        const detailRes = await api.get(`/quiz/${res.data[0].id}`);
                        setCurrentQuiz(detailRes.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch quiz", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuizData();
    }, [quizId, difficulty]);

    const handleAnswer = (questionId, option) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < currentQuiz.questions.length) {
            alert("Please answer all questions before submitting.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post(`/quiz/${currentQuiz.id}/submit`, { answers });
            setResult(res.data);
        } catch (error) {
            console.error("Failed to submit quiz", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center py-8 text-slate-400">Loading assessment...</div>;
    if (!currentQuiz) return <div className="text-center py-8 text-slate-400">No assessment available for this level yet.</div>;

    console.log("Rendering Quiz:", currentQuiz);

    if (!currentQuiz.questions || currentQuiz.questions.length === 0) {
        return <div className="text-center py-8 text-slate-400">This quiz has no questions yet.</div>;
    }

    if (result) {
        return (
            <div className="bg-slate-800 p-8 rounded-2xl border border-indigo-500/30 text-center animate-in zoom-in duration-300">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h2>
                <p className="text-slate-300 mb-6">You scored <span className={`font-bold text-xl ${result.score === 0 ? 'text-red-400' : 'text-indigo-400'}`}>{result.score}%</span></p>
                <div className={`p-4 rounded-xl mb-6 ${result.score === 0 ? 'bg-red-500/10' : 'bg-indigo-500/10'}`}>
                    <p className={`text-sm italic ${result.score === 0 ? 'text-red-300' : 'text-indigo-300'}`}>
                        {result.score === 0
                            ? "Please revisit the module's study materials and try again to unlock the next course."
                            : `Your skill level is now: ${result.new_skill_level}`}
                    </p>
                </div>
                <button
                    onClick={onComplete}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full transition-all"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
            <div className="bg-indigo-600 p-6 text-white text-center flex flex-col items-center">
                <h2 className="text-2xl font-bold">{currentQuiz.title}</h2>
                <p className="text-indigo-200 text-sm mt-1 mb-4">Difficulty: {difficulty}</p>
                <button
                    onClick={handleGenerateAIQuiz}
                    disabled={generatingAI}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold rounded-lg transition-colors shadow shadow-indigo-900/20 disabled:opacity-50"
                >
                    ✨ {generatingAI ? 'Generating...' : 'Generate New AI Quiz'}
                </button>
            </div>

            <div className="p-8 space-y-8">
                {currentQuiz.questions.map((q, idx) => (
                    <div key={q.id} className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">
                            <span className="text-indigo-400 mr-2">{idx + 1}.</span> {q.text}
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {Object.entries(q.options).map(([key, val]) => (
                                <button
                                    key={key}
                                    onClick={() => handleAnswer(q.id, key)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${answers[q.id] === key
                                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/50'
                                        : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
                                        }`}
                                >
                                    <span className="font-bold mr-3">{key}.</span> {val}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-6 border-t border-slate-700 bg-slate-900/50">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                >
                    {submitting ? 'Submitting...' : 'Submit Assessment'}
                </button>
            </div>
        </div>
    );
};

export default Assessment;

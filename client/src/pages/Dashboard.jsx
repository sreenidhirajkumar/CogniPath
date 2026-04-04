import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import Assessment from '../components/Assessment';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

const Dashboard = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [activePath, setActivePath] = useState(null);
    const [loading, setLoading] = useState(true);
    const [settingGoal, setSettingGoal] = useState(false);
    const [showAssessment, setShowAssessment] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch available goals
                const goalsRes = await api.get('/user/goals');
                setGoals(goalsRes.data);

                // Fetch active learning path
                try {
                    const pathRes = await api.get('/learning-path');
                    setActivePath(pathRes.data);
                } catch (e) {
                    // No active path found, fine.
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSetGoal = async (goalId) => {
        setSettingGoal(true);
        try {
            await api.post('/user/goals', { goal_id: goalId });
            // Refresh path after setting goal
            const pathRes = await api.get('/learning-path');
            setActivePath(pathRes.data);
        } catch (error) {
            console.error("Failed to set goal", error);
        } finally {
            setSettingGoal(false);
        }
    };

    const chartData = {
        labels: ['Python', 'Data Science', 'Machine Learning', 'AI Ethics', 'Backend', 'Frontend'],
        datasets: [
            {
                label: 'Skill Mastery',
                data: [85, 65, 45, 90, 70, 40],
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 2,
                pointBackgroundColor: 'rgb(99, 102, 241)',
            },
        ],
    };

    const chartOptions = {
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                pointLabels: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 12 } },
                ticks: { display: false },
                suggestedMin: 0,
                suggestedMax: 100
            }
        },
        plugins: {
            legend: { display: false }
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading your personalized dashboard...</div>;

    if (showAssessment) {
        return (
            <div className="py-8">
                <button
                    onClick={() => setShowAssessment(false)}
                    className="mb-6 text-slate-400 hover:text-white flex items-center gap-2"
                >
                    &larr; Back to Dashboard
                </button>
                <Assessment difficulty={user.skill_level} onComplete={() => window.location.reload()} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Welcome Section */}
                <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-lg">
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back, {user.username}!</h1>
                    <p className="text-slate-400 mb-6">Current Skill Level: <span className="text-indigo-400 font-semibold">{user.skill_level}</span></p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activePath ? (
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                                <h3 className="text-lg font-semibold text-indigo-300">Current Focus</h3>
                                <p className="text-slate-300">{activePath.title}</p>
                                <Link to="/learning-path" className="inline-block mt-3 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Continue Learning &rarr;</Link>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-xl">
                                <p className="text-slate-400 text-sm">No active learning path. Select a goal below to get started!</p>
                            </div>
                        )}

                        <div className={`p-4 rounded-xl flex flex-col justify-between border ${activePath?.is_completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-700/50 border-slate-600 opacity-75'}`}>
                            <div>
                                <h3 className={`text-lg font-semibold ${activePath?.is_completed ? 'text-emerald-300' : 'text-slate-400'}`}>
                                    {activePath?.is_completed ? 'Skill Up' : 'Path in Progress'}
                                </h3>
                                <p className="text-slate-400 text-xs">
                                    {activePath?.is_completed
                                        ? 'Take an assessment to advance to the next level.'
                                        : 'Complete your current learning path to unlock assessment.'}
                                </p>
                            </div>
                            <button
                                onClick={() => activePath?.is_completed && setShowAssessment(true)}
                                disabled={!activePath?.is_completed}
                                className={`mt-3 text-sm font-bold transition-colors text-left flex items-center gap-2 ${activePath?.is_completed ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 cursor-not-allowed'}`}
                            >
                                {activePath?.is_completed ? 'Start Assessment →' : '🔒 Assessment Locked'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Progress Chart */}
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg flex flex-col items-center justify-center">
                    <h3 className="text-lg font-bold text-white mb-4">Skill Mastery</h3>
                    <div className="w-full h-64">
                        <Radar data={chartData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Goal Selection Section */}
            <div>
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-white">Select a Career Goal</h2>
                    <p className="text-slate-400 text-sm">Generate a new AI-powered learning path</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {goals.map((goal) => (
                        <div key={goal.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-indigo-500 transition-all hover:transform hover:scale-[1.02] cursor-pointer group" onClick={() => handleSetGoal(goal.id)}>
                            <div className="h-12 w-12 bg-slate-700 rounded-lg mb-4 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                                <span className="text-2xl">🎯</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300">{goal.name}</h3>
                            <p className="text-slate-400 text-sm">{goal.description}</p>
                            {settingGoal && <div className="mt-4 text-xs text-indigo-400 animate-pulse">Generating path...</div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

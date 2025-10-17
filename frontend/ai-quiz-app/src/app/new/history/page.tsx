"use client"
import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface AnalyticsData {
    totalQuizzes: number
    averageScore: number
    highestScore: number
    categoryProgress: Array<{
        category: string
        scores: number[]
        dates: string[]
    }>
    categoryDistribution: Array<{
        category: string
        count: number
        percentage: number
    }>
    quizHistory: Array<{
        id: string
        date: string
        category: string
        subcategory: string
        score: number
    }>
}

const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#84CC16', '#06B6D4', '#F97316']

function toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [animatedValues, setAnimatedValues] = useState({
        totalQuizzes: 0,
        averageScore: 0,
        highestScore: 0
    })
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

    useEffect(() => {
        fetchAnalytics()
    }, [])

    useEffect(() => {
        if (analytics && !loading) {
            animateNumbers()
        }
    }, [analytics, loading])

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) throw new Error('No token found')

            const decoded: any = JSON.parse(atob(token.split('.')[1]))
            const userId = decoded.id

            const response = await fetch('http://localhost:5000/quiz/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            })

            if (!response.ok) throw new Error('Failed to fetch')

            const data = await response.json()
            setAnalytics(data)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const animateNumbers = () => {
        if (!analytics) return

        const duration = 1000
        const steps = 60
        const stepDuration = duration / steps

        const increments = {
            totalQuizzes: analytics.totalQuizzes / steps,
            averageScore: analytics.averageScore / steps,
            highestScore: analytics.highestScore / steps
        }

        let currentStep = 0
        const timer = setInterval(() => {
            currentStep++
            setAnimatedValues({
                totalQuizzes: Math.min(Math.floor(increments.totalQuizzes * currentStep), analytics.totalQuizzes),
                averageScore: Math.min(increments.averageScore * currentStep, analytics.averageScore),
                highestScore: Math.min(increments.highestScore * currentStep, analytics.highestScore)
            })

            if (currentStep >= steps) {
                clearInterval(timer)
                setAnimatedValues({
                    totalQuizzes: analytics.totalQuizzes,
                    averageScore: analytics.averageScore,
                    highestScore: analytics.highestScore
                })
            }
        }, stepDuration)
    }

    const renderLineGraph = (scores: number[], color: string) => {
        if (scores.length === 0) return null

        const points = scores.map((score, i) => {
            const x = scores.length === 1 ? 50 : (i / (scores.length - 1)) * 100
            const y = 40 - (score / 100) * 40
            return `${x},${y}`
        }).join(' ')

        return (
            <>
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                {scores.map((score, i) => {
                    const x = scores.length === 1 ? 50 : (i / (scores.length - 1)) * 100
                    const y = 40 - (score / 100) * 40
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="2"
                            fill={color}
                        />
                    )
                })}
            </>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const pieData = analytics?.categoryDistribution.map((category, index) => ({
        name: toTitleCase(category.category),
        value: category.count,
        color: colors[index]
    })) || []

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="mb-8 pl-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                    <span className="text-gray-600">Total Quizzes</span>
                                    <span className="text-2xl font-bold text-blue-600">
                                        {animatedValues.totalQuizzes}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                    <span className="text-gray-600">Average Score</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        {animatedValues.averageScore.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                    <span className="text-gray-600">Highest Score</span>
                                    <span className="text-2xl font-bold text-purple-600">
                                        {animatedValues.highestScore.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
                            <div className="flex items-center justify-center">
                                {analytics?.categoryDistribution.length ? (
                                    <div className="w-full h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="60%"
                                                    outerRadius="90%"
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    animationBegin={0}
                                                    animationDuration={1000}
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.color}
                                                            stroke="#fff"
                                                            strokeWidth={2}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: number, name: string) => [`${value}`, name]}
                                                    contentStyle={{
                                                        backgroundColor: '#fff',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500">
                                        <div className="text-4xl mb-2">📊</div>
                                        <p>No category data</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz History</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 text-gray-600 font-medium">Date</th>
                                        <th className="text-left py-3 text-gray-600 font-medium">Category</th>
                                        <th className="text-left py-3 text-gray-600 font-medium">Subcategory</th>
                                        <th className="text-left py-3 text-gray-600 font-medium">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics?.quizHistory.map((quiz) => (
                                        <tr key={quiz.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 text-gray-600">{quiz.date}</td>
                                            <td className="py-3">
                                                <span className="font-medium text-gray-900">{toTitleCase(quiz.category)}</span>
                                            </td>
                                            <td className="py-3 text-gray-600">{toTitleCase(quiz.subcategory)}</td>
                                            <td className="py-3">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${quiz.score >= 80 ? 'bg-green-100 text-green-800' :
                                                    quiz.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {quiz.score}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!analytics?.quizHistory.length && (
                                <div className="text-center py-8 text-gray-500">
                                    No quiz history available
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Progress</h3>
                    <div className="space-y-4">
                        {analytics?.categoryProgress.map((category, index) => {
                            const isExpanded = expandedCategory === category.category
                            const maxScore = Math.max(...category.scores)
                            const minScore = Math.min(...category.scores)
                            const latestScore = category.scores[category.scores.length - 1]

                            return (
                                <div key={category.category}>
                                    <div
                                        className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                                        onMouseOver={() => setExpandedCategory(category.category)}
                                        onMouseOut={() => setExpandedCategory(null)}
                                        
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-900">{toTitleCase(category.category)}</span>
                                            <span className={`text-sm font-medium ${latestScore >= 80 ? 'text-green-600' :
                                                latestScore >= 60 ? 'text-yellow-600' :
                                                    'text-red-600'
                                                }`}>
                                                Latest :{latestScore}%
                                            </span>
                                        </div>

                                        {isExpanded && category.scores.length > 0 && (
                                            <div className="mt-4 animate-in fade-in duration-300">
                                                <div className="relative h-20 mb-2">
                                                    <svg viewBox="0 0 100 40" className="w-full h-full">
                                                        {renderLineGraph(category.scores, colors[index])}
                                                    </svg>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-500">
                                                    <span>Min: {minScore}%</span>
                                                    <span>Max: {maxScore}%</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        {!analytics?.categoryProgress.length && (
                            <div className="text-center py-8 text-gray-500">
                                No category data available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
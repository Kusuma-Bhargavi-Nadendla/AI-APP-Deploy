"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Question from "../../_components/QuizQuestion";
import { jwtDecode } from "jwt-decode";
import { Console } from "console";

interface QuizRecord {
    _id: string;
    question: string;
    questionId: string;
    options: string[];
    userAnswer: string;
    correctAnswer: string;
    score: number;
    explanation: string;
    questionType: string;
    questionNumber: number;
    sequenceNumber: number;
}

interface QuizData {
    quizId: string;
    records: QuizRecord[];
    totalScore: number;
    totalQuestions: number;
    categoryTitle: string;
    subcategoryTitle: string;
    completedAt: string;
}

export default function QuizPreviewPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [quizData, setQuizData] = useState<QuizData | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    let quizId: string;

    useEffect(() => {
        

        loadQuizData();
    }, []);

    const loadQuizData = async () => {
        try {
            setIsLoading(true);
            setError("");
            quizId = localStorage.getItem('quizId') ?? "";
        console.log("quizid",quizId);

              if (!quizId) {
                throw new Error("Quiz ID is required");
              }

            // Try to get from localStorage first
            const storedData = localStorage.getItem(`quiz_preview_${quizId}`);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                setQuizData(parsedData);
                setIsLoading(false);
                return;
            }
            const quizStoredData = localStorage.getItem(quizId??"");
            if (!quizStoredData) throw new Error("Quiz data missing");

            const temp= JSON.parse(quizStoredData);
            const originalQuizId=temp.quizId;

            // If not in localStorage, fetch from API
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Authentication required");
            }
            const decoded = jwtDecode<{ id: string }>(token??"");
            console.log("body:",decoded.id,originalQuizId)

            const response = await fetch(`http://localhost:5000/quiz/preview/${quizId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body:JSON.stringify({userId:decoded.id,quizId:originalQuizId})
            });

            if (!response.ok) {
                throw new Error('Failed to load quiz data');
            }

            const result = await response.json();
            const quizData: QuizData = {
                quizId: result.data.quizId || quizId,
                records: result.data.records || [],
                totalScore: result.data.totalScore || 0,
                totalQuestions: result.data.records?.length || 0,
                categoryTitle: result.data.categoryTitle || "Unknown Category",
                subcategoryTitle: result.data.subcategoryTitle || "Unknown Subcategory",
                completedAt: result.data.completedAt || new Date().toISOString()
            };

            // Store in localStorage for future visits
            localStorage.setItem(`quiz_preview_${quizId}`, JSON.stringify(quizData));
            setQuizData(quizData);

        } catch (error) {
            console.error('Error loading quiz data:', error);
            setError(error instanceof Error ? error.message : "Failed to load quiz preview");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextQuestion = () => {
        if (quizData && currentQuestionIndex < quizData.records.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleGoToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
    };

    const handleBackToResults = () => {
        router.push(`/quiz/results/${quizId}`);
    };

    const clearStoredData = () => {
        if (quizId) {
            localStorage.removeItem(`quiz_preview_${quizId}`);
        }
        loadQuizData(); // Reload fresh data
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-lg text-gray-700 font-medium">Loading quiz preview...</div>
                </div>
            </div>
        );
    }

    if (error || !quizData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center max-w-md mx-4">
                    <div className="text-red-500 text-xl mb-4">⚠️</div>
                    <div className="text-lg text-gray-800 font-medium mb-4">
                        {error || "Failed to load quiz data"}
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={loadQuizData}
                            className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="w-full px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentRecord = quizData.records[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Quiz Review</h1>
                            <p className="text-gray-600">
                                {quizData.categoryTitle} • {quizData.subcategoryTitle}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-semibold text-gray-800">
                                Score: {quizData.totalScore}/{quizData.totalQuestions * 10}
                            </div>
                            <div className="text-sm text-gray-500">
                                {new Date(quizData.completedAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Progress and Navigation */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handlePreviousQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Previous
                            </button>

                            <span className="text-lg font-medium text-gray-700">
                                Question {currentQuestionIndex + 1} of {quizData.records.length}
                            </span>

                            <button
                                onClick={handleNextQuestion}
                                disabled={currentQuestionIndex === quizData.records.length - 1}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                Next →
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={clearStoredData}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                                title="Reload fresh data"
                            >
                                Refresh
                            </button>
                            <button
                                onClick={handleBackToResults}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Back to Results
                            </button>
                        </div>
                    </div>

                    {/* Question Navigation Dots */}
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {quizData.records.map((record, index) => (
                            <button
                                key={record._id}
                                onClick={() => handleGoToQuestion(index)}
                                className={`w-3 h-3 rounded-full transition-all ${index === currentQuestionIndex
                                        ? 'bg-blue-600 scale-125'
                                        : record.score >= 8
                                            ? 'bg-green-500'
                                            : record.score >= 5
                                                ? 'bg-yellow-500'
                                                : 'bg-red-500'
                                    } hover:scale-150`}
                                title={`Question ${index + 1} - Score: ${record.score}/10`}
                            />
                        ))}
                    </div>
                </div>

                {/* Question Component */}
                <Question
                    questionText={currentRecord.question}
                    questionType={currentRecord.questionType as "multiple_choice" | "descriptive"}
                    options={currentRecord.options || []}
                    mode="preview"
                    currentQuestion={currentQuestionIndex + 1}
                    totalQuestions={quizData.records.length}
                    correctAnswer={currentRecord.correctAnswer}
                    userAnswer={currentRecord.userAnswer}
                    score={currentRecord.score}
                    explanation={currentRecord.explanation}
                    onNext={handleNextQuestion}
                />
            </div>
        </div>
    );
}
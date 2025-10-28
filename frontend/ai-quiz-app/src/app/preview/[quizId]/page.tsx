/* eslint-disable @typescript-eslint/no-explicit-any */


"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Question from "../../_components/QuizQuestion";
import { ChevronLeft, ChevronRight, BarChart3, Calendar, FileText, Award, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import type {QuizRecord,QuizPreviewData} from "../../../lib/types"
import { PreviewQuizLoader } from "../../_lib/PreviewLoader"
const API_URL = process.env.NEXT_PUBLIC_API_URL;
export default function QuizPreviewPage() {
  const params = useParams();
  const quizId = params.quizId as string;

  const [quizPreview, setQuizPreview] = useState<QuizPreviewData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showContent,setShowContent]=useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchQuizPreview = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not logged in");

        const userId =localStorage.getItem('userId');
        if(!userId) throw new Error("User ID Not found");

        const res = await fetch(`${API_URL}/quiz/preview/${quizId}`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: userId, quizId: quizId })
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch quiz preview");
        }

        const response = await res.json();
        if (response.success) {
          setQuizPreview(response.data);
        } else {
          throw new Error("Invalid response format");
        }

      } catch (err: any) {
        console.error("Fetch quiz preview error:", err);
        alert(`Failed to load quiz preview: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPromise = fetchQuizPreview();
    fetchQuizPreview();
    const timerPromise = new Promise(resolve => setTimeout(resolve, 3000));

    // Wait for both API call and minimum 3 seconds to complete
    Promise.all([fetchPromise, timerPromise]).finally(() => {
      setIsLoading(false);
      setShowContent(true);
    });
  }, [quizId]);

  const handleNextQuestion = () => {
    if (quizPreview && currentQuestionIndex < quizPreview.records.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading || !showContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          {/* <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <div className="text-slate-600 text-sm">Loading quiz preview...</div> */}
          <PreviewQuizLoader/>
        </div>
      </div>
    );
  }

  if (!quizPreview || !quizPreview.records.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-600 text-sm mb-3">No quiz data found.</div>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentRecord = quizPreview.records[currentQuestionIndex];
  const totalPossibleScore = quizPreview.records.length * 10;
  const scorePercentage = Math.round((quizPreview.totalScore / totalPossibleScore) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/history")}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to History
              </button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800">
                  {quizPreview.categoryTitle}
                </h1>
                <p className="text-slate-600 text-sm mt-1">
                  {quizPreview.subcategoryTitle} • {quizPreview.records.length} Questions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1">
              <Question
                questionText={currentRecord.question}
                questionType={currentRecord.questionType === "descriptive" ? "descriptive" : "multiple_choice"}
                options={currentRecord.options}
                mode="preview"
                currentQuestion={currentQuestionIndex + 1}
                totalQuestions={quizPreview.records.length}
                correctAnswer={currentRecord.correctAnswer}
                userAnswer={currentRecord.userAnswer}
                explanation={currentRecord.explanation}
                score={currentRecord.score}
                onNext={handleNextQuestion}
              />
            </div>
          </div>

          <div className="lg:w-80 space-y-4">

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-600" />
                Quiz Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Questions:</span>
                  <span className="font-medium text-slate-800">{quizPreview.records.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Score:</span>
                  <span className="font-medium text-slate-800">{quizPreview.totalScore}/{totalPossibleScore}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Performance:</span>
                  <span className={`font-medium ${scorePercentage >= 80 ? 'text-green-600' :
                    scorePercentage >= 60 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                    {scorePercentage}%
                  </span>
                </div>
                {quizPreview.startedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Started:</span>
                    <span className="font-medium text-slate-800 text-xs">{formatDate(quizPreview.startedAt)}</span>
                  </div>
                )}
                {quizPreview.completedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Completed:</span>
                    <span className="font-medium text-slate-800 text-xs">{formatDate(quizPreview.completedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-600" />
                Questions Navigation
              </h3>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {quizPreview.records.map((record, index) => (
                  <button
                    key={record._id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${index === currentQuestionIndex
                      ? "bg-blue-500 text-white shadow-sm"
                      : record.score >= 8
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : record.score >= 5
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                      }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === quizPreview.records.length - 1}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Progress</span>
                  <span>{currentQuestionIndex + 1} of {quizPreview.records.length}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / quizPreview.records.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
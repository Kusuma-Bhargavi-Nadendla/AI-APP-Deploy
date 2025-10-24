"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { Share2, Home, RotateCcw, Award, Clock, Target, BarChart3, Sparkles } from "lucide-react";

interface QuizResult {
  quizId: string;
  finalScore: number;
  completedAt: string;
  subcategoryTitle: string;
  totalQuestions: number;
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const router = useRouter();
  const [result, setResult] = useState<QuizResult>();
  const [loading, setLoading] = useState(true);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const data = localStorage.getItem(quizId);
    if (data) {
      const resultData = JSON.parse(data);
      setResult(resultData);
      
      const totalScore = resultData.totalQuestions * 10;
      const targetPercent = Math.round((resultData.finalScore / totalScore) * 100);
      
      let currentScore = 0;
      let currentPercent = 0;
      const duration = 1500;
      const steps = 60;
      const incrementScore = resultData.finalScore / steps;
      const incrementPercent = targetPercent / steps;
      
      const timer = setInterval(() => {
        currentScore += incrementScore;
        currentPercent += incrementPercent;
        
        if (currentScore >= resultData.finalScore) {
          currentScore = resultData.finalScore;
          currentPercent = targetPercent;
          clearInterval(timer);
        }
        
        setAnimatedScore(Math.floor(currentScore));
        setAnimatedPercent(Math.floor(currentPercent));
      }, duration / steps);
      
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    if (!result) return;

    const duration = 2000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const frame = () => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return;

      const particleCount = 35 * (timeLeft / duration);
      
      confetti({
        particleCount,
        startVelocity: 25,
        spread: 300,
        ticks: 150,
        origin: { 
          x: randomInRange(0.1, 0.9), 
          y: Math.random() - 0.2 
        },
        colors: ['#a78bfa', '#f472b6', '#60a5fa', '#34d399']
      });

      requestAnimationFrame(frame);
    };

    frame();

    setTimeout(() => confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } }), 300);
    setTimeout(() => confetti({ particleCount: 35, spread: 80, origin: { x: 0.2, y: 0.6 } }), 800);
  }, [result]);

  const goToHome = () => router.push("/home");
  const goToHistory = () => router.push("/history");
  const retryQuiz = () => router.push(`/quiz/${quizId}/start`);

  const TotalScore = result ? result.totalQuestions * 10 : 0;

  const getPerformanceData = () => {
    const percent = Math.round((result?.finalScore || 0) / TotalScore * 100);
    if (percent >= 90) {
      return { 
        emoji: "🎯", 
        message: "Outstanding!", 
        color: "from-emerald-400 to-teal-400",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700"
      };
    } else if (percent >= 70) {
      return { 
        emoji: "🌟", 
        message: "Excellent work!", 
        color: "from-blue-400 to-cyan-400",
        bgColor: "bg-blue-50",
        textColor: "text-blue-700"
      };
    } else if (percent >= 50) {
      return { 
        emoji: "👍", 
        message: "Good job!", 
        color: "from-amber-400 to-yellow-400",
        bgColor: "bg-amber-50",
        textColor: "text-amber-700"
      };
    } else {
      return { 
        emoji: "💪", 
        message: "Keep practicing!", 
        color: "from-rose-400 to-pink-400",
        bgColor: "bg-rose-50",
        textColor: "text-rose-700"
      };
    }
  };

  const performance = getPerformanceData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent"></div>
          <p className="mt-3 text-slate-600 text-sm">Loading your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800 p-4">
      <div className="fixed inset-0 pointer-events-none z-40" id="confetti-container" />
      
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-2 mb-3 shadow-sm">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-700">Quiz Completed</span>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-1">
            Amazing Work!
          </h1>
          <p className="text-slate-600 text-sm">Here's how you performed</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-sm mb-5">
          <div className={`${performance.bgColor} rounded-xl p-3 text-center mb-5 border ${performance.textColor} border-opacity-20`}>
            <div className="text-3xl mb-1">{performance.emoji}</div>
            <p className="text-sm font-medium">{performance.message}</p>
          </div>

          <div className="text-center mb-5">
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full border border-slate-200">
              {result?.subcategoryTitle}
            </span>
          </div>

          <div className="flex items-center justify-between mb-5 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-center flex-1">
              <div className="text-xl font-bold text-slate-800">{animatedScore}</div>
              <div className="text-xs text-slate-500 mt-1">Your Score</div>
            </div>
            <div className="h-6 w-px bg-slate-300"></div>
            <div className="text-center flex-1">
              <div className="text-xl font-bold text-slate-800">{TotalScore}</div>
              <div className="text-xs text-slate-500 mt-1">Total Points</div>
            </div>
            <div className="h-6 w-px bg-slate-300"></div>
            <div className="text-center flex-1">
              <div className="text-xl font-bold text-slate-800">{animatedPercent}%</div>
              <div className="text-xs text-slate-500 mt-1">Percentage</div>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex justify-between text-xs text-slate-600 mb-2">
              <span>Performance</span>
              <span>{animatedPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full bg-gradient-to-r ${performance.color} transition-all duration-300`}
                style={{ width: `${animatedPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-200">
              <Target className="h-4 w-4 text-slate-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-slate-800">{result?.totalQuestions}</div>
              <div className="text-xs text-slate-500">Questions</div>
            </div>
            <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-200">
              <Award className="h-4 w-4 text-slate-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-slate-800">{animatedPercent}%</div>
              <div className="text-xs text-slate-500">Accuracy</div>
            </div>
            <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-200">
              <BarChart3 className="h-4 w-4 text-slate-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-slate-800">
                {animatedScore}/{TotalScore}
              </div>
              <div className="text-xs text-slate-500">Score</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={goToHistory}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition border border-slate-300 text-sm"
            >
              <Clock className="h-4 w-4" />
              History
            </button>
            <button
              onClick={goToHome}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium rounded-xl transition shadow-sm text-sm"
            >
              <Home className="h-4 w-4" />
              Home
            </button>
          </div>
        </div>

        
      </div>
    </div>
  );
}
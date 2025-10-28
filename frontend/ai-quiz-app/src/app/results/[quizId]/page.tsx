/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { Share2, Home, RotateCcw, Award, Clock, Target, BarChart3, Sparkles, Eye , TrendingUp, Zap, Brain} from "lucide-react";
import { appDB } from "../../../lib/appDataDB";
import type {SessionData,TimeSettings} from "../../../lib/types"


export default function ResultsPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const router = useRouter();
  const [result, setResult] = useState<SessionData>();
  const [loading, setLoading] = useState(true);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [typedFeedback, setTypedFeedback] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
          const sessionLoadedData = await appDB.getSession(sessionId);
          console.log("loaded from indexdb", sessionLoadedData, sessionLoadedData?.userId);

          if (!sessionLoadedData) {
            throw new Error("Session Not found.")
          }
          const resultData: SessionData = sessionLoadedData;
          setResult(resultData);

          const userScore = resultData.score || 0;

          const totalScore = resultData.questionsCount * 10;
          const targetPercent = Math.round((userScore / totalScore) * 100);

          let currentScore = 0;
          let currentPercent = 0;
          const duration = 1500;
          const steps = 60;
          const incrementScore = userScore / steps;
          const incrementPercent = targetPercent / steps;

          const timer = setInterval(() => {
            currentScore += incrementScore;
            currentPercent += incrementPercent;

            if (currentScore >= userScore) {
              currentScore = userScore;
              currentPercent = targetPercent;
              clearInterval(timer);
            }

            setAnimatedScore(Math.floor(currentScore));
            setAnimatedPercent(Math.floor(currentPercent));
          }, duration / steps);

          setLoading(false);
        } else {
          throw new Error("Session not found.")
        }
      } catch (error: any) {
        console.log("error:", error.message);
        router.replace("/history");
      }
    }
    fetchResults();
  }, [quizId]);

 useEffect(() => {
   if (!result) return;

   confetti({
     particleCount: 500,
     spread: 80,
     origin: { y: 0.3, x: 0.3 },
     colors: ["#a78bfa", "#60a5fa"],
     ticks: 200,
     startVelocity: 70,
     gravity: 2.0,
     decay: 0.92,
   });

   confetti({
     particleCount: 500,
     spread: 80,
     origin: { y: 0.3, x: 0.7 },
     ticks: 200,
     startVelocity: 70,
     gravity: 2.0,
     decay: 0.92,
     colors: ["#60a5fa", "#34d399"],
   });
 }, [result]);

//  useEffect(() => {
//   if (!result) return;

//   // Remove the continuous frame animation and keep only these 2 blasts:
  
//   // First main blast
//   confetti({
//     particleCount: 100,
//     spread: 70,
//     origin: { y: 0.6 },
//     colors: ['#a78bfa', '#60a5fa', '#34d399'],
//   });

//   // Second main blast  
//   setTimeout(() => {
//     confetti({
//       particleCount: 80, 
//       spread: 60,
//       origin: { y: 0.7 },
//       colors: ['#f472b6', '#fbbf24'],
//     });
//   }, 400);

// }, [result]);
  
// useEffect(() => {
//   if (!result) return;

//   // First blast - top left of result div (30% from left, 100px from top)
//   confetti({
//     particleCount: 200,
//     angle: 85,
//     spread: 80,
//     origin: { x: 0.3, y: 0.1 }, // 30% from left, 100px from top (approx)
//     startVelocity: 55,
//     colors: ['#a78bfa', '#f472b6', '#60a5fa'],
//     gravity: 0.8,
//     scalar: 1.3,
//     drift: 0
//   });

//   // Second blast - top right of result div (70% from left, 100px from top)
//   setTimeout(() => {
//     confetti({
//       particleCount: 200,
//       angle: 95,
//       spread: 80,
//       origin: { x: 0.7, y: 0.1 }, // 70% from left, 100px from top
//       startVelocity: 55,
//       colors: ['#34d399', '#fbbf24', '#60a5fa'],
//       gravity: 0.8,
//       scalar: 1.3,
//       drift: 0
//     });
//   }, 400);

// }, [result]);
useEffect(() => {
    if (!showFeedback || !result?.performanceFeedback) return;

    setIsTyping(true);
    setTypedFeedback("");

    const feedback = result.performanceFeedback;
    let i = 0;

    const typingInterval = setInterval(() => {
      if (i < feedback.length) {
        setTypedFeedback(feedback.substring(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, [showFeedback, result?.performanceFeedback]);

  const goToHome = () => router.push("/home");
  const goToHistory = () => router.push("/history");
  const goToPreview = () => {
    router.replace(`/preview/${quizId}`);
  };
  const generateFeedback = () => {
    setShowFeedback(true);
  };

  const TotalScore = result ? result.questionsCount * 10 : 0;

  const getPerformanceData = () => {
    const percent = Math.round((result?.score || 0) / TotalScore * 100);
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

  // return (
  //   <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800 p-4">
  //     <div className="fixed inset-0 pointer-events-none z-40" id="confetti-container" />

  //     <div className="max-w-md mx-auto">
  //       <div className="text-center mb-6">
  //         <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-2 mb-3 shadow-sm">
  //           <Sparkles className="h-4 w-4 text-amber-500" />
  //           <span className="text-sm font-medium text-slate-700">Quiz Completed</span>
  //         </div>
  //         <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-1">
  //           Amazing Work!
  //         </h1>
  //         <p className="text-slate-600 text-sm">Here's how you performed</p>
  //       </div>

  //       <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-sm mb-5">
  //         <div className={`${performance.bgColor} rounded-xl p-3 text-center mb-5 border ${performance.textColor} border-opacity-20`}>
  //           <div className="text-3xl mb-1">{performance.emoji}</div>
  //           <p className="text-sm font-medium">{performance.message}</p>
  //         </div>

  //         <div className="text-center mb-5">
  //           <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full border border-slate-200">
  //             {result?.subcategory}
  //           </span>
  //         </div>

  //         <div className="flex items-center justify-between mb-5 p-3 bg-slate-50 rounded-xl border border-slate-200">
  //           <div className="text-center flex-1">
  //             <div className="text-xl font-bold text-slate-800">{animatedScore}</div>
  //             <div className="text-xs text-slate-500 mt-1">Your Score</div>
  //           </div>
  //           <div className="h-6 w-px bg-slate-300"></div>
  //           <div className="text-center flex-1">
  //             <div className="text-xl font-bold text-slate-800">{TotalScore}</div>
  //             <div className="text-xs text-slate-500 mt-1">Total Points</div>
  //           </div>
  //           <div className="h-6 w-px bg-slate-300"></div>
  //           <div className="text-center flex-1">
  //             <div className="text-xl font-bold text-slate-800">{animatedPercent}%</div>
  //             <div className="text-xs text-slate-500 mt-1">Percentage</div>
  //           </div>
  //         </div>

  //         <div className="mb-5">
  //           <div className="flex justify-between text-xs text-slate-600 mb-2">
  //             <span>Performance</span>
  //             <span>{animatedPercent}%</span>
  //           </div>
  //           <div className="w-full bg-slate-200 rounded-full h-1.5">
  //             <div
  //               className={`h-1.5 rounded-full bg-gradient-to-r ${performance.color} transition-all duration-300`}
  //               style={{ width: `${animatedPercent}%` }}
  //             />
  //           </div>
  //         </div>

  //         <div className="grid grid-cols-3 gap-2 mb-5">
  //           <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-200">
  //             <Target className="h-4 w-4 text-slate-600 mx-auto mb-1" />
  //             <div className="text-sm font-semibold text-slate-800">{result?.questionsCount}</div>
  //             <div className="text-xs text-slate-500">Questions</div>
  //           </div>
  //           <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-200">
  //             <Award className="h-4 w-4 text-slate-600 mx-auto mb-1" />
  //             <div className="text-sm font-semibold text-slate-800">{animatedPercent}%</div>
  //             <div className="text-xs text-slate-500">Accuracy</div>
  //           </div>
  //           <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-200">
  //             <BarChart3 className="h-4 w-4 text-slate-600 mx-auto mb-1" />
  //             <div className="text-sm font-semibold text-slate-800">
  //               {animatedScore}/{TotalScore}
  //             </div>
  //             <div className="text-xs text-slate-500">Score</div>
  //           </div>
  //         </div>
  //       </div>

  //       {/* Add this right after your 3-column stats grid */}
  //       <div className="mb-5">
  //         <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-xl p-4">
  //           <div className="flex items-start gap-3">
  //             <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
  //               <Sparkles className="w-3 h-3 text-blue-600" />
  //             </div>
  //             <div>
  //               <h4 className="text-sm font-semibold text-slate-800 mb-1">AI Feedback</h4>
  //               <p className="text-sm text-slate-700 leading-relaxed">
  //                 {result?.performanceFeedback}
  //               </p>
  //             </div>
  //           </div>
  //         </div>
  //       </div>

  //       <div className="space-y-2">

  //         <div className="grid grid-cols-2 gap-2">
  //           <button
  //             onClick={goToHistory}
  //             className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition border border-slate-300 text-sm"
  //           >
  //             <Clock className="h-4 w-4" />
  //             History
  //           </button>
  //           <button
  //             onClick={goToHome}
  //             className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium rounded-xl transition shadow-sm text-sm"
  //           >
  //             <Home className="h-4 w-4" />
  //             Home
  //           </button>
  //         </div>
  //       </div>


  //     </div>
  //   </div>
  // );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800 p-4">
      <div className="fixed inset-0 pointer-events-none z-40" id="confetti-container" />

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-2 mb-3 shadow-sm">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-700">Quiz Completed</span>
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-2">
            Amazing Work!
          </h1>
          <p className="text-slate-600 text-sm">Here&apos;s how you performed</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 shadow-sm mb-6">
          <div className={`${performance.bgColor} rounded-xl p-4 text-center mb-6 border ${performance.textColor} border-opacity-20`}>
            <div className="text-3xl mb-2">{performance.emoji}</div>
            <p className="text-sm font-medium">{performance.message}</p>
          </div>

          <div className="text-center mb-6">
            <span className="inline-block px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-full border border-slate-200">
              {result?.subcategory}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
              <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-slate-800">{result?.questionsCount}</div>
              <div className="text-xs text-slate-600 font-medium">Questions</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 shadow-sm">
              <Award className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-slate-800">{TotalScore}</div>
              <div className="text-xs text-slate-600 font-medium">Total Score</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 shadow-sm">
              <BarChart3 className="h-6 w-6 text-amber-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-slate-800">{animatedScore}</div>
              <div className="text-xs text-slate-600 font-medium">Your Score</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl border border-violet-200 shadow-sm">
              <TrendingUp className="h-6 w-6 text-violet-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-slate-800">{animatedPercent}%</div>
              <div className="text-xs text-slate-600 font-medium">Accuracy</div>
            </div>
          </div>

          {/* <div className="mb-6">
            <div className="flex justify-between text-sm text-slate-700 mb-3 font-medium">
              <span>Performance Progress</span>
              <span>{animatedPercent}%</span>
            </div>
            <div className="w-full bg-slate-300 rounded-full h-3 shadow-inner">
              <div
                className={`h-3 rounded-full bg-gradient-to-r ${performance.color} transition-all duration-500 shadow-md`}
                style={{ width: `${animatedPercent}%` }}
              />
            </div>
          </div> */}

          <div className="mb-6">
            <div className={`p-4 rounded-xl border transition-all duration-300 ${showFeedback
                ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm"
                : "bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200 hover:border-blue-300 cursor-pointer"
              }`}
              onClick={!showFeedback ? generateFeedback : undefined}
            >
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${showFeedback
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  }`}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1 min-h-[60px] flex items-center">
                  {!showFeedback ? (
                    <div>
                      <p className="text-sm font-medium text-slate-800">Get AI Performance Feedback</p>
                      <p className="text-xs text-slate-600 mt-1">Click to generate personalized insights about your performance</p>
                    </div>
                  ) : (
                    <div className="w-full">
                      <p className="text-sm font-medium text-slate-800 mb-2">AI Feedback</p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {typedFeedback}
                        {isTyping && (
                          <span className="inline-block w-2 h-4 bg-green-500 ml-1 animate-pulse"></span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={goToHistory}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all border border-slate-200 text-sm shadow-sm hover:shadow-md"
            >
              <Clock className="h-4 w-4" />
              History
            </button>
            <button
              onClick={goToPreview}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-700 font-medium rounded-xl transition-all border border-blue-200 text-sm shadow-sm hover:shadow-md"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              onClick={goToHome}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-100 to-emerald-200 hover:from-emerald-200 hover:to-emerald-300 text-emerald-700 font-medium rounded-xl transition-all border border-emerald-200 text-sm shadow-sm hover:shadow-md"
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
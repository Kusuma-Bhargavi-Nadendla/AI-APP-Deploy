"use client";
 
import { useState, useRef, useEffect, use } from "react";
import Webcam from "react-webcam";
import useSpeechToText, { ResultType } from "react-hook-speech-to-text";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
 
// interface QuizLandingData {
//   categoryTitle: string;
//   subcategoryTitle: string;
// }

interface QuizLandingData {
  categoryTitle: string;
  subcategoryTitle: string;
  description: string;
  questionsCount: number;
  timeLimit: TimeSettings;
}

interface TimeSettings {
  totalEnabled: boolean;
  totalMinutes?: number;
  perQuestionEnabled: boolean;
  perQuestionSeconds?: number;
}
interface AIQuestion {
  questionText: string;
  options: string[];
  questionType: "options" | "descriptive";
  difficultyLevel: number;
}
 
interface QuizSessionData {
  quizId: string;
  userId: string;
  categoryTitle: string;
  subcategoryTitle: string;
  totalQuestions: number;
  categoryId?:string;
}
 
export default function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const router = useRouter();
 
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(
    null
  );
  const [userAnswer, setUserAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [progress, setProgress] = useState({ current: 1, total: 3 });
  const [quizSession, setQuizSession] = useState<QuizSessionData | null>(null);
 
  const hasStartedQuiz = useRef(false);
 
  const {
    error,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });
 
  const webcamRef = useRef<Webcam>(null);
 
  useEffect(() => {
    if (!results?.length) return;
    let transcript = "";
    if (typeof results[0] !== "string" && "transcript" in results[0]) {
      const speechResults = results as ResultType[];
      transcript = speechResults[speechResults.length - 1]?.transcript || "";
    } else {
      const stringResults = results as string[];
      transcript = stringResults[stringResults.length - 1] || "";
    }
    setUserAnswer(transcript);
  }, [results]);
 
  useEffect(() => {
    if (hasStartedQuiz.current) return;
 
    const startQuiz = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not logged in");
 
        const decoded: { id: string } = jwtDecode(token);
        const storedData = localStorage.getItem(quizId);
        if (!storedData) throw new Error("Quiz data missing");
 
        const quizData: QuizLandingData = JSON.parse(storedData);
        hasStartedQuiz.current = true;
 
        const res = await fetch("http://localhost:5000/quiz/start", {
          method: "POST",
           headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          body: JSON.stringify({
            userId: decoded.id,
            categoryId:quizData.categoryId,
            categoryTitle: quizData.categoryTitle,
            subcategoryTitle: quizData.subcategoryTitle,
            questionsCount: 3,
          }),
        });
 
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to start quiz");
        }
 
        const response = await res.json();
        if(!response.success){
          throw new Error("Invalid quiz start response");
        }
        const data=response.data;
        setCurrentQuestion(data.question);
        setQuizSession({
          quizId: data.quizId,
          userId: decoded.id,
          categoryId:quizData.categoryId,
          categoryTitle: quizData.categoryTitle,
          subcategoryTitle: quizData.subcategoryTitle,
          totalQuestions: 3,
        });
        setProgress({ current: 1, total: 3 });
      } catch (err: any) {
        console.error("Start quiz error:", err);
        alert(`Failed to start quiz: ${err.message}`);
        router.push("/categories");
      } finally {
        setIsLoading(false);
      }
    };
 
    startQuiz();
  }, [quizId, router]);
 
  const handleNext = async () => {
    if (!userAnswer.trim() || !currentQuestion || !quizSession) {
      alert("Please provide an answer.");
      return;
    }
 
    setIsLoading(true);
    try {
      const payload = {
        quizData: {
          quizId: quizSession.quizId,
          userId: quizSession.userId,
          categoryId:quizSession.categoryId,
          categoryTitle: quizSession.categoryTitle,
          subcategoryTitle: quizSession.subcategoryTitle,
        },
        currentQuestion,
        userAnswer,
        progress,
      };
      console.log(payload);
      const token = localStorage.getItem('token');
      const res = await fetch("http://localhost:5000/quiz/submit-answer", {
        method: "POST",
        headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
        body: JSON.stringify(payload),
      });
 
      const response = await res.json();
 
      if (!res.ok) {
        throw new Error(response.error || "Submission failed");
      }

      console.log(response);
      const result=response.data;
      //  Quiz completed
      if (result.quizCompleted) {
        localStorage.setItem(
          quizSession.quizId,
          JSON.stringify({ ...quizSession, finalScore: result.finalScore })
        );
        router.push(`/results/${quizSession.quizId}`);
        return;
      } else {
        // Load next question
        setCurrentQuestion(result.nextQuestion);
        setProgress(result.progress);
        setUserAnswer("");
        setResults([]);
        setRecordingComplete(false);
      }
    } catch (err: any) {
      console.error("Submit answer error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleOptionSelect = (option: string) => {
    setUserAnswer(option);
    setRecordingComplete(true);
    if (isRecording) stopSpeechToText();
  };
 
  const toggleRecording = () => {
    if (isRecording) {
      stopSpeechToText();
      setRecordingComplete(true);
    } else {
      setResults([]);
      setUserAnswer("");
      setRecordingComplete(false);
      startSpeechToText();
    }
  };
 
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black text-white overflow-auto">
      <div className="absolute inset-0 flex flex-col md:flex-row">
        {/* Left Panel */}
        <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col bg-gray-900/80 backdrop-blur-sm">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              <span className="text-indigo-300 font-mono">
                AI QUIZ • QUESTION {progress.current} / {progress.total}
              </span>
            </div>
 
            {isLoading ? (
              <div className="space-y-5">
                <div className="h-8 bg-gray-700/50 rounded w-4/5 animate-pulse"></div>
                <div className="h-6 bg-gray-700/30 rounded w-3/4 animate-pulse"></div>
              </div>
            ) : currentQuestion ? (
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                {currentQuestion.questionText}
              </h1>
            ) : (
              <p className="text-gray-400">No question loaded.</p>
            )}
          </div>
 
          {/* Options */}
          {currentQuestion?.options &&
            currentQuestion?.options?.length > 0 &&
            !isLoading && (
              <div className="mb-8 space-y-4 flex-1">
                {currentQuestion?.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(option)}
                    className={`p-5 w-full text-left rounded-xl border transition-all ${
                      userAnswer === option
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-gray-700 hover:border-indigo-400 hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full border border-indigo-400 flex items-center justify-center mr-4">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-lg">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
 
          {/* Controls */}
          <div className="mt-auto pt-6 border-t border-gray-800">
            {userAnswer && (
              <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <p className="text-gray-300 italic">{userAnswer}</p>
              </div>
            )}
 
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={toggleRecording}
                disabled={isLoading}
                className={`flex-1 flex items-center justify-center py-4 px-6 rounded-xl font-medium ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-indigo-600 hover:bg-indigo-700"
                } disabled:opacity-50`}
              >
                {isRecording ? (
                  <>
                    <span className="w-3 h-3 bg-white rounded-full mr-3 animate-pulse"></span>
                    Stop Listening
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                    {recordingComplete ? "Re-record" : "Speak Answer"}
                  </>
                )}
              </button>
 
              <button
                onClick={handleNext}
                disabled={!userAnswer.trim() || isLoading}
                className="flex items-center justify-center py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 font-medium rounded-xl disabled:opacity-50"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : progress.current === progress.total ? (
                  "Finish Quiz"
                ) : (
                  "Next Question →"
                )}
              </button>
            </div>
 
            {error && (
              <p className="mt-4 text-red-400 text-sm">
                🎤 Mic error: {error || "Enable microphone permissions"}
              </p>
            )}
          </div>
        </div>
 
        {/* Webcam */}
        <div className="w-full md:w-2/5 relative bg-black">
          <Webcam
            audio={false}
            mirrored
            ref={webcamRef}
            className="w-full h-full object-cover"
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 1280,
              height: 720,
              facingMode: "user",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full mb-2 ${
                isRecording ? "bg-red-500 animate-pulse" : "bg-green-500"
              }`}
            ></div>
            <div className="text-center px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full">
              {isRecording ? (
                <span className="text-red-400 font-medium">LISTENING...</span>
              ) : (
                <span className="text-gray-300">Camera Active</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




// "use client";
// import { useState, useRef, useEffect, use } from "react";
// import Webcam from "react-webcam";
// import { useRouter } from "next/navigation";
// import { jwtDecode } from "jwt-decode";
// import Question from "../../../_components/QuizQuestion"; 
// import { Camera, BookOpen } from "lucide-react";

// interface QuizLandingData {
//   categoryTitle: string;
//   subcategoryTitle: string;
// }

// interface AIQuestion {
//   questionText: string;
//   options: string[];
//   questionType: "options" | "descriptive";
//   difficultyLevel: number;
// }

// interface QuizSessionData {
//   quizId: string;
//   userId: string;
//   categoryTitle: string;
//   subcategoryTitle: string;
//   totalQuestions: number;
// }

// export default function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
//   const { quizId } = use(params);
//   const router = useRouter();

//   const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null);
//   const [userAnswer, setUserAnswer] = useState("");
//   const [isLoading, setIsLoading] = useState(true);
//   const [progress, setProgress] = useState({ current: 1, total: 3 });
//   const [quizSession, setQuizSession] = useState<QuizSessionData | null>(null);

//   const hasStartedQuiz = useRef(false);
//   const webcamRef = useRef<Webcam>(null);

//   // Start quiz
//   useEffect(() => {
//     if (hasStartedQuiz.current) return;

//     const startQuiz = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) throw new Error("Not logged in");

//         const decoded: { id: string } = jwtDecode(token);
//         const storedData = localStorage.getItem(quizId);
//         if (!storedData) throw new Error("Quiz data missing");

//         const quizData: QuizLandingData = JSON.parse(storedData);
//         hasStartedQuiz.current = true;

//         const res = await fetch("http://localhost:5000/quiz/start", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             userId: decoded.id,
//             categoryTitle: quizData.categoryTitle,
//             subcategoryTitle: quizData.subcategoryTitle,
//             questionsCount: 3,
//           }),
//         });

//         if (!res.ok) throw new Error("Failed to start quiz");

//         const data = await res.json();
//         setCurrentQuestion(data.question);
//         setQuizSession({
//           quizId: data.quizId,
//           userId: decoded.id,
//           ...quizData,
//           totalQuestions: 3,
//         });
//         setProgress({ current: 1, total: 3 });
//       } catch (err: any) {
//         alert(`Failed to start quiz: ${err.message}`);
//         router.push("/categories");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     startQuiz();
//   }, [quizId, router]);

//   const handleAnswer = (answer: string) => {
//     setUserAnswer(answer);
//   };

//   const handleNext = async () => {
//     if (!userAnswer.trim() || !currentQuestion || !quizSession) {
//       alert("Please provide an answer.");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const payload = {
//         quizData: {
//           quizId: quizSession.quizId,
//           userId: quizSession.userId,
//           categoryTitle: quizSession.categoryTitle,
//           subcategoryTitle: quizSession.subcategoryTitle,
//         },
//         currentQuestion,
//         userAnswer,
//         progress,
//       };

//       const res = await fetch("http://localhost:5000/quiz/submit-answer", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const result = await res.json();

//       if (!res.ok) throw new Error(result.error || "Submission failed");

//       if (result.quizCompleted) {
//         router.push(`/results/${quizSession.quizId}`);
//         return;
//       } else {
//         setCurrentQuestion(result.nextQuestion);
//         setProgress(result.progress);
//         setUserAnswer("");
//       }
//     } catch (err: any) {
//       alert(`Error: ${err.message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSaveAndExit = async () => {
//     if (quizSession && currentQuestion) {
//       const progressData = {
//         quizId: quizSession.quizId,
//         currentQuestion,
//         progress,
//         userAnswer
//       };
//       localStorage.setItem(`quiz_${quizSession.quizId}_progress`, JSON.stringify(progressData));
//     }
//     router.push('/history');
//   };

//   if (isLoading && !currentQuestion) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-600">Starting your quiz...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="container mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">
//               {quizSession?.categoryTitle} • {quizSession?.subcategoryTitle}
//             </h1>
//             <p className="text-gray-600 mt-1">AI-Powered Quiz</p>
//           </div>
          
//           <button
//             onClick={handleSaveAndExit}
//             className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
//           >
//             <BookOpen className="w-4 h-4" />
//             Save & Exit
//           </button>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Main Content - Question */}
//           <div className="lg:col-span-2">
//             {/* Progress Bar */}
//             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
//               <div className="flex items-center justify-between mb-3">
//                 <span className="text-gray-600 font-medium">
//                   Question {progress.current} of {progress.total}
//                 </span>
//                 <span className="text-blue-600 font-semibold">
//                   {Math.round((progress.current / progress.total) * 100)}%
//                 </span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2">
//                 <div 
//                   className="bg-blue-600 h-2 rounded-full transition-all duration-500"
//                   style={{ width: `${(progress.current / progress.total) * 100}%` }}
//                 />
//               </div>
//             </div>

//             {/* Question Component */}
//             {currentQuestion && (
//               <Question
//                 questionText={currentQuestion.questionText}
//                 type={currentQuestion.questionType === "options" ? "multiple-choice" : "descriptive"}
//                 options={currentQuestion.options || []}
//                 mode="answering"
//                 onAnswer={handleAnswer}
//                 onNext={handleNext}
//               />
//             )}
//           </div>

//           {/* Webcam Sidebar */}
//           <div className="lg:col-span-1">
//             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
//               <div className="flex items-center gap-3 mb-4">
//                 <Camera className="w-5 h-5 text-blue-600" />
//                 <h3 className="font-semibold text-gray-900">Live Proctoring</h3>
//               </div>
              
//               <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-[4/3] border-2 border-gray-300">
//                 <Webcam
//                   audio={false}
//                   mirrored
//                   ref={webcamRef}
//                   className="w-full h-full object-cover"
//                   screenshotFormat="image/jpeg"
//                   videoConstraints={{
//                     width: 1280,
//                     height: 720,
//                     facingMode: "user",
//                   }}
//                 />
//                 <div className="absolute bottom-3 left-3 right-3">
//                   <div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
//                         <span className="text-white text-sm">ACTIVE</span>
//                       </div>
//                       <span className="text-gray-300 text-xs">AI Monitoring</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Quiz Info */}
//               <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
//                 <h4 className="font-semibold text-blue-900 mb-2">Quiz Information</h4>
//                 <div className="space-y-2 text-sm text-blue-800">
//                   <div className="flex justify-between">
//                     <span>Questions:</span>
//                     <span>{progress.current}/{progress.total}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Type:</span>
//                     <span className="capitalize">{currentQuestion?.questionType}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Difficulty:</span>
//                     <span>
//                       {currentQuestion?.difficultyLevel === 1 ? "Easy" : 
//                        currentQuestion?.difficultyLevel === 2 ? "Medium" : "Hard"}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }








// "use client";
// import { useState } from "react";
// import QuizQuestion from "../../../_components/QuizQuestion";

// export default function QuizTestPage() {
//   const [currentTest, setCurrentTest] = useState(0);
//   const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});

//   // Test cases covering all scenarios
//   const testCases = [
//     // Multiple Choice - Answering Mode
//     {
//       title: "Multiple Choice - Answering Mode",
//       questionText: "What is the capital of France?",
//       type: "multiple-choice" as const,
//       options: ["London", "Paris", "Berlin", "Madrid"],
//       mode: "answering" as const,
//       correctAnswer: "Paris"
//     },
//     // Multiple Choice - Preview Mode (Correct)
//     {
//       title: "Multiple Choice - Preview Mode (Correct Answer)",
//       questionText: "Which planet is known as the Red Planet?",
//       type: "multiple-choice" as const,
//       options: ["Venus", "Mars", "Jupiter", "Saturn"],
//       mode: "preview" as const,
//       correctAnswer: "Mars",
//       userAnswer: "Mars",
//       explanation: "Mars appears red due to iron oxide (rust) on its surface.",
//       score: 1
//     },
//     // Multiple Choice - Preview Mode (Wrong)
//     {
//       title: "Multiple Choice - Preview Mode (Wrong Answer)",
//       questionText: "What is 2 + 2?",
//       type: "multiple-choice" as const,
//       options: ["3", "4", "5", "6"],
//       mode: "preview" as const,
//       correctAnswer: "4",
//       userAnswer: "3",
//       explanation: "Basic arithmetic: 2 + 2 = 4",
//       score: 0
//     },
//     // Descriptive - Answering Mode
//     {
//       title: "Descriptive - Answering Mode",
//       questionText: "Explain the concept of gravity in your own words.",
//       type: "descriptive" as const,
//       mode: "answering" as const,
//       correctAnswer: "gravity is the force that attracts objects toward each other"
//     },
//     // Descriptive - Preview Mode
//     {
//       title: "Descriptive - Preview Mode",
//       questionText: "What is photosynthesis?",
//       type: "descriptive" as const,
//       mode: "preview" as const,
//       correctAnswer: "process by which plants convert sunlight into energy",
//       userAnswer: "plants make food from sun",
//       explanation: "Photosynthesis is the process used by plants to convert light energy into chemical energy that can be released to fuel the organism's activities.",
//       score: 0.5
//     }
//   ];

//   const currentTestCase = testCases[currentTest];

//   const handleAnswer = (answer: string) => {
//     setUserAnswers(prev => ({
//       ...prev,
//       [currentTest]: answer
//     }));
//   };

//   const handleNext = () => {
//     if (currentTest < testCases.length - 1) {
//       setCurrentTest(prev => prev + 1);
//     } else {
//       setCurrentTest(0);
//     }
//   };

//   const handlePrevious = () => {
//     if (currentTest > 0) {
//       setCurrentTest(prev => prev - 1);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="container mx-auto px-4">
//         {/* Test Navigation */}
//         <div className="max-w-4xl mx-auto mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
//             Quiz Component Test Suite
//           </h1>
          
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-xl font-semibold text-gray-900">
//                 {currentTestCase.title}
//               </h2>
//               <span className="text-sm text-gray-600">
//                 Test {currentTest + 1} of {testCases.length}
//               </span>
//             </div>
            
//             <div className="flex gap-2 mb-4">
//               {testCases.map((_, index) => (
//                 <button
//                   key={index}
//                   onClick={() => setCurrentTest(index)}
//                   className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
//                     currentTest === index
//                       ? 'bg-blue-600 text-white'
//                       : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//                   }`}
//                 >
//                   Test {index + 1}
//                 </button>
//               ))}
//             </div>

//             <div className="flex gap-3">
//               <button
//                 onClick={handlePrevious}
//                 disabled={currentTest === 0}
//                 className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
//               >
//                 Previous Test
//               </button>
//               <button
//                 onClick={handleNext}
//                 className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//               >
//                 {currentTest === testCases.length - 1 ? 'Restart Tests' : 'Next Test'}
//               </button>
//             </div>
//           </div>

//           {/* Current Answer Display */}
//           {currentTestCase.mode === "answering" && userAnswers[currentTest] && (
//             <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
//               <p className="text-yellow-800">
//                 <strong>Current Answer:</strong> {userAnswers[currentTest]}
//               </p>
//             </div>
//           )}
//         </div>

//         {/* Quiz Question Component */}
//         <QuizQuestion
//           questionText={currentTestCase.questionText}
//           type={currentTestCase.type}
//           options={currentTestCase.options}
//           mode={currentTestCase.mode}
//           correctAnswer={currentTestCase.correctAnswer}
//           explanation={currentTestCase.explanation}
//           userAnswer={currentTestCase.userAnswer || userAnswers[currentTest] || ""}
//           score={currentTestCase.score}
//           onAnswer={currentTestCase.mode === "answering" ? handleAnswer : undefined}
//           onNext={currentTestCase.mode === "answering" ? handleNext : undefined}
//         />

//         {/* Test Instructions */}
//         <div className="max-w-2xl mx-auto mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
//           <h3 className="font-semibold text-blue-900 mb-3">Test Instructions:</h3>
//           <ul className="text-blue-800 space-y-2 text-sm">
//             <li>• Use voice input by clicking "Speak Answer" button</li>
//             <li>• For multiple choice: Say "A", "B", "C", "D" or the option text</li>
//             <li>• For descriptive: Speak your full answer</li>
//             <li>• Navigate through different test scenarios using the buttons above</li>
//             <li>• Preview mode shows correct/incorrect answers with explanations</li>
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// }
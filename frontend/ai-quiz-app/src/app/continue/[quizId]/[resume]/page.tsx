"use client";
import { useState, useRef, useEffect,use } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import useSpeechToText, { ResultType } from "react-hook-speech-to-text";
import { jwtDecode } from "jwt-decode";
import Question from "../../../_components/QuizQuestion"
import { Fullscreen, AlertTriangle } from "lucide-react";

interface QuizLandingData {
  categoryTitle: string;
  subcategoryTitle: string;
  description: string;
  questionsCount?: number;
  timeLimit?: number;
  categoryId?: string;
}

interface AIQuestion {
  questionText: string;
  options: string[];
  questionType: "options" | "descriptive";
  difficultyLevel: number;
  questionId: string;
}

interface QuizSessionData {
  quizId: string;
  userId: string;
  categoryTitle: string;
  subcategoryTitle: string;
  totalQuestions: number;
  categoryId?: string;
  currentQuestionNumber: number;
}

export default function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const router = useRouter();
  
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [quizSession, setQuizSession] = useState<QuizSessionData | null>(null);
  const [progress, setProgress] = useState({ current: 1, total: 3 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hasStartedQuiz = useRef(false);
  const webcamRef = useRef<Webcam>(null);

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

  // Handle speech-to-text results - ACCUMULATE ALL
  useEffect(() => {
    if (!results?.length) return;
    
    // Get ALL transcripts and join them
    const allTranscripts = results.map(result => {
      if (typeof result !== "string" && "transcript" in result) {
        return result.transcript || "";
      }
      return result as string;
    }).filter(transcript => transcript.trim());
    
    const fullTranscript = allTranscripts.join(" ");
    
    if (fullTranscript) {
      setUserAnswer(fullTranscript);
    }
  }, [results]);

  // Fullscreen handling
  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.log("Fullscreen not supported");
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.log("Error exiting fullscreen");
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    enterFullscreen();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Start quiz
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

        const res = await fetch(`http://localhost:5000/quiz/resume`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: decoded.id,
            quizId
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to start quiz");
        }

        const response = await res.json();
        if (!response.success) {
          throw new Error("Invalid quiz start response");
        }
        
        const data = response.data;
        setCurrentQuestion(data.question);
        setQuizSession({
          quizId: data.quizId,
          userId: decoded.id,
          categoryId: quizData.categoryId,
          categoryTitle: quizData.categoryTitle,
          subcategoryTitle: quizData.subcategoryTitle,
          totalQuestions: 3,
          currentQuestionNumber: 1,
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

  const handleAnswerSubmit = async (answer: string) => {
    if (!userAnswer.trim() || !currentQuestion || !quizSession || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        quizData: {
          quizId: quizSession.quizId,
          userId: quizSession.userId,
          categoryId: quizSession.categoryId,
          categoryTitle: quizSession.categoryTitle,
          subcategoryTitle: quizSession.subcategoryTitle,
        },
        currentQuestion: {
          questionId: currentQuestion.questionId,
          questionText: currentQuestion.questionText,
          options: currentQuestion.options,
          questionType: currentQuestion.questionType,
          difficultyLevel: currentQuestion.difficultyLevel
        },
        userAnswer: answer,
        progress: {
          current: progress.current,
          total: progress.total
        },
      };

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

      const result = response.data;

      if (result.quizCompleted) {
        localStorage.setItem(
          quizSession.quizId,
          JSON.stringify({ ...quizSession, finalScore: result.finalScore })
        );
        router.push(`/results/${quizSession.quizId}`);
        return;
      } else {
        setCurrentQuestion(result.nextQuestion);
        setProgress(result.progress);
        setQuizSession(prev => prev ? {
          ...prev,
          currentQuestionNumber: result.progress.current
        } : null);
        setUserAnswer("");
        setResults([]);
      }
    } catch (err: any) {
      console.error("Submit answer error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecord = (isRecording: boolean) => {
    if (isRecording) {
      startSpeechToText();
    } else {
      stopSpeechToText();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-700 text-lg">Starting your quiz...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Fullscreen Warning Bar */}
      {!isFullscreen && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <div className="flex items-center justify-between max-w-8xl mx-auto">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div className="text-amber-800 text-sm">
                <span className="font-semibold">Fullscreen Required:</span> Enter fullscreen mode to prevent tab switching and ensure quiz integrity.
              </div>
            </div>
            <button
              onClick={enterFullscreen}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Fullscreen className="h-4 w-4" />
              Enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Quiz Component */}
          <div className="flex-1">
            {currentQuestion && (
              <Question
                questionText={currentQuestion.questionText}
                questionType={currentQuestion.questionType === "descriptive" ? "descriptive" : "multiple_choice"}
                options={currentQuestion.options}
                mode="quiz"
                currentQuestion={progress.current}
                totalQuestions={progress.total}
                userAnswer={userAnswer}
                onAnswer={setUserAnswer}
                onNext={() => handleAnswerSubmit(userAnswer)}
                onRecord={handleRecord}
                timeSettings={{}}
              />
            )}
          </div>

          {/* Webcam Preview */}
          <div className="w-52 flex-shrink-0">
            <div className="sticky top-8 space-y-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <Webcam
                  audio={false}
                  mirrored
                  ref={webcamRef}
                  className="w-full h-48 object-cover"
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 200,
                    height: 200,
                    facingMode: "user",
                  }}
                />
                <div className="p-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isRecording ? "bg-red-500 animate-pulse" : "bg-green-500"
                        }`}
                      />
                      <span className="text-xs text-gray-600">
                        {isRecording ? "Recording Audio" : "Camera Active"}
                      </span>
                    </div>
                    {isFullscreen ? (
                      <button
                        onClick={exitFullscreen}
                        className="text-xs text-gray-600 hover:text-gray-800 font-medium transition-colors"
                      >
                        Exit
                      </button>
                    ) : (
                      <button
                        onClick={enterFullscreen}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Fullscreen
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-800 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Mic Error: {error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-700 text-lg font-medium">Evaluating your answer...</div>
            <div className="text-gray-500 text-sm mt-2">This may take a few seconds</div>
          </div>
        </div>
      )}
    </div>
  );
}
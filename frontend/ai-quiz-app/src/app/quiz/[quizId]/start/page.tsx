
"use client";

import * as faceapi from "face-api.js";
import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import useSpeechToText, { ResultType } from "react-hook-speech-to-text";
import Question from "../../../_components/QuizQuestion";
import { Fullscreen, AlertTriangle, X, Volume2, Copy, Camera, Mic, User } from "lucide-react";
import { PreparingQuizLoader } from "../../../_lib/PreparingQuizLoader";
import { EvaluatingQuizLoader } from "../../../_lib/EvaluationLoader";
import { appDB } from "../../../../lib/appDataDB";
import type {SessionData,TimeSettings, AIQuestion} from "../../../../lib/types"



export default function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const router = useRouter();

  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [quizSession, setQuizSession] = useState<SessionData | null>(null);
  const [progress, setProgress] = useState({ current: 1, total: 3 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  const hasStartedQuiz = useRef(false);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [proctoringStatus, setProctoringStatus] = useState("Initializing camera...");

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const proctoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(
          "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.1/weights"
        );
        if (isMounted) {
          setIsModelLoaded(true);
          setProctoringStatus("Verified");
        }
      } catch (err) {
        console.error("Failed to load face detection model:", err);
        if (isMounted) {
          setIsModelLoaded(false);
          setProctoringStatus("No face detected");
        }
      }
    };

    loadModels();

    return () => {
      isMounted = false;
      if (proctoringIntervalRef.current) {
        clearInterval(proctoringIntervalRef.current);
      }
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isModelLoaded || !webcamRef.current || isLoading) return;

    const analyze = async () => {
      try {
        const video = webcamRef.current?.video;
        if (!video || video.readyState !== 4) return;

        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.5,
          })
        );
        const faceCount = detections.length;

        if (faceCount === 0) {
          setProctoringStatus("No face detected");
          showWarning("No face detected - Please position yourself in frame");
        } else if (faceCount > 1) {
          setProctoringStatus("Multiple faces detected");
          showWarning("Multiple faces detected - Only one person should be in frame");
        } else {
          setProctoringStatus("Verified");
        }
      } catch (err) {
        console.warn("Face detection error:", err);
      }
    };

    proctoringIntervalRef.current = setInterval(analyze, 3000);
    return () => {
      if (proctoringIntervalRef.current) {
        clearInterval(proctoringIntervalRef.current);
      }
    };
  }, [isModelLoaded, isLoading]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitting && !isLoading) {
        handleViolation("Tab switch detected");
        showWarning("Tab switch detected - Stay on this page");
      }
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation("Copy/paste detected");
      showWarning("Copy/paste is disabled during quiz");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v')) {
        e.preventDefault();
        handleViolation("Copy/paste shortcut");
        showWarning("Copy/paste shortcuts are disabled");
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J'))) {
        e.preventDefault();
        handleViolation("Dev tools access");
        showWarning("Developer tools are disabled");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation("Right-click attempt");
      showWarning("Right-click is disabled");
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [isSubmitting, isLoading]);

  useEffect(() => {
    const monitorDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        const mics = devices.filter(device => device.kind === 'audioinput');

        setCameraActive(cameras.length > 0);
        setMicActive(mics.length > 0);

        if (cameras.length === 0) {
          handleViolation("Camera disconnected");
          showWarning("Camera disconnected - Please check your camera");
        }
        if (mics.length === 0) {
          handleViolation("Microphone disconnected");
          showWarning("Microphone disconnected - Please check your microphone");
        }
      } catch (err) {
        console.error("Device monitoring error:", err);
        showWarning("Device disconnected.Please give access to avoid consequences.")
        handleViolation("Device disconnected.Please give access to avoid consequences.")
      }
    };
    const deviceInterval = setInterval(monitorDevices, 5000);
    monitorDevices();
    return () => clearInterval(deviceInterval);
  }, []);

  useEffect(() => {
    const startAudioMonitoring = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;

        audioIntervalRef.current = setInterval(() => {
          if (!analyserRef.current) return;

          const data = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(data);

          const average = data.reduce((a, b) => a + b) / data.length;

          if (average > 80) {
            handleViolation("High audio volume");
            showWarning("High background noise detected");
          }
        }, 1000);
      } catch (err) {
        console.error("Audio monitoring failed:", err);
      }
    };

    startAudioMonitoring();

    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
      // if (audioContextRef.current) {
      //   audioContextRef.current.close();
      // }
    };
  }, []);

  const handleViolation = (type: string) => {
    setViolationCount(prev => {
      const newCount = prev + 1;
      console.log(`Violation #${newCount}: ${type}`);
      return newCount;
    });
  };

  const showWarning = (message: string) => {
    setWarning(message);
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    warningTimeoutRef.current = setTimeout(() => {
      setWarning(null);
    }, 10000);
  };

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

  useEffect(() => {
    if (!results?.length) return;

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
  const mediaCleanupDone = useRef(false); // Add this with other refs

const stopAllMedia = () => {
  if (mediaCleanupDone.current) {
    console.log("Media cleanup already completed");
    return;
  }
  mediaCleanupDone.current = true;
  
  console.log("🛑 Stopping all media devices...");

  // 1. Stop webcam stream
  if (webcamRef.current?.video?.srcObject) {
    const stream = webcamRef.current.video.srcObject as MediaStream;
    console.log(`Stopping ${stream.getTracks().length} media tracks`);
    stream.getTracks().forEach(track => {
      console.log(`Stopping ${track.kind} track`);
      track.stop(); // This actually stops the device
      track.enabled = false; // Disable the track
    });
    webcamRef.current.video.srcObject = null;
  }

  // 2. Stop speech-to-text
  if (isRecording) {
    console.log("Stopping speech-to-text");
    stopSpeechToText();
  }

  // 3. Stop audio context SAFELY
  if (audioContextRef.current) {
    console.log("AudioContext state:", audioContextRef.current.state);
    if (audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().then(() => {
        console.log("✅ AudioContext closed successfully");
      }).catch(err => {
        console.log("AudioContext close error:", err.message);
      });
    } else {
      console.log("AudioContext already closed");
    }
  }

  // 4. Clear all intervals
  if (audioIntervalRef.current) {
    clearInterval(audioIntervalRef.current);
    audioIntervalRef.current = null;
  }
  if (proctoringIntervalRef.current) {
    clearInterval(proctoringIntervalRef.current);
    proctoringIntervalRef.current = null;
  }

  console.log("✅ Media cleanup completed");
};

  // const stopAllMedia = () => {
  //   if (webcamRef.current?.video?.srcObject) {
  //     const stream = webcamRef.current.video.srcObject as MediaStream;
  //     stream.getTracks().forEach(track => track.stop());
  //   }

  //   if (isRecording) {
  //     stopSpeechToText();
  //   }

  //   if (audioContextRef.current) {
  //     audioContextRef.current.close();
  //   }
  //   if (audioIntervalRef.current) {
  //     clearInterval(audioIntervalRef.current);
  //   }

  //   if (proctoringIntervalRef.current) {
  //     clearInterval(proctoringIntervalRef.current);
  //   }
  // };
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log("handle before called with status", isQuizCompleted)
      if (!isQuizCompleted) {
        event.preventDefault();
        event.returnValue = '';
        pauseQuizSessionSync();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isQuizCompleted, progress]);

  const pauseQuizSessionSync = async () => {
    console.log("trying to pass the session");
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId || isQuizCompleted) return;

    await appDB.updateSession(sessionId, {
      status: "paused",
      currentQuestionIndex: progress.current
    })
    console.log("updating indexdb", progress.current);
    localStorage.setItem("progress", JSON.stringify(progress));
    localStorage.removeItem('sessionId');
    router.replace('/history')
  };

  useEffect(() => {
    return () => {
      // stopAllMedia();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    if (hasStartedQuiz.current) return;

    const startQuiz = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not logged in");

        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
          const sessionLoadedData = await appDB.getSession(sessionId);
          console.log("loaded from indexdb", sessionLoadedData, sessionLoadedData?.userId);


          if (!sessionLoadedData) {
            throw new Error("Session Not found.")
          }
          const quizData: SessionData = sessionLoadedData;
          setQuizSession(quizData);
          hasStartedQuiz.current = true;

          const categoryId = localStorage.getItem('categoryId') ?? "";
          const quizStatus = quizData.status;

          let res;
          if (quizStatus === "preview") {
            console.log("calling to start quiz");
            res = await fetch("http://localhost:5000/quiz/start", {
              method: "POST",
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: quizData.userId,
                categoryId: categoryId,
                categoryTitle: quizData.category,
                subcategoryTitle: quizData.subcategory,
                questionsCount: quizData.questionsCount,
              }),
            });
          } else {
             console.log("calling to resume quiz");
            res = await fetch("http://localhost:5000/quiz/resume", {
              method: "POST",
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: quizData.userId,
                quizId: quizData.quizId
              }),
            });
          }


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

          setQuizSession((prev) => {
            if (!prev) {
              throw new Error("session not found")
            }
            return {
              ...prev,
              quizId: data.quizId
            }
          })


          await appDB.updateSession(sessionId, ({
            quizId: data.quizId,
            status: 'in-progress',
            currentQuestionIndex: data.currentQuestionNumber
          }))


          setProgress({ current: data.currentQuestionNumber, total: quizData.questionsCount });

        } else {
          console.warn("sessionid not found");
          throw new Error("Session not found. Please Try again.")
        }

      } catch (err: any) {
        console.error("Start quiz error:", err);
        alert(`Failed to start quiz: ${err.message}`);
        router.push("/categories");
      } finally {
        setIsLoading(false);
      }
    };

    startQuiz();
  }, []);

  const handleAnswerSubmit = async (answer: string) => {
    if (!userAnswer.trim() || !currentQuestion || !quizSession || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const categoryId = localStorage.getItem('categoryId') ?? "";
      const payload = {
        quizData: {
          quizId: quizSession.quizId,
          userId: quizSession.userId,
          categoryId: categoryId,
          categoryTitle: quizSession.category,
          subcategoryTitle: quizSession.subcategory,
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
        violations: violationCount,
      };
      console.log("questions progress:", progress);

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
        setIsQuizCompleted(true);

        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          throw new Error("Session not found. Please try again...");
        }
        const sessionLoadedData = await appDB.getSession(sessionId);
        console.log("loaded from indexdb", sessionLoadedData, sessionLoadedData?.userId);

        if (!sessionLoadedData) {
          throw new Error("Session Not found.")
        }

        await appDB.updateSession(sessionId, {
          status: "completed",
          currentQuestionIndex: sessionLoadedData.questionsCount,
          score: result.finalScore,
          endTime: new Date(),
          performanceFeedback:result.finalFeedback
        });
        stopAllMedia();
        router.replace(`/results/${quizSession.quizId}`);
        return;
      
      } else {
        setCurrentQuestion(result.nextQuestion);
        setProgress(result.progress);
        setProgress({ current: result.progress.current, total: result.progress.total })
        console.log("questions progress after submit:", progress);
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
        <PreparingQuizLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {warning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg border border-red-300 flex items-center gap-3 max-w-md">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium">{warning}</div>
            </div>
            <button
              onClick={() => setWarning(null)}
              className="flex-shrink-0 hover:bg-red-600 rounded-full p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {!isFullscreen && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <div className="flex items-center justify-between max-w-8xl mx-auto">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div className="text-amber-800 text-sm">
                <span className="font-semibold">Fullscreen Required:</span> Please enter fullscreen mode to continue
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

      <div className="max-w-8xl mx-auto px-6 py-8">
        <div className="flex gap-8">
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
                onClearRecording={() => setResults([])}
              />
            )}
          </div>

          <div className="w-64 flex-shrink-0">
            <div className="sticky top-8 space-y-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Proctoring Status</h3>
                  <div className="px-2 py-1 bg-red-50 border border-red-200 rounded">
                    <span className="text-xs font-medium text-red-700">Violations: {violationCount}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-gray-600">Face Detection</span>
                    </div>
                    <div className={`text-xs font-medium ${proctoringStatus === "Verified" ? "text-green-600" : "text-red-600"
                      }`}>
                      {proctoringStatus}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className={`h-4 w-4 ${cameraActive ? "text-green-500" : "text-red-500"}`} />
                      <span className="text-xs text-gray-600">Camera</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${cameraActive ? "bg-green-500" : "bg-red-500"}`} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className={`h-4 w-4 ${micActive ? "text-green-500" : "text-red-500"}`} />
                      <span className="text-xs text-gray-600">Microphone</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${micActive ? "bg-green-500" : "bg-red-500"}`} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-purple-500" />
                      <span className="text-xs text-gray-600">Audio Monitor</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Copy className="h-4 w-4 text-orange-500" />
                      <span className="text-xs text-gray-600">Copy/Paste</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
                <Webcam
                  audio={false}
                  mirrored
                  ref={webcamRef}
                  className="w-full h-48 object-cover"
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 256,
                    height: 256,
                    facingMode: "user",
                  }}
                />

                <div className="absolute top-3 left-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${proctoringStatus === "Verified"
                    ? "bg-green-500/20 text-green-700 border-green-300"
                    : "bg-red-500/20 text-red-700 border-red-300"
                    }`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${proctoringStatus === "Verified" ? "bg-green-500" : "bg-red-500"
                      }`}></span>
                    {proctoringStatus}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
                      <span className="text-xs text-gray-600">
                        {isRecording ? "Recording Audio" : "Mic Ready"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {violationCount > 0 ? `${violationCount} violations` : "No violations"}
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-800 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Mic Error: {error}</span>
                  </div>
                </div>
              )}

              {(proctoringStatus === "No face detected" || proctoringStatus === "Multiple faces detected" || !cameraActive || !micActive) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2 text-yellow-800 text-xs">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Attention Required</div>
                      <div className="mt-1">
                        {!cameraActive && "• Camera disconnected\n"}
                        {!micActive && "• Microphone disconnected\n"}
                        {proctoringStatus === "No face detected" && "• Face not detected\n"}
                        {proctoringStatus === "Multiple faces detected" && "• Multiple faces detected"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 backdrop-blur-sm">
          <EvaluatingQuizLoader />
        </div>

      )}
    </div>
  );
}
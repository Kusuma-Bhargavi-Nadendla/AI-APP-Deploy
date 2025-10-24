"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Lightbulb, Video, Mic, CheckCircle, Clock, HelpCircle, ArrowLeft, Play } from 'lucide-react'
import { use } from 'react'
import Webcam from "react-webcam";
import { appDB } from "../../../lib/appDataDB";

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

interface QuizSessionData {
  quizId: string;
  questionsCount: number;
  timeSettings: TimeSettings;
  categoryTitle: string;
  subcategoryTitle: string;
  description: string;
  currentQuestion?: number;
  totalQuestions?: number;
}

export default function ContinueQuizLandingPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const router = useRouter()
  const [quizData, setQuizData] = useState<QuizSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState({
    audio: false,
    video: false
  })
  const [audioLevel, setAudioLevel] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const fetchQuizSession = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not logged in");

        const res = await fetch(`http://localhost:5000/quiz/resume/${quizId}`, {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch quiz session");
        }

        const response = await res.json();
        if (response.success) {
          setQuizData(response.data);
        } else {
          throw new Error("Invalid session data");
        }
        
      } catch (err: any) {
        console.error("Fetch quiz session error:", err);
        alert(`Failed to load quiz session: ${err.message}`);
        router.push("/categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizSession();
  }, [quizId, router]);

  const analyzeAudio = () => {
    if (!analyserRef.current) return
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
    const average = sum / dataArray.length
    setAudioLevel(average / 255)
    animationRef.current = requestAnimationFrame(analyzeAudio)
  }

  const enableVideo = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      setPermissions(prev => ({ ...prev, video: true }))
    } catch (error: any) {
      alert(error)
    }
  }

  const enableAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setPermissions(prev => ({ ...prev, audio: true }))
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)
      analyzeAudio()
    } catch (error) {
      alert('Please allow microphone access to continue.')
    }
  }

  const handleContinueQuiz = () => {
    if (!permissions.audio || !permissions.video) {
      alert("Please enable both camera and microphone to continue");
      return;
    }

    if (quizData) {
      localStorage.setItem(quizId, JSON.stringify({
        categoryTitle: quizData.categoryTitle,
        subcategoryTitle: quizData.subcategoryTitle,
        description: quizData.description,
        questionsCount: quizData.questionsCount,
        timeLimit: quizData.timeSettings,
        categoryId: quizData.quizId 
      }));
    }

    router.push(`/quiz/${quizId}/continue`);
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!quizData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="text-gray-700 text-lg mb-4">Quiz session not found</div>
          <Button onClick={() => router.push("/categories")}>
            Back to Categories
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 pl-0 hover:bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Quiz Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Play className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Continue Quiz
                    </h1>
                    <p className="text-blue-600 text-sm font-medium">
                      Resume your previous attempt
                    </p>
                  </div>
                </div>

                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {quizData.subcategoryTitle}
                </h2>
                <p className="text-lg text-blue-600 font-medium">
                  {quizData.categoryTitle}
                </p>
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">
                {quizData.description}
              </p>

              {/* Fixed Quiz Settings Display */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-3">Quiz Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-700">Questions</label>
                    <div className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-medium text-gray-700">
                      {quizData.questionsCount} Questions
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-700">Timer</label>
                    <div className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-medium text-gray-700">
                      {quizData.timeSettings.totalEnabled ? (
                        <>Total: {quizData.timeSettings.totalMinutes} min</>
                      ) : quizData.timeSettings.perQuestionEnabled ? (
                        <>Per Question: {quizData.timeSettings.perQuestionSeconds} sec</>
                      ) : (
                        <>No Timer</>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                  <HelpCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-blue-600">{quizData.questionsCount}</div>
                  <div className="text-sm text-blue-800 font-medium">Total Questions</div>
                </div>
                
                {quizData.timeSettings.totalEnabled ? (
                  <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                    <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-green-600">
                      {quizData.timeSettings.totalMinutes} min
                    </div>
                    <div className="text-sm text-green-800 font-medium">Total Time</div>
                  </div>
                ) : quizData.timeSettings.perQuestionEnabled ? (
                  <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                    <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-green-600">
                      {quizData.timeSettings.perQuestionSeconds} sec/q
                    </div>
                    <div className="text-sm text-green-800 font-medium">Per Question</div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                    <Clock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-gray-400">No Timer</div>
                    <div className="text-sm text-gray-600 font-medium">Time Limit</div>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-amber-900">Before You Continue</h3>
              </div>
              <ul className="text-sm text-amber-800 space-y-2">
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div><span>You are being monitored throughout the test</span></li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div><span>Malpractice will be detected and may lead to disqualification</span></li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div><span>Ensure stable internet connection</span></li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div><span>Find a quiet environment without distractions</span></li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div><span>Cannot return to previous questions</span></li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div><span>Settings are fixed from your previous session</span></li>
              </ul>
            </div>
          </div>

          {/* Permissions Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Camera</h3>
                {permissions.video && <CheckCircle className="h-5 w-5 text-green-500" />}
              </div>
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 aspect-video mb-4 overflow-hidden">
                {permissions.video ? (
                  <Webcam audio={false} mirrored={true} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Video className="h-12 w-12 mb-2" />
                    <p className="text-sm">Camera disabled</p>
                  </div>
                )}
              </div>
              <Button onClick={enableVideo} disabled={permissions.video} variant={permissions.video ? "outline" : "default"} className="w-full" size="sm">
                <Video className="h-4 w-4 mr-2" />
                {permissions.video ? 'Camera Enabled' : 'Enable Camera'}
              </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Microphone</h3>
                {permissions.audio && <CheckCircle className="h-5 w-5 text-green-500" />}
              </div>
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-4 mb-4">
                <div className="flex items-center justify-center gap-1 h-8">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className={`w-1.5 rounded-full transition-all duration-100 ${i < audioLevel * 20 ? 'bg-green-500' : 'bg-gray-300'}`} style={{ height: `${Math.max(4, (i + 1) * 2)}px` }} />
                  ))}
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  {permissions.audio ? 'Microphone active - Speak to test' : 'Enable microphone to see audio levels'}
                </p>
              </div>
              <Button onClick={enableAudio} disabled={permissions.audio} variant={permissions.audio ? "outline" : "default"} className="w-full" size="sm">
                <Mic className="h-4 w-4 mr-2" />
                {permissions.audio ? 'Microphone Enabled' : 'Enable Microphone'}
              </Button>
            </div>

            {/* Continue Button */}
            <div className="space-y-4">
              <Button 
                onClick={handleContinueQuiz} 
                disabled={!permissions.audio || !permissions.video}
                className={`w-full py-6 text-lg font-semibold transition-all duration-300 ${
                  permissions.audio && permissions.video 
                    ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]' 
                    : 'bg-gray-400'
                }`}
              >
                <Play className="h-5 w-5 mr-2" />
                Continue Quiz
              </Button>
              
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/categories")}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Start New Quiz Instead
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Lightbulb, Video, Mic, CheckCircle, Clock, HelpCircle, ArrowLeft } from 'lucide-react'
import { use } from 'react'
import Webcam from "react-webcam";
import { appDB } from "../../../lib/appDataDB";
import type {SessionData,TimeSettings} from "../../../lib/types"

export default function QuizLandingPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const router = useRouter()
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerType, setTimerType] = useState<"total" | "perQuestion">("total")
  const [selectedTime, setSelectedTime] = useState("")
  const [quizData, setQuizData] = useState<SessionData | null>(null);
  const [isContinue, setIsQuizContinuing] = useState(false);
  const [permissions, setPermissions] = useState({
    audio: false,
    video: false
  })
  const [audioLevel, setAudioLevel] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  const timerOptions = {
    total: ["5", "10", "15", "30"],
    perQuestion: ["30", "60", "90", "120"]
  };

  const questionOptions = ["3", "5", "10", "15", "30"];

  useEffect(() => {
    if (timerEnabled && !selectedTime) {
      const defaultTime = timerOptions[timerType][0];
      setSelectedTime(defaultTime);
    } else if (!timerEnabled) {
      setSelectedTime("");
    }
  }, [timerEnabled, timerType]);

  useEffect(() => {
    if (timerEnabled) {
      const defaultTime = timerOptions[timerType][0];
      setSelectedTime(defaultTime);
    }
  }, [timerType]);

  const fetchQuizdata = async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      const data = await appDB.getSession(sessionId);
      console.log("fetched quiz data:", data);
      const status = data?.status;
    
      if (data) {
        const quiz: SessionData = {
          sessionId: sessionId,
          userId: data.userId,
          categoryDescription: data.categoryDescription,
          category: data.category,
          subcategory: data.subcategory,
          subcategoryDescription: data.subcategoryDescription,
          quizSlugId: data.quizSlugId,
          questionsCount: data.questionsCount || 5,
          timeSettings: data.timeSettings || {
            totalEnabled: false,
            perQuestionEnabled: false
          },
          quizId: data.quizId,
          status: data.status,
          currentQuestionIndex: data.currentQuestionIndex,
          startTime: data.startTime,
          updatedAt: data.updatedAt
        };
        setQuizData(quiz);
        

        if (data.timeSettings) {
          const hasTimer = data.timeSettings.totalEnabled || data.timeSettings.perQuestionEnabled;
          setTimerEnabled(hasTimer);

          if (data.timeSettings.totalEnabled) {
            setTimerType("total");
            setSelectedTime(data.timeSettings.totalMinutes?.toString() || "10");
          } else if (data.timeSettings.perQuestionEnabled) {
            setTimerType("perQuestion");
            setSelectedTime(data.timeSettings.perQuestionSeconds?.toString() || "60");
          }
        }
        if (data.status === "in-progress" || data.status === "paused") {
          setIsQuizContinuing(true);
        }
      }
    }
  }

  useEffect(() => {
    fetchQuizdata();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    }
  }, [quizId])

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

  const handleStartQuiz = async () => {
    if (!permissions.audio || !permissions.video) return;

    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      const timeSettings: TimeSettings = {
        totalEnabled: timerEnabled && timerType === "total",
        perQuestionEnabled: timerEnabled && timerType === "perQuestion"
      };

      if (timerEnabled && timerType === "total" && selectedTime) {
        timeSettings.totalMinutes = parseInt(selectedTime);
      } else if (timerEnabled && timerType === "perQuestion" && selectedTime) {
        timeSettings.perQuestionSeconds = parseInt(selectedTime);
      }

      await appDB.updateSession(sessionId, {
        questionsCount: quizData?.questionsCount || 5,
        timeSettings: timeSettings
      });
    }

    // router.push(`/quiz/${quizId}/start`);
    router.replace(`/quiz/${quizId}/start`)
    
  }

  if (!quizData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {quizData.subcategory}
                </h1>
                <p className="text-lg text-blue-600 font-medium">
                  {quizData.category}
                </p>
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">
                {quizData.subcategoryDescription}
              </p>

              {!isContinue ? (
                <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-blue-800 whitespace-nowrap">
                      Questions:
                    </label>
                    <select
                      value={quizData.questionsCount}
                      onChange={(e) => setQuizData({
                        ...quizData,
                        questionsCount: Number(e.target.value)
                      })}
                      className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    >
                      {questionOptions.map((count) => (
                        <option key={count} value={count}>{count}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-blue-800 whitespace-nowrap">
                      Timer:
                    </label>
                    <button
                      onClick={() => setTimerEnabled(!timerEnabled)}
                      className={`w-14 h-7 rounded-full transition-all duration-300 relative ${timerEnabled ? 'bg-green-500' : 'bg-gray-300'
                        } shadow-inner`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-lg ${timerEnabled ? 'transform translate-x-7' : 'transform translate-x-1'
                        }`} />
                    </button>

                    {timerEnabled && (
                      <div className="flex items-center gap-2">
                        <select
                          value={timerType}
                          onChange={(e) => setTimerType(e.target.value as "total" | "perQuestion")}
                          className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                        >
                          <option value="total">Total Time</option>
                          <option value="perQuestion">Per Question</option>
                        </select>

                        <select
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                        >
                          {timerOptions[timerType].map((time) => (
                            <option key={time} value={time}>
                              {time} {timerType === "total" ? "minutes" : "seconds"}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ) :
                <div className="flex items-center justify-center mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm font-medium text-blue-800">
                    Continue where you left off
                  </p>
                </div>
              }


              <div className="grid grid-cols-2 gap-4">
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200 shadow-sm">
                  <HelpCircle className={`h-6 w-6 mx-auto mb-2 ${isContinue ? 'text-blue-700' : 'text-blue-600'}`} />
                  <div className={`text-xl font-bold ${isContinue ? 'text-blue-800' : 'text-blue-700'}`}>
                    {isContinue ? `${quizData.currentQuestionIndex-1}/${quizData.questionsCount}` : quizData.questionsCount}
                  </div>
                  <div className={`text-sm font-medium ${isContinue ? 'text-blue-900' : 'text-blue-800'}`}>
                    {isContinue ? "Questions Answered" : "Total Questions"}
                  </div>
                </div>


                {timerEnabled && selectedTime ? (
                  <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                    <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-green-600">
                      {selectedTime} {timerType === "total" ? "min" : "sec"}{timerType === "perQuestion" && "/q"}
                    </div>
                    <div className="text-sm text-green-800 font-medium">
                      {timerType === "total" ? "Total Time" : "Per Question"}
                    </div>
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

            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-amber-900">Before You Start</h3>
              </div>
              <ul className="text-sm text-amber-800 space-y-2">
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div><span>You are being monitored throughout the test</span></li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div><span>Malpractice will be detected and may lead to disqualification</span></li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div><span>Ensure stable internet connection</span></li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div><span>Find a quiet environment without distractions</span></li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div><span>Cannot return to previous questions</span></li>
                {/* <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div><span>All the Best.....</span></li> */}
              </ul>
            </div>
          </div>

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

            <div className="space-y-4">
              <Button
                onClick={handleStartQuiz}
                disabled={!permissions.audio || !permissions.video}
                className={`w-full py-6 text-lg font-semibold transition-all duration-300 ${permissions.audio && permissions.video
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                  : 'bg-gray-400'
                  }`}
              >
                Start Quiz
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
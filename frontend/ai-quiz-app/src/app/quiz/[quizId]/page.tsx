"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Lightbulb, Video, Mic, CheckCircle, X, Clock, HelpCircle, ArrowLeft } from 'lucide-react'
import { use } from 'react'
import Webcam from "react-webcam";

interface QuizLandingData {
  categoryTitle: string;
  subcategoryTitle: string;
  description: string;
  questionsCount: number;
  timeLimit: number;
}

export default function QuizLandingPage({params}:{params:Promise<{quizId:string}>}) {
  const { quizId } = use(params);
  const router = useRouter()
  const [quizData, setQuizData] = useState<QuizLandingData | null>(null)
  const [permissions, setPermissions] = useState({
    audio: false,
    video: false
  })
  const [audioLevel, setAudioLevel] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number|null>(null)

  useEffect(() => {
    const storedQuizData = localStorage.getItem(quizId);
    if (storedQuizData) {
      setQuizData(JSON.parse(storedQuizData));
    } else {
      alert('Quiz data not found.');
      router.push('/categories');
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [quizId])

  const analyzeAudio = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i]
    }
    const average = sum / dataArray.length
    setAudioLevel(average / 255)

    animationRef.current = requestAnimationFrame(analyzeAudio)
  }

  const enableVideo = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      setPermissions(prev => ({ ...prev, video: true }))
    } catch (error:any) {
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

  const handleStartQuiz = () => {
    if (permissions.audio && permissions.video) {
      router.push(`/quiz/${quizId}/start`)
    }
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
                  {quizData.subcategoryTitle}
                </h1>
                <p className="text-lg text-blue-600 font-medium">
                  {quizData.categoryTitle}
                </p>
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">
                {quizData.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                  <HelpCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-blue-600">{quizData.questionsCount}</div>
                  <div className="text-sm text-blue-800 font-medium">Questions</div>
                </div>
                {quizData.timeLimit &&(
                  <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                    <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-green-600">{quizData.timeLimit}</div>
                    <div className="text-sm text-green-800 font-medium">Minutes</div>
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
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>You are being monitored throughout the test</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Malpractice will be detected and may lead to disqualification</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Ensure stable internet connection</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Find a quiet environment without distractions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Cannot return to previous questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>All the Best.....</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Camera</h3>
                {permissions.video && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 aspect-video mb-4 overflow-hidden">
                {permissions.video ? (
                  <Webcam
                    audio={false}
                    mirrored={true}
                    className="w-full h-full object-cover"
                    screenshotFormat="image/jpeg"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Video className="h-12 w-12 mb-2" />
                    <p className="text-sm">Camera disabled</p>
                  </div>
                )}
              </div>
              
              <Button
                onClick={enableVideo}
                disabled={permissions.video}
                variant={permissions.video ? "outline" : "default"}
                className="w-full"
                size="sm"
              >
                <Video className="h-4 w-4 mr-2" />
                {permissions.video ? 'Camera Enabled' : 'Enable Camera'}
              </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Microphone</h3>
                {permissions.audio && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-4 mb-4">
                <div className="flex items-center justify-center gap-1 h-8">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-100 ${
                        i < audioLevel * 20 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                      }`}
                      style={{
                        height: `${Math.max(4, (i + 1) * 2)}px`
                      }}
                    />
                  ))}
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  {permissions.audio ? 'Microphone active - Speak to test' : 'Enable microphone to see audio levels'}
                </p>
              </div>
              
              <Button
                onClick={enableAudio}
                disabled={permissions.audio}
                variant={permissions.audio ? "outline" : "default"}
                className="w-full"
                size="sm"
              >
                <Mic className="h-4 w-4 mr-2" />
                {permissions.audio ? 'Microphone Enabled' : 'Enable Microphone'}
              </Button>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleStartQuiz}
                disabled={!permissions.audio || !permissions.video}
                className="w-full py-3 text-base bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
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
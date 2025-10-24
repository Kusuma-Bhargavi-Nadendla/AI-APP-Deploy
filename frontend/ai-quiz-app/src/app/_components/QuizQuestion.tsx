"use client";
import { useState, useEffect, useRef } from "react";
import { Mic, Square, RotateCcw, Plus } from "lucide-react";

interface QuestionProps {
  questionText: string;
  questionType: "multiple_choice" | "descriptive";
  options?: string[];
  mode: "quiz" | "preview" | "practice";
  currentQuestion?: number;
  totalQuestions?: number;
  correctAnswer?: string;
  userAnswer?: string;
  score?: number;
  explanation?: string;
  onAnswer?: (answer: string) => void;
  onNext?: () => void;
  onRecord?: (isRecording: boolean) => void;
  timeSettings?: {
    questionTimeLimit?: number;
    totalTimeLimit?: number;
    elapsedTotalTime?: number;
  };
  onClearRecording?: () => void;

}

export default function Question({
  questionText,
  questionType,
  options = [],
  mode,
  currentQuestion = 1,
  totalQuestions = 1,
  correctAnswer,
  userAnswer = "",
  score,
  explanation,
  onAnswer,
  onNext,
  onRecord,
  timeSettings,
  onClearRecording = () => { }
}: QuestionProps) {
  const [selectedOption, setSelectedOption] = useState(userAnswer);
  const [textAnswer, setTextAnswer] = useState(userAnswer);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [audioLevel, setAudioLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setSelectedOption(userAnswer);
    setTextAnswer(userAnswer);
  }, [userAnswer]);

  const setupAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      startAudioAnalysis();
    } catch (err) {
      console.log("Audio visualization not available", err);
    }
  };

  const startAudioAnalysis = () => {
    if (!analyserRef.current) return;

    const analyze = () => {
      if (!analyserRef.current || recordingState !== 'recording') return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      setAudioLevel(Math.min(1, average / 128));

      animationRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  };

  const cleanupAudio = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const startRecording = async () => {
    try {
      await setupAudioVisualizer();
      setRecordingState('recording');
      onRecord?.(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Please allow microphone access to record your answer.");
    }
  };

  const stopRecording = () => {
    setRecordingState('recorded');
    onRecord?.(false);
    cleanupAudio();
  };

  const restartRecording = () => {
    setTextAnswer("");
    onAnswer?.("");
    setRecordingState('idle');
    cleanupAudio();
    onClearRecording?.();
  };

  const continueRecording = async () => {
    try {
      await setupAudioVisualizer();
      setRecordingState('recording');
      onRecord?.(true);
    } catch (err) {
      console.error("Failed to continue recording:", err);
    }
  };

  useEffect(() => {
    if (recordingState === 'recording') {
      stopRecording();
    }
  }, [currentQuestion]);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    if (mode === "quiz" || mode === "practice") {
      onAnswer?.(option);
    }
  };

  const handleTextChange = (text: string) => {
    setTextAnswer(text);
    if (mode === "quiz" || mode === "practice") {
      onAnswer?.(text);
    }
  };

  const clearAnswer = () => {
    setSelectedOption("");
    setTextAnswer("");
    onAnswer?.("");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isPreview = mode === "preview";
  const showProgress = mode === "quiz" || mode === "preview";
  const hasQuestionTimer = timeSettings?.questionTimeLimit && mode === "quiz";
  const hasTotalTimer = timeSettings?.totalTimeLimit && mode === "quiz";

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-[90vh] flex flex-col">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${mode === "quiz" ? "bg-red-500 animate-pulse" :
                  mode === "preview" ? "bg-blue-500" : "bg-green-500"
                }`} />
              {mode === "quiz" && (
                <div className="absolute inset-0 w-3 h-3 bg-red-400 rounded-full animate-ping" />
              )}
            </div>
            <div className="text-lg font-semibold text-gray-800">
              {showProgress ? (
                <span>Question {currentQuestion} of {totalQuestions}</span>
              ) : (
                <span>Question {currentQuestion}</span>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            {hasQuestionTimer && (
              <div className="text-sm font-mono font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                Q: {formatTime(timeSettings.questionTimeLimit!)}
              </div>
            )}
            {hasTotalTimer && (
              <div className="text-sm font-mono font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                T: {formatTime(timeSettings.totalTimeLimit!)}
              </div>
            )}
          </div>
        </div>

        {showProgress && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 leading-relaxed">
            {questionText}
          </h2>
        </div>

        {questionType === "multiple_choice" && options.length > 0 && (
          <div className="space-y-3 mb-6">
            {options.map((option, index) => {
              const isSelected = selectedOption === option;
              const isCorrect = isPreview && option === correctAnswer;
              const isWrong = isPreview && isSelected && option !== correctAnswer;

              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  disabled={isPreview}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${isCorrect ? "border-green-300 bg-green-50" :
                      isWrong ? "border-red-300 bg-red-50" :
                        isSelected ? "border-blue-300 bg-blue-50" :
                          "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    } ${isPreview ? "cursor-default" : "cursor-pointer"}`}
                >
                  <div className="flex items-center">
                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold mr-4 ${isCorrect ? "border-green-500 text-green-700 bg-green-100" :
                        isWrong ? "border-red-500 text-red-700 bg-red-100" :
                          isSelected ? "border-blue-500 text-blue-700 bg-blue-100" :
                            "border-gray-400 text-gray-600 bg-white"
                      }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-gray-700 font-medium">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {questionType === "descriptive" && (
          <div className="mb-6">
            <textarea
              value={textAnswer}
              onChange={(e) => handleTextChange(e.target.value)}
              disabled={isPreview}
              placeholder="Type your answer here..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 text-gray-700"
            />

            {(mode === "quiz" || mode === "practice") && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Voice Answer</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${recordingState === 'recording' ? 'bg-red-500 animate-pulse' :
                        recordingState === 'recorded' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    <span className="text-sm text-gray-600">
                      {recordingState === 'recording' ? 'Recording...' :
                        recordingState === 'recorded' ? 'Recorded' : 'Ready'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {recordingState === 'idle' && (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                      <Mic className="h-3.5 w-3.5" />
                      Start
                    </button>
                  )}

                  {recordingState === 'recording' && (
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                      <Square className="h-3.5 w-3.5" />
                      Stop
                    </button>
                  )}

                  {recordingState === 'recorded' && (
                    <>
                      <button
                        onClick={restartRecording}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restart
                      </button>
                      <button
                        onClick={continueRecording}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add More
                      </button>
                    </>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  {recordingState === 'recorded' && "Add more to your answer or restart fresh"}
                </p>
              </div>
            )}
          </div>
        )}

        {(selectedOption || textAnswer) && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Your Answer</p>
                <p className="text-blue-900">{selectedOption || textAnswer}</p>
              </div>
              {(mode === "quiz" || mode === "practice") && (
                <button
                  onClick={clearAnswer}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {isPreview && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
            {score !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700 text-sm font-medium">Score:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${score >= 8 ? "bg-green-100 text-green-800" :
                    score >= 5 ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                  }`}>
                  {score}/10
                </span>
              </div>
            )}

            {correctAnswer && (
              <div>
                <span className="text-gray-700 text-sm font-medium block mb-1">Correct Answer:</span>
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-green-800 text-sm">{correctAnswer}</p>
                </div>
              </div>
            )}

            {explanation && (
              <div>
                <span className="text-gray-700 text-sm font-medium block mb-1">Explanation:</span>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-blue-800 text-sm">{explanation}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {(mode === "quiz" ) && onNext && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onNext}
              disabled={!selectedOption && !textAnswer}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed text-sm"
            >
              {currentQuestion === totalQuestions ? "Finish" : "Next"} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
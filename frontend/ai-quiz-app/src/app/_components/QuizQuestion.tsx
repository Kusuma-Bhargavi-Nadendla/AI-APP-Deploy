"use client";
import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, CheckCircle, XCircle, Star, Trophy, Frown } from "lucide-react";
import useSpeechToText, { ResultType } from "react-hook-speech-to-text";

interface QuestionProps {
  questionText: string;
  type: "descriptive" | "multiple-choice";
  options?: string[];
  mode: "answering" | "preview";
  correctAnswer?: string | null;
  explanation?: string | null;
  userAnswer?: string;
  score?: number;
  onAnswer?: (answer: string) => void;
  onNext?: () => void;
}

export default function QuizQuestion({
  questionText,
  type,
  options = [],
  mode,
  correctAnswer = null,
  explanation = "",
  userAnswer = "",
  score = 0,
  onAnswer,
  onNext
}: QuestionProps) {
  const [answer, setAnswer] = useState(userAnswer);
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const {
    error,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  // Process speech results for both multiple choice and descriptive
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

    const processedTranscript = transcript.trim().toLowerCase();
    
    if (type === "multiple-choice" && options.length > 0) {
      // Handle letter selection (A, B, C, D)
      const letterMatch = processedTranscript.match(/^[a-d]$/);
      if (letterMatch) {
        const index = letterMatch[0].charCodeAt(0) - 97; // a=0, b=1, c=2, d=3
        if (index >= 0 && index < options.length) {
          const selectedOption = options[index];
          setAnswer(selectedOption);
          onAnswer?.(selectedOption);
          if (mode === "answering") {
            setShowFeedback(true);
          }
          return;
        }
      }

      // Handle full option text matching
      for (let i = 0; i < options.length; i++) {
        const option = options[i].toLowerCase();
        if (processedTranscript.includes(option) || option.includes(processedTranscript)) {
          setAnswer(options[i]);
          onAnswer?.(options[i]);
          if (mode === "answering") {
            setShowFeedback(true);
          }
          return;
        }
      }
    }

    // For descriptive answers or no match in multiple choice
    setAnswer(transcript);
    onAnswer?.(transcript);
  }, [results, type, options, mode, onAnswer]);

  const toggleRecording = () => {
    if (isRecording) {
      stopSpeechToText();
      setIsRecording(false);
    } else {
      setResults([]);
      if (type === "descriptive") {
        setAnswer("");
      }
      startSpeechToText();
      setIsRecording(true);
    }
  };

  const handleOptionSelect = (option: string) => {
    setAnswer(option);
    onAnswer?.(option);
    if (mode === "answering") {
      setShowFeedback(true);
    }
  };

  const handleTextAnswer = (text: string) => {
    setAnswer(text);
    onAnswer?.(text);
  };

  const isCorrect = correctAnswer && answer.trim().toLowerCase() === correctAnswer.toLowerCase();
  const isAnswered = answer.trim().length > 0;

  // Celebration messages
  const getCelebrationMessage = () => {
    if (!showFeedback || !correctAnswer) return null;
    
    const messages = [
      { text: "Brilliant! You're a star! 🌟", icon: Star },
      { text: "Perfect! You nailed it! 🎯", icon: Trophy },
      { text: "Outstanding! Pure genius! 💡", icon: CheckCircle },
      { text: "Excellent work! You're crushing it! 🚀", icon: Star }
    ];
    
    const sadMessages = [
      { text: "Don't worry, every expert was once a beginner! 📚", icon: Frown },
      { text: "Keep going! Learning is a journey! 🛣️", icon: Frown },
      { text: "This is how we grow! Next one's yours! 💪", icon: Frown }
    ];

    return isCorrect 
      ? messages[Math.floor(Math.random() * messages.length)]
      : sadMessages[Math.floor(Math.random() * sadMessages.length)];
  };

  const celebration = getCelebrationMessage();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-2xl mx-auto">
      {/* Question */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 leading-relaxed">
          {questionText}
        </h2>
      </div>

      {/* Multiple Choice Options */}
      {type === "multiple-choice" && options.length > 0 && (
        <div className="space-y-3 mb-6">
          {options.map((option, index) => {
            const isSelected = answer === option;
            const isCorrectOption = mode === "preview" && option === correctAnswer;
            const isWrongSelected = mode === "preview" && isSelected && !isCorrect;

            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(option)}
                disabled={mode === "preview"}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  isSelected
                    ? isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : isCorrectOption
                    ? 'border-green-300 bg-green-25'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                } ${mode === "preview" ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 ${
                    isSelected
                      ? isCorrect
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-red-500 bg-red-500 text-white'
                      : isCorrectOption
                      ? 'border-green-400 bg-green-400 text-white'
                      : 'border-gray-300 text-gray-600'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-lg text-gray-900 flex-1">{option}</span>
                  
                  {/* Icons for preview mode */}
                  {mode === "preview" && (
                    <div className="ml-2">
                      {isCorrectOption && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {isWrongSelected && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Descriptive Answer */}
      {type === "descriptive" && (
        <div className="mb-6">
          <textarea
            value={answer}
            onChange={(e) => handleTextAnswer(e.target.value)}
            placeholder="Type your answer here..."
            disabled={mode === "preview"}
            className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
        </div>
      )}

      {/* Voice Input (Answering Mode Only) */}
      {mode === "answering" && (
        <div className="mb-6">
          <button
            onClick={toggleRecording}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-all ${
              isRecording
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {isRecording ? (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <MicOff className="w-5 h-5" />
                <span>Stop Recording</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>Speak Answer {type === "multiple-choice" && "(Say A, B, C, D or option text)"}</span>
              </>
            )}
          </button>
          {error && (
            <p className="mt-2 text-red-500 text-sm">🎤 {error}</p>
          )}
        </div>
      )}

      {/* Celebration/Sad Message */}
      {celebration && (
        <div className={`p-4 rounded-xl mb-6 ${
          isCorrect 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
            : 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            <celebration.icon className={`w-6 h-6 ${
              isCorrect ? 'text-green-600' : 'text-red-600'
            }`} />
            <span className={`text-lg font-semibold ${
              isCorrect ? 'text-green-800' : 'text-red-800'
            }`}>
              {celebration.text}
            </span>
          </div>
        </div>
      )}

      {/* Explanation (Preview Mode) */}
      {mode === "preview" && explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
          <p className="text-blue-800">{explanation}</p>
        </div>
      )}

      {/* Score (Preview Mode) */}
      {mode === "preview" && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Your Score:</span>
            <span className={`text-xl font-bold ${
              isCorrect ? 'text-green-600' : 'text-red-600'
            }`}>
              {isCorrect ? '+1' : '0'} point
            </span>
          </div>
        </div>
      )}

      {/* Next Button (Answering Mode) */}
      {mode === "answering" && isAnswered && (
        <div className="flex justify-end">
          <button
            onClick={onNext}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
          >
            Next Question →
          </button>
        </div>
      )}
    </div>
  );
}
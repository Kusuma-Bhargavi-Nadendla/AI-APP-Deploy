// "use client";
// import { useState, useEffect } from "react";


// interface QuestionProps {
//   questionText: string;
//   questionType: "multiple-choice" | "descriptive";
//   options?: string[];
//   mode: "quiz" | "preview" | "practice";
//   currentQuestion?: number;
//   totalQuestions?: number;
//   correctAnswer?: string;
//   userAnswer?: string;
//   score?: number;
//   explanation?: string;
//   onAnswer?: (answer: string) => void;
//   onNext?: () => void;
//   onRecord?: (isRecording: boolean) => void;
//   timeSettings?: {
//     questionTimeLimit?: number;
//     totalTimeLimit?: number;
//     elapsedTotalTime?: number;
//   };
// }

// export default function Question({
//   questionText,
//   questionType,
//   options = [],
//   mode,
//   currentQuestion = 1,
//   totalQuestions = 1,
//   correctAnswer,
//   userAnswer = "",
//   score,
//   explanation,
//   onAnswer,
//   onNext,
//   onRecord,
//   timeSettings
// }: QuestionProps) {
//   const [selectedOption, setSelectedOption] = useState(userAnswer);
//   const [textAnswer, setTextAnswer] = useState(userAnswer);
//   const [isRecording, setIsRecording] = useState(false);

//   useEffect(() => {
//     setSelectedOption(userAnswer);
//     setTextAnswer(userAnswer);
//   }, [userAnswer]);

//   const handleOptionSelect = (option: string) => {
//     setSelectedOption(option);
//     if (mode === "quiz" || mode === "practice") {
//       onAnswer?.(option);
//     }
//   };

//   const handleTextChange = (text: string) => {
//     setTextAnswer(text);
//     if (mode === "quiz" || mode === "practice") {
//       onAnswer?.(text);
//     }
//   };

//   const toggleRecording = () => {
//     const newRecordingState = !isRecording;
//     setIsRecording(newRecordingState);
//     onRecord?.(newRecordingState);
//   };

//   const clearAnswer = () => {
//     setSelectedOption("");
//     setTextAnswer("");
//     onAnswer?.("");
//   };

//   const isPreview = mode === "preview";
//   const showProgress = mode === "quiz" || mode === "preview";

//   return (
//     <div className="w-full max-w-2xl mx-auto bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-lg border border-blue-100/50 overflow-hidden h-[70vh] flex flex-col backdrop-blur-sm">

//       <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-5 py-3 border-b border-blue-200/50">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
           
//               <div className={`w-3 h-3 rounded-full ${
//                 mode === "quiz" ? "bg-red-500 animate-pulse" : 
//                 mode === "preview" ? "bg-blue-500" : "bg-green-500"
//               }`} />
//             <div className="text-sm font-xl bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
//               {showProgress ? (
//                 <span>Question {currentQuestion} of {totalQuestions}</span>
//               ) : (
//                 <span>Q{currentQuestion}</span>
//               )}
//             </div>
//           </div>

//           {isPreview && score !== undefined && (
//             <div className={`px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${score >= 8 ? "from-emerald-500 to-green-500 text-white" :
//                 score >= 5 ? "from-amber-500 to-orange-500 text-white" :
//                   "from-rose-500 to-pink-500 text-white"
//               } shadow-sm`}>
//               {score}/10
//             </div>
//           )}
//         </div>

//         {showProgress && (
//           <div className="mt-2">
//             <div className="w-full bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
//               <div
//                 className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out shadow-sm"
//                 style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
//               />
//             </div>
//           </div>
//         )}
//       </div>

//       <div className="flex-1 overflow-y-auto p-5">
//         <div className="mb-4 p-4 bg-white/50 rounded-xl border border-blue-100/30 shadow-sm">
//           <h2 className="text-base font-semibold text-slate-800 leading-relaxed bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
//             {questionText}
//           </h2>
//         </div>

        

//         {/* Attractive Multiple Choice Options */}
//         {questionType === "multiple-choice" && options.length > 0 && (
//           <div className="space-y-2 mb-4">
//             {options.map((option, index) => {
//               const isSelected = selectedOption === option;
//               const isCorrect = isPreview && option === correctAnswer;
//               const isWrong = isPreview && isSelected && option !== correctAnswer;

//               return (
//                 <button
//                   key={index}
//                   onClick={() => handleOptionSelect(option)}
//                   disabled={isPreview}
//                   className={`w-full p-3 text-left rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] ${isCorrect ? "border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 shadow-sm" :
//                       isWrong ? "border-rose-300 bg-gradient-to-r from-rose-50 to-pink-50 shadow-sm" :
//                         isSelected ? "border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md" :
//                           "border-slate-200 bg-white/80 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm"
//                     } ${isPreview ? "cursor-default" : "cursor-pointer"}`}
//                 >
//                   <div className="flex items-center">
//                     <span className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-bold mr-3 transition-all ${isCorrect ? "border-emerald-500 bg-emerald-100 text-emerald-700 shadow-sm" :
//                         isWrong ? "border-rose-500 bg-rose-100 text-rose-700 shadow-sm" :
//                           isSelected ? "border-blue-500 bg-blue-100 text-blue-700 shadow-sm" :
//                             "border-slate-300 bg-slate-100 text-slate-600"
//                       }`}>
//                       {String.fromCharCode(65 + index)}
//                     </span>
//                     <span className="text-slate-700 text-sm font-medium">{option}</span>
//                   </div>
//                 </button>
//               );
//             })}
//           </div>
//         )}
        
//         {questionType === "descriptive" && (
//           <div className="mb-4">
//             <textarea
//               value={textAnswer}
//               onChange={(e) => handleTextChange(e.target.value)}
//               disabled={isPreview}
//               placeholder="Type your answer here..."
//               className="w-full h-20 p-3 border-2 border-slate-200 rounded-xl resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50 disabled:bg-slate-100/50 disabled:cursor-not-allowed text-slate-700 text-sm bg-white/80 shadow-sm transition-all duration-200"
//             />
//           </div>
//         )}
//         {(selectedOption || textAnswer) && (
//           <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 shadow-sm">
//             <div className="flex items-center justify-between">
//               <div className="flex-1 min-w-0">
//                 <p className="text-slate-800 text-sm font-medium truncate">{selectedOption || textAnswer}</p>
//               </div>
//               {(mode === "quiz" || mode === "practice") && (
//                 <button
//                   onClick={clearAnswer}
//                   className="text-blue-600 hover:text-blue-800 text-xs font-medium ml-2 px-2 py-1 rounded-lg bg-white/50 hover:bg-white/80 transition-all"
//                 >
//                   Clear
//                 </button>
//               )}
//             </div>
//           </div>
//         )}


//         {(mode === "quiz" || mode === "practice") && questionType === "descriptive" && (
//           <div className="mb-4 flex justify-center">
//             <button
//               onClick={toggleRecording}
//               className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 shadow-lg ${isRecording
//                   ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-200"
//                   : "bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-slate-200 hover:shadow-slate-300"
//                 }`}
//             >
//               {isRecording ? (
//                 <>
//                   <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
//                   <span>Stop Recording</span>
//                 </>
//               ) : (
//                 <>
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
//                   </svg>
//                   <span>Record Answer</span>
//                 </>
//               )}
//             </button>
//           </div>
//         )}

//         {isPreview && (
//           <div className="space-y-3">
//             {correctAnswer && (
//               <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-200/50 shadow-sm">
//                 <p className="text-xs font-semibold text-emerald-800 mb-2">Correct answer : {correctAnswer}</p>
//               </div>
//             )}

//             {explanation && (
//               <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-200/50 shadow-sm">
//                 <p className="text-xs font-semibold text-blue-800 mb-2">Explanation : {explanation}</p>
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {(mode === "quiz" || mode === "preview") && onNext && (
//         <div className="border-t border-blue-200/30 p-4 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
//           <div className="flex justify-end">
//             <button
//               onClick={onNext}
//               className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm"
//             >
//               {currentQuestion === totalQuestions ? "Complete" : "Continue →"}
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }






"use client";
import { useState, useEffect } from "react";

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
  timeSettings
}: QuestionProps) {
  const [selectedOption, setSelectedOption] = useState(userAnswer);
  const [textAnswer, setTextAnswer] = useState(userAnswer);
  const [isRecording, setIsRecording] = useState(false);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(timeSettings?.questionTimeLimit || 0);
  const [totalTimeLeft, setTotalTimeLeft] = useState(
    timeSettings?.totalTimeLimit ? timeSettings.totalTimeLimit - (timeSettings.elapsedTotalTime || 0) : 0
  );

  // Sync with parent's userAnswer
  useEffect(() => {
    setSelectedOption(userAnswer);
    setTextAnswer(userAnswer);
  }, [userAnswer]);

  // Question timer
  useEffect(() => {
    if (mode !== "quiz" || !timeSettings?.questionTimeLimit) return;

    setQuestionTimeLeft(timeSettings.questionTimeLimit);
    const interval = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onNext?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion, mode, timeSettings?.questionTimeLimit, onNext]);

  // Total timer
  useEffect(() => {
    if (mode !== "quiz" || !timeSettings?.totalTimeLimit) return;

    const interval = setInterval(() => {
      setTotalTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onNext?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, timeSettings?.totalTimeLimit, onNext]);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    onAnswer?.(option);
  };

  const handleTextChange = (text: string) => {
    setTextAnswer(text);
    onAnswer?.(text);
  };

  const toggleRecording = () => {
    const newRecordingState = !isRecording;
    setIsRecording(newRecordingState);
    onRecord?.(newRecordingState);
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
  const showRecording = (mode === "quiz" || mode === "practice") && questionType === "descriptive";

  const hasQuestionTimer = timeSettings?.questionTimeLimit && mode === "quiz";
  const hasTotalTimer = timeSettings?.totalTimeLimit && mode === "quiz";

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-[70vh] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${
                mode === "quiz" ? "bg-red-500 animate-pulse" : 
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

          {/* Timers */}
          <div className="flex gap-4">
            {hasQuestionTimer && (
              <div className="text-sm font-mono font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                Q: {formatTime(questionTimeLeft)}
              </div>
            )}
            {hasTotalTimer && (
              <div className="text-sm font-mono font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                T: {formatTime(totalTimeLeft)}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Question Text */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 leading-relaxed">
            {questionText}
          </h2>
        </div>

        {/* Multiple Choice Options */}
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
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    isCorrect ? "border-green-300 bg-green-50" :
                    isWrong ? "border-red-300 bg-red-50" :
                    isSelected ? "border-blue-300 bg-blue-50" :
                    "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  } ${isPreview ? "cursor-default" : "cursor-pointer"}`}
                >
                  <div className="flex items-center">
                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold mr-4 ${
                      isCorrect ? "border-green-500 text-green-700 bg-green-100" :
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

        {/* Descriptive Answer */}
        {questionType === "descriptive" && (
          <div className="mb-6">
            <textarea
              value={textAnswer}
              onChange={(e) => handleTextChange(e.target.value)}
              disabled={isPreview}
              placeholder="Type your answer here..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 text-gray-700"
            />
          </div>
        )}

        {/* Current Answer Display */}
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
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Recording Button */}
        {showRecording && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isRecording 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "bg-gray-600 hover:bg-gray-700 text-white"
              }`}
            >
              {isRecording ? (
                <>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Stop Recording
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Record Answer
                </>
              )}
            </button>
          </div>
        )}

        {/* Preview Mode Information */}
        {isPreview && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
            {score !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700 text-sm font-medium">Score:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  score >= 8 ? "bg-green-100 text-green-800" :
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

      {/* Next Button */}
      {(mode === "quiz" || mode === "preview") && onNext && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onNext}
              disabled={!selectedOption && !textAnswer}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {currentQuestion === totalQuestions ? "Finish" : "Next"} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
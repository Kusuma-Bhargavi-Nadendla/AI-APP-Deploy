// "use client"
// import Question from "../../_components/QuizQuestion"
// export default function Test() {
//     return(
//         <div>
//         <h1>Hii</h1>
//         <Question
//             mode="quiz"
//             questionText="What is the capital of France?"
//             questionType="multiple-choice"
//             options={["London", "Paris", "Berlin", "Madrid"]}
//             currentQuestion={1}
//             totalQuestions={10}
//             onAnswer={(answer) => console.log(answer)}
//             onNext={() => console.log("Next question")}
//             onRecord={(recording) => console.log(recording)}
//         />
//         <Question
//             mode="preview"
//             questionText="What is the capital of France?"
//             questionType="multiple-choice"
//             options={["London", "Paris", "Berlin", "Madrid"]}
//             currentQuestion={1}
//             totalQuestions={10}
//             correctAnswer="Paris"
//             userAnswer="London"
//             score={0}
//             explanation="Paris has been the capital of France since the 12th century."
//             onNext={() => console.log("Next question")}
//         />
//         <Question
//             mode="practice"
//             questionText="Explain quantum computing in simple terms."
//             questionType="descriptive"
//             onAnswer={(answer) => console.log(answer)}
//             onRecord={(recording) => console.log(recording)}
//         />
//     </div>
//     )

// }











"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Question from "../../_components/QuizQuestion"
import { jwtDecode } from "jwt-decode";
 interface QuizLandingData {
  categoryTitle: string;
  subcategoryTitle: string;
  description: string;
  questionsCount?: number;
  timeLimit?: number;
  categoryId?:string;
}
interface QuizData {
    quizId: string;
    question: {
        questionId: string;
        questionText: string;
        options: string[];
        questionType: string;
        difficultyLevel: number;
    };
    currentQuestionNumber: number;
    timeSettings: {
        totalTimeEnabled: boolean;
        totalTimeLimit: number;
        questionTimeEnabled: boolean;
        questionTimeLimit: number;
    };
}

export default function QuizPage({
    userId,
    categoryId,
    categoryTitle,
    subcategoryTitle
}: {
    userId: string;
    categoryId: string;
    categoryTitle: string;
    subcategoryTitle: string;
}) {
    const router = useRouter();
    const [quizData, setQuizData] = useState<QuizData | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [userAnswer, setUserAnswer] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Starting quiz...");

    useEffect(() => {
        startQuiz();
    }, []);

    const startQuiz = async () => {
        try {
            setIsLoading(true);
            setStatusMessage("Preparing your quiz...");
            const token = localStorage.getItem('token')
            const quizId=localStorage.getItem('quizId')
            const decoded = jwtDecode<{ id: string }>(token??"");


            const storedData = localStorage.getItem(quizId??"");
            if (!storedData) throw new Error("Quiz data missing");

            const quizData: QuizLandingData = JSON.parse(storedData);
            const payload = {
                userId:decoded.id,
                categoryId:quizData.categoryId,
                categoryTitle:quizData.categoryTitle,
                subcategoryTitle:quizData.subcategoryTitle,
                questionsCount: 3,
                timeSettings: {
                    totalTimeEnabled: false,
                    totalTimeLimit: 300,
                    questionTimeEnabled: false,
                    questionTimeLimit: 30,
                }
            }
            console.log("Starting quiz with payload:", payload);

            const response = await fetch('http://localhost:5000/quiz/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });



            if (!response.ok) throw new Error('Failed to start quiz');

            const result = await response.json();
            const data = result.data;
            setQuizData(data);
            setCurrentQuestion(data.question);
            setIsLoading(false);
        } catch (error) {
            console.error('Error starting quiz:', error);
            setStatusMessage("Failed to start quiz. Please try again.");
        }
    };

    const handleAnswerSubmit = async (answer: string) => {
        if (!quizData || !currentQuestion || isSubmitting) return;

        setIsSubmitting(true);
        setStatusMessage("Evaluating your answer with AI...");

        try {
            const token = localStorage.getItem('token');
            const decoded = jwtDecode<{ id: string }>(token??"");
            const quizId=localStorage.getItem('quizId')


            const storedData = localStorage.getItem(quizId??"");
            if (!storedData) throw new Error("Quiz data missing");

            const quizStoredData: QuizLandingData = JSON.parse(storedData);
            const response = await fetch('http://localhost:5000/quiz/submit-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization':`Bearer ${token}` },
                body: JSON.stringify({
                    quizData: {
                        quizId: quizData.quizId,
                        userId:decoded.id,
                        categoryId:quizStoredData.categoryId,
                        categoryTitle:quizStoredData.categoryTitle,
                        subcategoryTitle:quizStoredData.subcategoryTitle,
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
                        current: quizData.currentQuestionNumber,
                        total: 3
                    },
                    timeSpent: 0 // You can implement time tracking if needed
                }),
            });

            if (!response.ok) throw new Error('Failed to submit answer');

            const res = await response.json();
            const result=res.data;



            if (result.quizCompleted) {
                router.push(`/quiz/results/${quizData.quizId}`);
            } else {
                setStatusMessage("Loading next question...");
                setCurrentQuestion(result.nextQuestion);
                setQuizData(prev => prev ? {
                    ...prev,
                    currentQuestionNumber: result.currentQuestionNumber
                } : null);
                setUserAnswer("");
                setStatusMessage("");
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            setStatusMessage("Failed to submit answer. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (userAnswer) {
            handleAnswerSubmit(userAnswer);
        }
    };

    const handleRecord = (isRecording: boolean) => {
        console.log('Recording:', isRecording);
    };

    if (isLoading || isSubmitting) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-lg text-gray-700 font-medium">{statusMessage}</div>
                    {isSubmitting && (
                        <div className="text-sm text-gray-500 mt-2">This may take a few seconds...</div>
                    )}
                </div>
            </div>
        );
    }

    if (!quizData || !currentQuestion) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-lg text-red-500 mb-4">Failed to load quiz</div>
                    <button
                        onClick={startQuiz}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <Question
                questionText={currentQuestion.questionText}
                questionType={currentQuestion.questionType.toLowerCase() as "multiple_choice" | "descriptive"}
                options={currentQuestion.options }
                mode="quiz"
                currentQuestion={quizData.currentQuestionNumber}
                totalQuestions={3}
                userAnswer={userAnswer}
                onAnswer={setUserAnswer}
                onNext={handleNext}
                onRecord={handleRecord}
                timeSettings={{
                    questionTimeLimit: quizData.timeSettings.questionTimeLimit,
                    totalTimeLimit: quizData.timeSettings.totalTimeLimit,
                }}
            />
        </div>
    );
}
"use client";

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import quizAnimation from "../../../public/preparingQuiz.json"

const Player = dynamic(
  () => import('@lottiefiles/react-lottie-player').then((mod) => mod.Player),
  { ssr: false }
);

export function PreparingQuizLoader() {
  return (
    <div className="text-center py-8">
      <Player
        autoplay
        loop
        src={quizAnimation}
        style={{ height: '600px', width: '600px' }} 
      />
      <motion.p 
        className="text-gray-600 font-medium text-xl mt-6"
        animate={{ 
          opacity: [0.5, 1, 0.5],
          scale: [0.98, 1, 0.98]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* 📝 Preparing your quiz questions... */}
      </motion.p>
    </div>
  );
}
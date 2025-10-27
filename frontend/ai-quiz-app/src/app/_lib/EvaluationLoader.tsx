"use client";

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import evaluatingAnimation from "../../../public/evaluatingResponse.json"

const Player = dynamic(
  () => import('@lottiefiles/react-lottie-player').then((mod) => mod.Player),
  { ssr: false }
);

export function EvaluatingQuizLoader() {
  return (
    <div className="text-center py-8 ">
      <Player
        autoplay
        loop
        src={evaluatingAnimation}
        style={{ height: '300px', width: '300px' }}
      />
      <motion.p 
        className="text-gray-600 font-medium text-xl mt-2"
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
        {/* 🧠  */}
        AI is evaluating, 
        just a few seconds...
      </motion.p>
    </div>
  );
}
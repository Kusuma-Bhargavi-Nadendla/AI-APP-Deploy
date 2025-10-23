

"use client";

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import searchingAnimation from "../../../public/loader.json"; 

const Player = dynamic(
  () => import('@lottiefiles/react-lottie-player').then((mod) => mod.Player),
  { ssr: false }
);

export function MagicSearchLoader() {
  return (
    <div className="text-center py-8">
      <Player
        autoplay
        loop
        src={searchingAnimation}
        style={{ height: '200px', width: '200px' }}
      />
      <motion.p 
        className="text-gray-600 font-medium text-lg mt-4"
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
        ⚡ Fetching best results for only you... 
      </motion.p>
    </div>
  );
}
"use client";

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import previewAnimation from "../../../public/previewLoading.json"

const Player = dynamic(
  () => import('@lottiefiles/react-lottie-player').then((mod) => mod.Player),
  { ssr: false }
);

export function PreviewQuizLoader() {
  return (
    <div className="text-center py-8">
      <Player
        autoplay
        loop
        src={previewAnimation}
        style={{ height: '350px', width: '350px' }}
      />
      
    </div>
  );
}
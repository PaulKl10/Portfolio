"use client";

import { useState, useRef, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function AudioToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio("/ambient.mp3");
      audio.loop = true;
      audio.volume = 0.2;
      audioRef.current = audio;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 glass p-3 hover:bg-white/10 transition-colors cursor-pointer"
      aria-label={isPlaying ? "Couper le son" : "Activer le son"}
    >
      {isPlaying ? (
        <Volume2 className="w-5 h-5 text-pulsar-blue" />
      ) : (
        <VolumeX className="w-5 h-5 text-text-secondary" />
      )}
    </button>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock, Play, Pause, RotateCcw } from "lucide-react";
import type { AgendaItem } from "@/app/actions/meetings";

interface Props {
  agenda: AgendaItem[];
}

export default function AgendaTimer({ agenda }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentItem = agenda[currentIndex];

  useEffect(() => {
    if (currentItem) {
      setTimeLeft(currentItem.duration_minutes * 60);
      setIsRunning(false);
    }
  }, [currentIndex, currentItem]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalSeconds = currentItem ? currentItem.duration_minutes * 60 : 1;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const isOvertime = timeLeft === 0;

  if (agenda.length === 0) return null;

  const circumference = 2 * Math.PI * 36; // radius = 36

  return (
    <div className="bg-neu-base rounded-2xl shadow-neu-convex p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} className="text-orange-400" />
        <h3 className="font-semibold text-gray-700 text-sm">Agenda Timer</h3>
        <span className="ml-auto text-xs text-gray-400">
          {currentIndex + 1} / {agenda.length}
        </span>
      </div>

      {/* Current agenda item */}
      <div className="text-center mb-4">
        <p className="text-sm font-medium text-gray-700 truncate px-2">
          {currentItem?.title}
        </p>
      </div>

      {/* Circular timer */}
      <div className="flex justify-center mb-4">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            {/* Background circle */}
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="6"
            />
            {/* Progress circle */}
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke={isOvertime ? "#ef4444" : progress > 80 ? "#f97316" : "#a855f7"}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (progress / 100) * circumference}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold tabular-nums ${isOvertime ? "text-red-500 animate-pulse" : "text-gray-700"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {isOvertime && (
        <p className="text-center text-xs text-red-500 font-semibold mb-3 animate-pulse">
          ⚠️ Quá thời gian!
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="p-2 text-gray-400 hover:text-gray-600 bg-neu-base shadow-neu-convex rounded-xl disabled:opacity-30 hover:shadow-neu-concave transition-all"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={() => setIsRunning((r) => !r)}
          className={`px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            isRunning
              ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
              : "bg-purple-100 text-purple-600 hover:bg-purple-200"
          }`}
        >
          {isRunning ? <><Pause size={14} /> Dừng</> : <><Play size={14} /> Bắt đầu</>}
        </button>

        <button
          onClick={() => {
            setIsRunning(false);
            setTimeLeft(currentItem ? currentItem.duration_minutes * 60 : 0);
          }}
          className="p-2 text-gray-400 hover:text-gray-600 bg-neu-base shadow-neu-convex rounded-xl hover:shadow-neu-concave transition-all"
        >
          <RotateCcw size={16} />
        </button>

        <button
          onClick={() => setCurrentIndex((i) => Math.min(agenda.length - 1, i + 1))}
          disabled={currentIndex === agenda.length - 1}
          className="p-2 text-gray-400 hover:text-gray-600 bg-neu-base shadow-neu-convex rounded-xl disabled:opacity-30 hover:shadow-neu-concave transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Agenda list */}
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {agenda.map((item, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-xs ${
              idx === currentIndex
                ? "bg-purple-50 text-purple-700 font-semibold"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
              idx === currentIndex ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {idx + 1}
            </span>
            <span className="truncate flex-1">{item.title}</span>
            <span className="flex-shrink-0 text-gray-400">{item.duration_minutes}p</span>
          </button>
        ))}
      </div>
    </div>
  );
}

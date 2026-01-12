import React, { useEffect } from 'react';

export default function AIInsight({
  insight,
  score
}: {
  insight: string;
  score: number;
}) {
  const clamp = Math.max(0, Math.min(100, Math.round(score)));
  const dashoffset = 220 - (220 * clamp) / 100;
  useEffect(() => {}, [clamp]);
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-purple-400 text-xl">✨</span>
        <h4 className="font-bold text-purple-200">Gemini Insight</h4>
      </div>
      <div className="flex items-start gap-4">
        <p className="text-gray-300 text-sm leading-relaxed flex-grow">{insight || 'Analyzing market trends...'}</p>
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20">
            <svg className="rotate-[-90deg]" width="80" height="80">
              <circle cx="40" cy="40" r="35" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke={clamp >= 70 ? '#00ff9d' : clamp >= 40 ? '#ffd166' : '#ff4d4d'}
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={220}
                strokeDashoffset={dashoffset}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">{clamp}</div>
          </div>
          <span className="text-xs text-gray-500 mt-1">Deal Score</span>
        </div>
      </div>
    </div>
  );
}

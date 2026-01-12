import React from 'react';

export default function BestDealCard({
  title,
  bestPrice,
  originalPrice,
  savingsAmount,
  savingsPercent,
  buyUrl
}: {
  title: string;
  bestPrice: number;
  originalPrice: number;
  savingsAmount: number;
  savingsPercent: number;
  buyUrl?: string;
}) {
  const isValid = !!buyUrl && /^https?:\/\//.test(buyUrl);
  return (
    <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10">
      <div className="absolute top-0 right-0 bg-cyan-400 text-[#0b0f1a] text-xs font-bold px-3 py-1 rounded-bl-xl">
        BEST PRICE
      </div>
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center">
          <span className="text-black font-bold">🛍️</span>
        </div>
        <div>
          <h3 className="font-bold text-lg text-white line-clamp-1">{title}</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-green-400">₹{bestPrice.toLocaleString('en-IN')}</span>
            <span className="text-sm text-gray-500 line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
          </div>
          <div className="inline-block mt-2 text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded">
            Save ₹{savingsAmount.toLocaleString('en-IN')} ({savingsPercent}%)
          </div>
        </div>
      </div>
      {isValid ? (
        <a
          href={buyUrl}
          target="_blank"
          rel="noreferrer"
          className="block w-full mt-6 bg-cyan-400 hover:bg-cyan-300 text-[#0b0f1a] font-bold py-3 rounded-xl text-center"
        >
          Buy Now →
        </a>
      ) : (
        <button
          disabled
          className="block w-full mt-6 bg-gray-600 text-white font-bold py-3 rounded-xl text-center cursor-not-allowed"
        >
          Buy Now →
        </button>
      )}
    </div>
  );
}

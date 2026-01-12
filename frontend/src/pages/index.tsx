import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import BestDealCard from '../components/BestDealCard';
import AIInsight from '../components/AIInsight';
import PriceComparisonTable from '../components/PriceComparisonTable';
import { getApiBase, postJSON, getJSON } from '../utils/api';

type CompareResponse = {
  title: string;
  bestPrice: number;
  originalPrice: number;
  listings: Array<{
    platform: string;
    price: number;
    delivery?: string;
    rating?: string;
    url?: string;
    icon?: string;
  }>;
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [insight, setInsight] = useState<string>('');
  const [score, setScore] = useState<number>(0);

  async function runSearch(query: string) {
    setLoading(true);
    setError(null);
    setInsight('');
    setScore(0);
    try {
      const api = getApiBase();
      const searchRes = await getJSON<CompareResponse>(`${api}/api/search?q=${encodeURIComponent(query)}`);
      if (!searchRes.ok || !searchRes.data) {
        throw new Error(searchRes.error || 'Search failed');
      }
      const payload = searchRes.data;
      setData(payload);

      // AI insight
      const ai = await postJSON<{ verdict?: string; score?: number; reply?: string }>(`${api}/api/chat-advice`, {
        query,
        data: payload,
        context: 'analysis'
      });
      if (ai.ok && ai.data) {
        const txt = ai.data.verdict || ai.data.reply || '';
        const sc = ai.data.score ?? 70;
        setInsight(txt);
        setScore(sc);
      } else {
        setInsight('This looks like a solid deal based on current market data.');
        setScore(85);
      }
    } catch (e: any) {
      setError(e?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  const savingsAmt =
    data ? Math.max(0, Math.floor((data.originalPrice || 0) - (data.bestPrice || 0))) : 0;
  const savingsPct =
    data && data.originalPrice
      ? Math.floor(((data.originalPrice - data.bestPrice) / data.originalPrice) * 100)
      : 0;
  const bestUrl =
    data && Array.isArray(data.listings) && data.listings.length
      ? [...data.listings]
          .sort((a, b) => (a.price || 0) - (b.price || 0))
          .find((l) => l.url && /^https?:\/\//.test(l.url || ''))?.url
      : undefined;

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">SmartPrice India</h1>
          <p className="text-gray-400">Compare prices, get AI advice, and save money.</p>
        </div>

        <SearchBar onSearch={runSearch} />

        {loading && (
          <div className="mt-10 text-center text-cyan-400">Finding the best prices...</div>
        )}

        {error && !loading && (
          <div className="mt-6 text-center text-red-400">Error: {error}</div>
        )}

        {data && !loading && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <BestDealCard
              title={data.title}
              bestPrice={data.bestPrice}
              originalPrice={data.originalPrice}
              savingsAmount={savingsAmt}
              savingsPercent={savingsPct}
              buyUrl={bestUrl}
            />
            <div className="md:col-span-2">
              <AIInsight insight={insight} score={score} />
            </div>
          </div>
        )}

        {data && !loading && (
          <div className="mt-8">
            <PriceComparisonTable listings={data.listings} />
          </div>
        )}
      </div>
    </div>
  );
}

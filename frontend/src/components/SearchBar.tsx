import React, { useState } from 'react';

export default function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        if (query) onSearch(query);
      }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What are you buying?"
          className="flex-1 px-4 py-3 rounded-xl bg-[#0f1624] border border-white/10 text-white outline-none"
        />
        <button className="px-5 py-3 rounded-xl bg-cyan-400 text-[#0b0f1a] font-bold">Search</button>
      </div>
    </form>
  );
}

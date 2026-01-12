import React from 'react';

type Listing = {
  platform: string;
  price: number;
  delivery?: string;
  rating?: string;
  url?: string;
  icon?: string;
};

export default function PriceComparisonTable({
  listings
}: {
  listings: Listing[];
}) {
  const sorted = [...listings].sort((a, b) => a.price - b.price);
  return (
    <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10">
      <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
        <h3 className="font-bold">Price Comparison</h3>
        <button className="text-sm text-gray-400 hover:text-cyan-400">Save Search</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-white/5">
              <th className="p-4">Store</th>
              <th className="p-4">Price</th>
              <th className="p-4 hidden sm:table-cell">Delivery</th>
              <th className="p-4 hidden sm:table-cell">Rating</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {sorted.map((item, index) => {
              const isLowest = index === 0;
              const validUrl = !!item.url && /^https?:\/\//.test(item.url);
              return (
                <tr key={`${item.platform}-${index}`} className={`border-b border-white/5 hover:bg-white/5 ${isLowest ? 'bg-green-400/5' : ''}`}>
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-lg">🏬</span>
                    </div>
                    <span className={`font-medium ${isLowest ? 'text-green-400' : 'text-gray-300'}`}>{item.platform}</span>
                    {isLowest && <span className="text-[10px] bg-green-400 text-black px-1.5 rounded font-bold ml-2">LOWEST</span>}
                  </td>
                  <td className="p-4 font-bold">₹{item.price.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-gray-400 hidden sm:table-cell text-sm">{item.delivery || 'Free Delivery'}</td>
                  <td className="p-4 hidden sm:table-cell">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <span className="text-sm text-white">{item.rating || '4.3'}</span> <span className="text-xs">★</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {validUrl ? (
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-cyan-400 text-sm font-medium hover:underline">
                        View ↗
                      </a>
                    ) : (
                      <span className="text-gray-500 text-sm">Unavailable</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

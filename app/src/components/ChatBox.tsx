'use client';

import { useState } from 'react';

export function ChatBox({ onSubmit, reasoning }: { onSubmit: (q: string) => void; reasoning?: string }) {
  const [value, setValue] = useState('');
  return (
    <div className="w-full max-w-3xl mx-auto p-3">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Describe what you're looking for (e.g., quiet Italian dinner under $30 near me)"
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          onClick={() => value.trim() && onSubmit(value.trim())}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          disabled={!value.trim()}
        >
          Search
        </button>
      </div>
      {reasoning && (
        <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
          <span className="font-semibold">Reasoning (brief): </span>
          {reasoning}
        </div>
      )}
    </div>
  );
}
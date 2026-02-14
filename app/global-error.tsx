'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="bg-slate-950">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Critical Error</h1>
            <p className="text-gray-400 mb-8">A critical error occurred in the application.</p>
            <button
              onClick={() => reset()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

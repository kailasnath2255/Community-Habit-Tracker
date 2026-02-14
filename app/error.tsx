'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-2">Something went wrong!</h1>
        <p className="text-muted-foreground mb-8">An unexpected error occurred. Please try again.</p>
        <button
          onClick={() => reset()}
          className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

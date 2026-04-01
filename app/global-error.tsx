"use client"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-foreground/60 text-sm tracking-widest">
              The void has consumed this path.
            </p>
            <button
              onClick={() => reset()}
              className="text-xs text-foreground/40 border border-foreground/20 px-4 py-2 hover:border-foreground/40 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

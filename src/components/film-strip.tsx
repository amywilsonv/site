type Frame = {
  n: string
  category?: string
  title?: string
}

// Each frame is w-52 (208px) + gap-1.5 (6px), with px-3 (12px) padding each side
// Each sprocket is w-3.5 (14px) + gap-2 (8px) = 22px
function sprocketCount(frameCount: number) {
  const contentWidth = frameCount * 208 + (frameCount - 1) * 6 + 24
  return Math.ceil(contentWidth / 22)
}

function SprocketRow({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 px-3 pointer-events-none select-none" style={{ width: "max-content" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-3.5 h-3.5 rounded-sm bg-zinc-800 shrink-0" />
      ))}
    </div>
  )
}

export function FilmStrip({ frames }: { frames: Frame[] }) {
  const count = sprocketCount(frames.length)

  return (
    <div
      className="bg-zinc-950 overflow-x-auto -mx-6 sm:-mx-10 lg:-mx-16"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <div style={{ width: "max-content" }}>
        <div className="pt-2 pb-1">
          <SprocketRow count={count} />
        </div>

        <div className="flex gap-1.5 px-3">
          {frames.map((frame) => (
            <div
              key={frame.n}
              className="w-52 h-64 shrink-0 bg-zinc-900 border border-zinc-800 flex flex-col justify-between p-4"
            >
              <span className="text-zinc-600 text-xs tabular-nums font-mono">{frame.n}</span>
              <p className="text-zinc-600 text-sm italic">Coming soon</p>
            </div>
          ))}
        </div>

        <div className="pt-1 pb-2">
          <SprocketRow count={count} />
        </div>
      </div>
    </div>
  )
}

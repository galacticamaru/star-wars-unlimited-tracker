export default function CardDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Back button placeholder */}
      <div className="h-9 w-32 bg-slate-200 rounded-md mb-6 animate-pulse" />

      <div className="flex flex-col gap-8 md:flex-row md:gap-12 animate-pulse">
        {/* Left: image column */}
        <div className="w-full md:w-[320px] md:flex-shrink-0 aspect-[2/3] bg-slate-200 rounded-lg" />

        {/* Right: metadata column */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Title + subtitle */}
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-32 bg-slate-200 rounded" />
          </div>
          {/* Badge row */}
          <div className="flex gap-1.5">
            <div className="h-5 w-16 bg-slate-200 rounded" />
            <div className="h-5 w-16 bg-slate-200 rounded" />
            <div className="h-5 w-20 bg-slate-200 rounded" />
          </div>
          {/* Stat chips */}
          <div className="flex gap-3">
            <div className="h-10 w-12 bg-slate-200 rounded-md" />
            <div className="h-10 w-12 bg-slate-200 rounded-md" />
            <div className="h-10 w-12 bg-slate-200 rounded-md" />
          </div>
          {/* Text box */}
          <div className="h-24 w-full bg-slate-200 rounded-md" />
          {/* Footer metadata */}
          <div className="space-y-1 mt-auto pt-3 border-t border-border">
            <div className="h-3 w-40 bg-slate-200 rounded" />
            <div className="h-3 w-40 bg-slate-200 rounded" />
            <div className="h-3 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-36 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

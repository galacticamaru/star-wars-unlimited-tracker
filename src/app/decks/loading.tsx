export default function DecksLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header row — mirrors DecksClient flex justify-between items-center mb-8 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-pulse">
        {/* Page heading placeholder — mirrors h1.text-3xl.font-bold (LCP element) */}
        <div className="h-9 w-36 bg-slate-200 rounded" />
        {/* Create deck form placeholder */}
        <div className="flex w-full sm:w-auto gap-2">
          <div className="h-10 flex-1 sm:w-64 bg-slate-200 rounded-md" />
          <div className="h-10 w-36 bg-slate-200 rounded-md" />
        </div>
      </div>

      {/* Deck list skeleton — mirrors .grid.gap-4 with individual deck rows */}
      <div className="grid gap-4 animate-pulse">
        {/* Each row mirrors: flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm"
          >
            <div className="space-y-2">
              {/* h2.text-xl.font-semibold placeholder */}
              <div className="h-6 w-48 bg-slate-200 rounded" />
              {/* "Last updated" line placeholder */}
              <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-16 bg-slate-200 rounded-md" />
              <div className="h-9 w-16 bg-slate-200 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

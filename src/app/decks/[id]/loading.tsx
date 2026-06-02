export default function DeckBuilderLoading() {
  return (
    <div className="flex h-[calc(100svh-56px)] overflow-hidden">
      {/* Left panel — mirrors deck-builder.tsx flex-1 flex flex-col overflow-hidden */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar skeleton — mirrors deck-builder.tsx border-b bg-white p-4 flex justify-between items-center shadow-sm */}
        <div className="border-b bg-white p-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4 flex-1 animate-pulse">
            {/* Deck name input placeholder */}
            <div className="h-8 w-64 bg-slate-200 rounded" />
            {/* Tab pills placeholder */}
            <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
              <div className="h-8 w-20 bg-slate-200 rounded" />
              <div className="h-8 w-20 bg-slate-200 rounded" />
              <div className="h-8 w-20 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-8 w-20 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-200 rounded" />
          </div>
        </div>

        {/* Content area — mirrors deck-builder.tsx flex-1 overflow-y-auto bg-slate-50 */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="flex flex-row gap-6 items-start">
              {/* Hover preview panel placeholder */}
              <div className="hidden md:block w-48 shrink-0">
                <div className="aspect-[2/3] bg-slate-200 rounded-lg" />
              </div>
              <div className="flex-1 space-y-8">
                {/* Leader + Base grid — mirrors deck-builder.tsx grid-cols-2 gap-6 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="h-3 w-12 bg-slate-200 rounded" />
                    <div className="aspect-[4/3] bg-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-8 bg-slate-200 rounded" />
                    <div className="aspect-[4/3] bg-slate-200 rounded-lg" />
                  </div>
                </div>
                {/* Card list area skeleton — full-coverage block mirroring divide-y card rows */}
                {/* This ensures the LCP candidate is a filled bg-slate-200 block rather than */}
                {/* the below-fold empty-state text paragraph (which was the recorded LCP element) */}
                <div className="bg-white border rounded-lg shadow-sm divide-y">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-4">
                      <div className="h-10 w-8 bg-slate-200 rounded shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                        <div className="h-3 w-20 bg-slate-200 rounded" />
                      </div>
                      <div className="h-6 w-12 bg-slate-200 rounded shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar skeleton — mirrors deck-sidebar.tsx w-80 bg-slate-50 border-l p-4 flex flex-col gap-4 */}
      <div className="w-80 bg-slate-50 border-l p-4 flex flex-col gap-4 animate-pulse">
        {/* Deck name placeholder */}
        <div className="h-7 w-40 bg-slate-200 rounded" />
        {/* Stats badge row placeholder */}
        <div className="h-5 w-32 bg-slate-200 rounded" />
        {/* Stat blocks */}
        <div className="h-24 bg-slate-200 rounded" />
        <div className="h-32 bg-slate-200 rounded" />
        <div className="h-16 bg-slate-200 rounded" />
        {/* Save buttons at bottom */}
        <div className="mt-auto pt-6 space-y-2">
          <div className="h-9 w-full bg-slate-200 rounded-md" />
          <div className="h-9 w-full bg-slate-200 rounded-md" />
        </div>
      </div>
    </div>
  );
}

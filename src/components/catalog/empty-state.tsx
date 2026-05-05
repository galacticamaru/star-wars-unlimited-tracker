export function EmptyState() {
  return (
    // Copy from UI-SPEC.md §Copywriting Contract
    <div className="flex flex-col items-center justify-center flex-1 py-24 gap-3 text-center">
      <p className="text-lg font-semibold font-heading">No matching cards</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Try adjusting your search or clearing a filter.
      </p>
    </div>
  );
}

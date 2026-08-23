export function getEdgeColor(kind: string, isSelected: boolean): string {
  if (isSelected) return '#f43f5e';
  switch (kind) {
    case 'data_flow': return '#c084fc';
    case 'sync_lock': return '#fbbf24';
    case 'context_signal': return '#22d3ee';
    default: return '#a1a1aa';
  }
}

export function getToolBannerColor(tool: string): string {
  switch (tool) {
    case 'goroutine': return 'bg-emerald-600/90';
    case 'channel': return 'bg-cyan-600/90';
    case 'mutex': return 'bg-amber-600/90';
    case 'rwmutex': return 'bg-orange-600/90';
    case 'waitgroup': return 'bg-blue-600/90';
    case 'select': return 'bg-purple-600/90';
    case 'context': return 'bg-teal-600/90';
    case 'cond': return 'bg-pink-600/90';
    case 'once': return 'bg-yellow-600/90';
    case 'atomic': return 'bg-lime-600/90';
    case 'connect': return 'bg-rose-600/90';
    default: return 'bg-zinc-800/90';
  }
}

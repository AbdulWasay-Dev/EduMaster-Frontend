export default function AIThinking({ message }: { message?: string } = {}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-[#FFF7ED] rounded-2xl rounded-tl-none border border-brand-200 w-fit">
      <span className="text-xs text-brand-700 font-medium">{message ?? 'AI is thinking'}</span>
      <div className="dot-pulse flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
      </div>
    </div>
  )
}

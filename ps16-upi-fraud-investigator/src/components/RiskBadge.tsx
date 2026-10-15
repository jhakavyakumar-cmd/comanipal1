export default function RiskBadge({ level }: { level: string }) {
  const cls =
    level === 'High Risk' ? 'bg-red-500/15 text-red-300 border-red-500/30' :
    level === 'Moderate Risk' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
    level === 'Low Risk' ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' :
    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  return <span className={`px-2 py-0.5 rounded-full border text-xs ${cls}`}>{level}</span>
}
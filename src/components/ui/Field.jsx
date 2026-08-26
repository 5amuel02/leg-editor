/**
 * Kumpulan kontrol form kecil yang dipakai berulang di panel properti:
 * label + slider, label + angka, label + select, dan pembungkus baris.
 */

export function FieldRow({ label, children, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {label && <span className="shrink-0 text-xs font-medium text-ink-500">{label}</span>}
      <div className="flex min-w-0 items-center gap-2">{children}</div>
    </div>
  )
}

export function SectionTitle({ children, right }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-ink-400">{children}</h3>
      {right}
    </div>
  )
}

export function NumberInput({ value, onChange, min, max, step = 1, suffix, className = '' }) {
  return (
    <div className={`flex items-center rounded-lg border border-ink-200 bg-white ${className}`}>
      <input
        type="number"
        value={Number.isFinite(value) ? Math.round(value * 100) / 100 : ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (!Number.isNaN(v)) onChange(v)
        }}
        className="h-8 w-full min-w-0 rounded-lg px-2 text-xs outline-none focus:ring-1 focus:ring-brand-400"
      />
      {suffix && <span className="pr-2 text-[10px] text-ink-400">{suffix}</span>}
    </div>
  )
}

export function SliderInput({ value, onChange, min = 0, max = 100, step = 1, showValue = true, suffix = '' }) {
  return (
    <div className="flex w-full items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-200"
      />
      {showValue && (
        <span className="w-10 shrink-0 text-right font-mono text-[11px] text-ink-500">
          {Math.round(value * 10) / 10}
          {suffix}
        </span>
      )}
    </div>
  )
}

export function Select({ value, onChange, options, className = '' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-8 rounded-lg border border-ink-200 bg-white px-2 text-xs outline-none focus:border-brand-400 ${className}`}
    >
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt : opt.label
        return (
          <option key={val} value={val}>
            {label}
          </option>
        )
      })}
    </select>
  )
}

export function ToggleGroup({ value, onChange, options, className = '' }) {
  return (
    <div className={`inline-flex rounded-lg bg-ink-100 p-0.5 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.label}
          onClick={() => onChange(opt.value)}
          className={`flex h-7 min-w-7 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium transition ${
            value === opt.value ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          {opt.icon || opt.label}
        </button>
      ))}
    </div>
  )
}

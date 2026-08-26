/**
 * Tombol serbaguna dengan beberapa varian.
 * Dipakai di seluruh aplikasi supaya gaya tombol konsisten.
 */
const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  // Varian terang untuk dipakai di atas latar berwarna brand (mis. hero dashboard).
  light: 'bg-white text-brand-700 hover:bg-brand-50 shadow-sm',
  secondary: 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50',
  ghost: 'text-ink-600 hover:bg-ink-100',
  subtle: 'bg-ink-100 text-ink-700 hover:bg-ink-200',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  dangerGhost: 'text-red-600 hover:bg-red-50',
}

const SIZES = {
  xs: 'h-7 px-2 text-xs gap-1',
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  active = false,
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      className={[
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'disabled:opacity-40 disabled:pointer-events-none focus:outline-none',
        'focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1',
        VARIANTS[variant],
        SIZES[size],
        active ? 'ring-2 ring-brand-500' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}

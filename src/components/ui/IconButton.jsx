/**
 * Tombol ikon persegi dengan tooltip sederhana (memakai atribut title
 * plus tooltip kustom agar terbaca di toolbar yang padat).
 */
export default function IconButton({
  label,
  active = false,
  danger = false,
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  const sizeClass = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-10 w-10' : 'h-9 w-9'

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={[
        'group relative inline-flex shrink-0 items-center justify-center rounded-lg transition-colors',
        'disabled:opacity-35 disabled:pointer-events-none focus:outline-none',
        'focus-visible:ring-2 focus-visible:ring-brand-400',
        sizeClass,
        danger ? 'text-red-600 hover:bg-red-50' : 'text-ink-600 hover:bg-ink-100',
        active ? 'bg-brand-100 text-brand-700 hover:bg-brand-100' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}

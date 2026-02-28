import React from 'react'

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  className = '',
  ...props
}) {
  const variantClass = variant === 'ghost' ? 'ghost' : variant === 'danger' ? 'danger' : ''
  const classes = `btn ${variantClass} ${className}`.trim()

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}

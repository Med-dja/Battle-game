'use client';

import { forwardRef } from 'react';
import clsx from 'clsx';

const Button = forwardRef(
  ({ className, children, variant = 'primary', size = 'md', disabled, loading, icon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center justify-center',
          {
            'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': variant === 'primary',
            'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400': variant === 'secondary',
            'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': variant === 'danger',
            'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500': variant === 'success',
            'px-3 py-2 text-sm': size === 'sm',
            'px-4 py-2': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
            'opacity-70 cursor-not-allowed': disabled || loading,
          },
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Chargement...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

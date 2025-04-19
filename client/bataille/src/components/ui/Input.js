'use client';

import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(({ className, error, label, icon, hint, required, ...props }, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full rounded-md border px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none',
            {
              'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500': !error,
              'border-red-500 focus:border-red-500 focus:ring-red-500': error,
              'pl-10': icon,
            },
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
      </div>
      {hint && !error && <p className="text-sm text-gray-500">{hint}</p>}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

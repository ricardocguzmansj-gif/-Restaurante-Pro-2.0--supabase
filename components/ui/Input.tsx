
import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  leftIcon,
  rightElement,
  className = '',
  containerClassName = '',
  id,
  ...props
}, ref) => {
  const inputId = id || props.name;

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            block w-full rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
            transition-all duration-200 sm:text-sm
            ${leftIcon ? 'pl-10' : 'pl-3'}
            ${rightElement ? 'pr-10' : 'pr-3'}
            ${error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
            ${props.disabled ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-900' : 'py-2.5'}
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500 animate-pulse">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

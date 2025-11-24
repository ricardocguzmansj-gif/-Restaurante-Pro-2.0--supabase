
import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg active:scale-95";
  
  const variants = {
    primary: "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500 focus:ring-offset-white dark:focus:ring-offset-gray-900 border border-transparent shadow-md hover:shadow-lg",
    secondary: "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-orange-500 focus:ring-offset-white dark:focus:ring-offset-gray-900 shadow-sm",
    outline: "bg-transparent text-orange-600 border border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 focus:ring-orange-500 focus:ring-offset-white dark:focus:ring-offset-gray-900",
    ghost: "bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500 focus:ring-offset-white dark:focus:ring-offset-gray-900",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 focus:ring-offset-white dark:focus:ring-offset-gray-900 shadow-md",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

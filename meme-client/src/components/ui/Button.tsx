import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  icon?: typeof LucideIcon;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'default',
  icon: Icon,
  isLoading,
  className = '',
  ...props
}) => {
  // const baseStyles = 'py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 font-semibold disabled:opacity-50';
  const baseStyles = 'rounded-lg transition-colors flex items-center justify-center font-semibold disabled:opacity-50';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 border border-gray-300 hover:border-gray-400',
    outline: 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50',
  };

  const sizes = {
    default: 'py-3 px-4 space-x-2',
    sm: 'py-2 px-3 text-sm space-x-1.5',
    lg: 'py-4 px-6 text-lg space-x-3',
    icon: 'p-2 aspect-square',
  };

  return (
    <button
      // className={`${baseStyles} ${variants[variant]} ${className}`}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
      ) : (
        <>
          {Icon && <Icon className="h-5 w-5" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
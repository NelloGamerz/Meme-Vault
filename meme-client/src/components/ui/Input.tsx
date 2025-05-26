import type React from "react"
import { forwardRef, type InputHTMLAttributes } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "../../hooks/utils" // Adjust the path as needed

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon
  error?: string
  rightElement?: React.ReactNode // Add this line to support the rightElement prop
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon: Icon, error, rightElement, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <input
            className={cn(
              "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
              Icon && "pl-10",
              rightElement && "pr-24", // Add padding when rightElement exists
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              className,
            )}
            ref={ref}
            {...props}
          />
          {rightElement && <div className="absolute inset-y-0 right-0 flex items-center pr-3">{rightElement}</div>}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  },
)

Input.displayName = "Input"

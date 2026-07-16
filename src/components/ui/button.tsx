import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-blue text-white hover:bg-blue-dark shadow-lg shadow-blue/25 hover:shadow-blue/40",
        secondary:
          "glass-card text-foreground hover:bg-white/10 border border-white/10",
        outline:
          "border-2 border-blue text-blue hover:bg-blue hover:text-white",
        ghost: "hover:bg-muted-bg text-foreground",
        green: "bg-green text-white hover:bg-green-light shadow-lg shadow-green/25",
        yellow: "bg-yellow text-black hover:bg-yellow-light shadow-lg shadow-yellow/25",
        red: "bg-red text-white hover:bg-red-light shadow-lg shadow-red/25",
        premium:
          "bg-gradient-to-r from-yellow via-green to-blue text-white hover:opacity-90 shadow-lg",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
        xl: "h-14 px-10 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, loadingText, children, disabled, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText || "Loading..."}
        </>
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };

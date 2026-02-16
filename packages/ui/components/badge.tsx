import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/90 text-primary-foreground hover:bg-primary shadow-sm",
        secondary: "border-transparent bg-secondary/80 text-secondary-foreground hover:bg-secondary shadow-sm",
        outline: "text-foreground border-border hover:bg-muted/50",
        success: "border-transparent bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm shadow-green-500/20 hover:shadow-md hover:shadow-green-500/30",
        danger: "border-transparent bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm shadow-red-500/20 hover:shadow-md hover:shadow-red-500/30",
        warning: "border-transparent bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20 hover:shadow-md hover:shadow-amber-500/30",
        info: "border-transparent bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30",
        purple: "border-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm shadow-purple-500/20 hover:shadow-md hover:shadow-purple-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={`${badgeVariants({ variant })} ${className || ""}`} {...props} />;
}

export { Badge, badgeVariants };

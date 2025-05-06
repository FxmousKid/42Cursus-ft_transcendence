import React from "react";
import "../../styles/button.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
  className?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const variantClasses = {
      default: "simple-btn",
      outline: "simple-btn-outline",
      ghost: "simple-button-ghost",
      destructive: "simple-btn-destructive"
    };

    const sizeClasses = {
      default: "",
      sm: "simple-btn-sm",
      lg: "simple-btn-lg"
    };

    const baseClassName = `${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    return (
      <button
        className={baseClassName}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };

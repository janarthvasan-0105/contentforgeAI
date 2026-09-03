import React from 'react';

export const Button = React.forwardRef(({ className = "", variant = "primary", size = "default", ...props }, ref) => {
    const baseStyle = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        outline: "border border-input hover:bg-gray-100/50 hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
    };
    const sizes = {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
    };
    return <button ref={ref} className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
});
Button.displayName = "Button";

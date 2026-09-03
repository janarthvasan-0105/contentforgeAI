import React from 'react';

export const Button = React.forwardRef(({ className = "", variant = "primary", size = "default", ...props }, ref) => {
    const baseStyle = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
    const variants = {
        primary: "bg-[#8763e5] text-white hover:bg-[#704ec2] shadow-md",
        secondary: "bg-neutral-50 text-gray-900 hover:bg-gray-200",
        outline: "border border-neutral-300 text-neutral-900 bg-white hover:bg-neutral-50 hover:text-neutral-900",
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

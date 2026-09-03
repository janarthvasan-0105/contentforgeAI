import React from 'react';

export const Input = React.forwardRef(({ className = "", ...props }, ref) => {
    return (
        <input
            className={`flex h-10 w-full rounded-md border border-gray-300 bg-transparent py-2 px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            ref={ref}
            {...props}
        />
    );
});
Input.displayName = "Input";

export const Textarea = React.forwardRef(({ className = "", ...props }, ref) => {
    return (
        <textarea
            className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            ref={ref}
            {...props}
        />
    );
});
Textarea.displayName = "Textarea";

export const Label = React.forwardRef(({ className = "", ...props }, ref) => (
    <label
        ref={ref}
        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
        {...props}
    />
));
Label.displayName = "Label";

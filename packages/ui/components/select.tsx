"use client";

import * as React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}>({});

const Select = ({ children, name, defaultValue, value, onChange }: SelectProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || value);
  const [isOpen, setIsOpen] = React.useState(false);
  
  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    setIsOpen(false);
  };
  
  return (
    <SelectContext.Provider value={{ value: internalValue as string, onValueChange: handleValueChange, isOpen, setIsOpen }}>
      <div className="relative">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, { name, onChange });
          }
          return child;
        })}
      </div>
    </SelectContext.Provider>
  );
};

export interface SelectTriggerProps extends Omit<React.HTMLAttributes<HTMLButtonElement>, 'onChange'> {
  name?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ children, className, name, onChange, ...props }, ref) => {
    const { value, isOpen, setIsOpen } = React.useContext(SelectContext);
    
    return (
      <>
        <button
          ref={ref}
          type="button"
          className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring ${className || ""}`}
          onClick={() => setIsOpen?.(!isOpen)}
          {...props}
        >
          {children}
        </button>
        {name && (
          <input type="hidden" name={name} value={value || ""} />
        )}
      </>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

export interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {}

const SelectValue = ({ className, ...props }: SelectValueProps) => {
  const { value } = React.useContext(SelectContext);
  return <span className={className} {...props}>{value}</span>;
};
SelectValue.displayName = "SelectValue";

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectContent = ({ children, className, ...props }: SelectContentProps) => {
  const { isOpen } = React.useContext(SelectContext);
  
  if (!isOpen) return null;
  
  return (
    <div
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-md ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
};
SelectContent.displayName = "SelectContent";

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ children, value, className, ...props }, ref) => {
    const { onValueChange } = React.useContext(SelectContext);
    
    return (
      <div
        ref={ref}
        className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-800 ${className || ""}`}
        onClick={() => onValueChange?.(value)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };

import * as React from "react"
import { createPortal } from "react-dom"

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface DropdownMenuContentProps {
  align?: "start" | "center" | "end";
  children: React.ReactNode;
}

interface DropdownMenuItemProps {
  onClick?: () => void;
  className?: string;
  asChild?: boolean;
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  return <div className="simple-dropdown">{children}</div>;
};

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ 
  asChild, 
  children,
  ...props
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const child = asChild ? 
    React.cloneElement(children as React.ReactElement, { 
      onClick: handleToggle,
      "data-state": isOpen ? "open" : "closed",
      ...props 
    }) : 
    <button 
      className="simple-dropdown-trigger" 
      onClick={handleToggle}
      {...props}
    >
      {children}
    </button>;

  return child;
};

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  align = "center", 
  children 
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const alignClass = `simple-dropdown-content-${align}`;

  return createPortal(
    <div 
      ref={ref}
      className={`simple-dropdown-content ${alignClass} ${isOpen ? 'open' : ''}`}
    >
      {children}
    </div>,
    document.body
  );
};

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  onClick, 
  className = "", 
  asChild, 
  children,
  ...props
}) => {
  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      className: `simple-dropdown-item ${className}`,
      ...props
    });
  }

  return (
    <div 
      className={`simple-dropdown-item ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

import React from 'react';

/**
 * Standardized footer component to be used across the entire application
 */
const Footer: React.FC = () => {
  return (
    <footer className="py-6 px-4 mt-auto border-t border-border/10 bg-card/20 backdrop-blur-sm">
      <div className="container mx-auto">
        <div className="flex justify-center items-center">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} 42-transcendence. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
import React from 'react';

interface FullScreenModalLayoutProps {
  isOpen: boolean;
  systemBar: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export const FullScreenModalLayout: React.FC<FullScreenModalLayoutProps> = ({
  isOpen,
  systemBar,
  sidebar,
  children
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1000] flex flex-col pointer-events-auto bg-background text-foreground animate-fade-in font-sans overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {systemBar}
      <div className="flex-1 relative flex overflow-hidden min-h-0">
        {sidebar}
        {children}
      </div>
    </div>
  );
};

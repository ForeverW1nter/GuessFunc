import React from 'react';
import { useUIStore } from '../../../store/useUIStore';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-4 sm:right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-[calc(100vw-32px)] sm:w-full max-w-sm">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        
        return (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 bg-card text-foreground rounded-xl shadow-toast dark:shadow-toast-dark border-l-4 transition-all duration-300
              ${toast.isExiting ? 'opacity-0 translate-x-full scale-95' : 'animate-slide-in-right opacity-100 translate-x-0 scale-100'}
              ${isSuccess ? 'border-app-success' : isError ? 'border-app-danger' : 'border-primary'}
              dark:border-y dark:border-r dark:border-y-card-border dark:border-r-card-border
            `}
          >
            <div className={`flex items-center justify-center shrink-0
              ${isSuccess ? 'text-app-success' : isError ? 'text-app-danger' : 'text-primary'}
            `}>
              {isSuccess ? <CheckCircle size={24} /> : isError ? <AlertCircle size={24} /> : <Info size={24} />}
            </div>
            
            <div className="flex-1 font-medium text-sm leading-snug">
              {toast.message}
            </div>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="bg-transparent border-none text-foreground opacity-40 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer p-1 -m-1 -mr-1 rounded flex items-center justify-center transition-all shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
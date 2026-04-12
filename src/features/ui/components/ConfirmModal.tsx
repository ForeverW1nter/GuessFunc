import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  requireInput?: string; // If provided, user must type this exact text to confirm
  onConfirm: (e?: React.MouseEvent) => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText: propConfirmText,
  cancelText: propCancelText,
  requireInput,
  onConfirm,
  onCancel
}) => {
  const { t } = useTranslation();
  const confirmText = propConfirmText ?? t('common.confirm');
  const cancelText = propCancelText ?? t('common.cancel');
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmDisabled = requireInput ? inputValue !== requireInput : false;

  const handleConfirm = (e: React.MouseEvent) => {
    if (isConfirmDisabled) return;
    
    // Calculate precise position of the button relative to viewport
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    
    // Pass the calculated position back
    onConfirm({ clientX: x, clientY: y } as unknown as React.MouseEvent);
    setInputValue('');
  };

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onCancel();
    setInputValue('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && (!requireInput || inputValue === requireInput)) {
      onConfirm();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return createPortal(
    <div className="fixed top-0 left-0 w-full h-full z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4" onClick={onCancel}>
      <div 
        className="bg-background text-foreground w-full max-w-md rounded-2xl shadow-modal overflow-hidden animate-zoom-in"
        onClick={handleClick}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-3">{title}</h2>
          <div className="text-base opacity-80 mb-6 whitespace-pre-wrap">{message}</div>
          
          {requireInput && (
            <div className="mb-6">
              <p className="text-sm opacity-70 mb-2">{t('common.confirmInputTip')}<span className="font-mono font-bold text-app-danger select-all">{requireInput}</span></p>
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder={t('common.confirmInputPlaceholder')}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button 
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl font-medium border border-border bg-card hover:bg-card-hover transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
                isConfirmDisabled 
                  ? 'bg-primary/50 text-white cursor-not-allowed' 
                  : requireInput 
                    ? 'bg-app-danger text-white hover:bg-app-danger/90'
                    : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

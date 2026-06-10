import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../../store/useUIStore';
import { cn } from '../../../utils/cn';

export const GlobalDialog: React.FC = () => {
  const { t } = useTranslation();
  const { dialog, closeDialog } = useUIStore();
  const [inputValue, setInputValue] = useState('');
  const [lastDialogId, setLastDialogId] = useState<string | null>(null);
  
  // Update input value when dialog opens
  const currentDialogId = dialog?.isOpen ? `${dialog.type}-${dialog.message}` : null;
  if (currentDialogId !== lastDialogId) {
    setLastDialogId(currentDialogId);
    if (dialog?.isOpen && dialog.type === 'prompt') {
      setInputValue(dialog.defaultValue || '');
    }
  }

  if (!dialog) return null;

  const handleConfirm = () => {
    closeDialog();
    if (dialog.onConfirm) {
      if (dialog.type === 'prompt') {
        dialog.onConfirm(inputValue);
      } else {
        dialog.onConfirm();
      }
    }
  };

  const handleCancel = () => {
    closeDialog();
    if (dialog.onCancel) {
      dialog.onCancel();
    }
  };

  const isVisible = dialog.isOpen;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 sm:p-4",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={dialog.type !== 'alert' ? handleCancel : undefined}
    >
      <div
        className={cn(
          "bg-app-bg border-none sm:border border-app-border sm:rounded-xl shadow-2xl w-full h-full sm:h-auto sm:max-w-md p-6 flex flex-col gap-4 transform transition-all duration-300 sm:m-4",
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {dialog.title && (
          <h2 className="text-xl font-bold text-app-text">{dialog.title}</h2>
        )}
        
        <p className="text-app-text-secondary whitespace-pre-wrap">{dialog.message}</p>
        
        {dialog.type === 'prompt' && (
          <input
            type="text"
            className="w-full bg-app-bg border border-app-border rounded-lg px-4 py-2 text-app-text focus:outline-none focus:border-app-primary focus:ring-1 focus:ring-app-primary transition-all"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
          />
        )}
        
        <div className="flex justify-end gap-3 mt-4">
          {dialog.type !== 'alert' && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg text-app-text-secondary hover:bg-app-border/50 transition-colors"
            >
              {dialog.cancelText || t('common.cancel')}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-app-primary text-white hover:brightness-110 transition-all active:scale-95"
          >
            {dialog.confirmText || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

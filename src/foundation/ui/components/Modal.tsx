import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'default' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  hideFooter?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  variant = 'default',
  confirmLabel,
  cancelLabel,
  onConfirm,
  hideFooter = false,
}: ModalProps) => {
  const { t } = useTranslation();
  const isDanger = variant === 'danger';
  const finalConfirmLabel = confirmLabel || t('common.confirm', 'Confirm');
  const finalCancelLabel = cancelLabel || t('common.cancel', 'Cancel');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 10 }} 
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative bg-[var(--color-muted)] border border-[var(--color-border)] p-6 md:p-8 rounded-3xl shadow-2xl max-w-md w-full"
          >
            <div className={`flex items-center gap-3 mb-4 ${isDanger ? 'text-red-500' : 'text-[var(--color-foreground)]'}`}>
              {icon ? icon : (isDanger && <AlertTriangle size={24} />)}
              <h3 className="text-xl font-display uppercase tracking-tight text-balance">{title}</h3>
            </div>
            
            {description && (
              <p className="text-sm text-[var(--color-muted-foreground)] mb-8 leading-relaxed text-balance">
                {description}
              </p>
            )}

            {children && (
              <div className="mb-8">
                {children}
              </div>
            )}

            {!hideFooter && (
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={onClose}>
                  {finalCancelLabel}
                </Button>
                {onConfirm && (
                  <Button variant={isDanger ? 'danger' : 'primary'} onClick={onConfirm}>
                    {finalConfirmLabel}
                  </Button>
                )}
              </div>
            )}
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors rounded-full hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

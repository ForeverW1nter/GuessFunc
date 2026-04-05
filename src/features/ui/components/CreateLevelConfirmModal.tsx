import React from 'react';
import katex from 'katex';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from './ConfirmModal';

interface CreateLevelConfirmModalProps {
  isOpen: boolean;
  createPreview: { latex: string; params: Record<string, number> };
  onConfirm: () => void;
  onCancel: () => void;
}

export const CreateLevelConfirmModal: React.FC<CreateLevelConfirmModalProps> = ({
  isOpen,
  createPreview,
  onConfirm,
  onCancel
}) => {
  const { t } = useTranslation();

  return (
    <ConfirmModal 
      isOpen={isOpen}
      title={t('sidebar.confirmCreateTitle')}
      message={
        <div className="flex flex-col gap-4">
          <p>{t('sidebar.confirmCreateDesc')}</p>
          <div 
            className="bg-card-bg border border-card-border p-3 rounded-lg overflow-x-auto font-math text-center text-lg"
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(
                /[=<>≤≥]|\\le|\\ge/.test(createPreview.latex) 
                  ? createPreview.latex 
                  : `f(x) = ${createPreview.latex}`, 
                { throwOnError: false }
              )
            }}
          />
          {Object.keys(createPreview.params).length > 0 && (
            <>
              <p className="mt-2">{t('sidebar.validParams')}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(createPreview.params).map(([key, val]) => (
                  <div key={key} className="bg-[rgba(var(--primary-color-rgb),0.1)] text-app-primary px-3 py-1 rounded-md font-math flex items-center gap-2 border border-[rgba(var(--primary-color-rgb),0.2)]">
                    <span dangerouslySetInnerHTML={{ __html: katex.renderToString(`${key} = ${val}`, { throwOnError: false }) }} />
                  </div>
                ))}
              </div>
              <p className="text-sm text-app-text/60 mt-2">
                {t('sidebar.paramsNote1')}
              </p>
            </>
          )}
          {Object.keys(createPreview.params).length === 0 && (
            <p className="text-sm text-app-text/60 mt-2">
              {t('sidebar.paramsNote2')}
            </p>
          )}
        </div>
      }
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmText={t('sidebar.confirmCreateBtn')}
    />
  );
};

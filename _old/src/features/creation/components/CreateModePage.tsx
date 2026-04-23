import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useUIStore } from '../../../store/useUIStore';
import { Share2, PenTool, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { extractUsedParams } from '../../../utils/mathEngine';
import { SYSTEM_LOGS } from '../../../utils/systemLogs';

export const CreateModePage: React.FC = () => {
  const { t } = useTranslation();
  const { addToast } = useUIStore();
  const navigate = useNavigate();
  const [funcInput, setFuncInput] = useState('x^2 + 2x + 1');
  const [titleInput, setTitleInput] = useState(t('create.defaultTitle'));
  const [descInput, setDescInput] = useState(t('create.defaultDesc'));
  const [copied, setCopied] = useState(false);

  const levelData = { 
    t: funcInput,
    p: extractUsedParams(funcInput, {}) // We can pass empty object for playerParams, but ideally we'd pass any active custom params if supported in UI
  };
  const encoded = btoa(encodeURIComponent(JSON.stringify(levelData)));
  const generatedUrl = `${window.location.origin}${window.location.pathname}#/game/custom/1/${encoded}?title=${encodeURIComponent(titleInput)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      addToast(t('create.copySuccess'), 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
        console.error(SYSTEM_LOGS.ERROR_GLOBAL_REPORT_FAILED, error);
        addToast(t('create.copyError'), 'error');
    }
  };

  const handleTestPlay = () => {
    navigate(`/game/custom/1/${encoded}?title=${encodeURIComponent(titleInput)}`);
  };

  return (
    <div className="absolute inset-0 z-20 flex-1 h-full bg-background flex flex-col p-6 overflow-y-auto custom-scrollbar animate-fade-in">
      <div className="max-w-3xl w-full mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <PenTool size={32} className="text-primary" />
          <h1 className="m-0 text-3xl font-bold text-foreground">{t('sidebar.freeCreateMode')}</h1>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="space-y-2">
            <label className="font-semibold text-foreground text-lg">{t('create.targetFuncLabel')}</label>
            <input 
              type="text" 
              value={funcInput}
              onChange={(e) => setFuncInput(e.target.value)}
              className="w-full bg-background border-2 border-border text-foreground px-4 py-3 rounded-xl focus:border-primary outline-none transition-colors text-lg font-mono"
              placeholder={t('create.targetFuncPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-foreground text-lg">{t('create.levelTitleLabel')}</label>
            <input 
              type="text" 
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full bg-background border-2 border-border text-foreground px-4 py-3 rounded-xl focus:border-primary outline-none transition-colors text-base"
            />
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-foreground text-lg">{t('create.levelDescLabel')}</label>
            <textarea 
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              rows={3}
              className="w-full bg-background border-2 border-border text-foreground px-4 py-3 rounded-xl focus:border-primary outline-none transition-colors text-base resize-none"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              onClick={handleTestPlay}
              className="flex-1 bg-transparent border-2 border-primary text-primary font-bold py-3 rounded-xl hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
            >
              {t('create.testPlayBtn')}
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Share2 size={24} className="text-app-success" />
            <h2 className="m-0 text-2xl font-bold text-foreground">{t('create.shareTitle')}</h2>
          </div>
          <p className="text-base opacity-80 text-foreground m-0">
            {t('create.shareDesc')}
          </p>
          
          <div className="flex items-center gap-3 bg-background p-4 rounded-xl border-2 border-border">
            <span className="flex-1 font-mono text-sm opacity-70 truncate select-all">
              {generatedUrl}
            </span>
            <button 
              onClick={handleCopy}
              className="shrink-0 w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center hover:brightness-110 transition-all shadow-btn"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

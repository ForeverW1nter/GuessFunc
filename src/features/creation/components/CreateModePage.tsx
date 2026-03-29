import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useUIStore } from '../../../store/useUIStore';
import { Share2, PenTool, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CreateModePage: React.FC = () => {
  const { t } = useTranslation();
  const { addToast } = useUIStore();
  const navigate = useNavigate();
  const [funcInput, setFuncInput] = useState('x^2 + 2x + 1');
  const [titleInput, setTitleInput] = useState(t('create.defaultTitle', '我的自定义关卡'));
  const [descInput, setDescInput] = useState(t('create.defaultDesc', '来看看你能否猜出这个函数！'));
  const [copied, setCopied] = useState(false);

  const generatedUrl = `${window.location.origin}${window.location.pathname}#/game/custom/1/1?target=${encodeURIComponent(funcInput)}&title=${encodeURIComponent(titleInput)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      addToast(t('create.copySuccess', '复制成功！'), 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
      addToast(t('create.copyError', '复制失败'), 'error');
    }
  };

  const handleTestPlay = () => {
    navigate(`/game/custom/1/1?target=${encodeURIComponent(funcInput)}`);
  };

  return (
    <div className="absolute inset-0 z-20 flex-1 h-full bg-app-bg flex flex-col p-6 overflow-y-auto custom-scrollbar animate-fade-in">
      <div className="max-w-3xl w-full mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <PenTool size={32} className="text-app-primary" />
          <h1 className="m-0 text-3xl font-bold text-app-text">{t('sidebar.freeCreateMode', '自由创作')}</h1>
        </div>

        <div className="bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="space-y-2">
            <label className="font-semibold text-app-text text-lg">{t('create.targetFuncLabel', '目标函数表达式 (LaTeX 或纯文本)')}</label>
            <input 
              type="text" 
              value={funcInput}
              onChange={(e) => setFuncInput(e.target.value)}
              className="w-full bg-app-bg border-2 border-card-border text-app-text px-4 py-3 rounded-xl focus:border-app-primary outline-none transition-colors text-lg font-mono"
              placeholder={t('create.targetFuncPlaceholder', '例如: \\sin(x) * x^2')}
            />
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-app-text text-lg">{t('create.levelTitleLabel', '关卡标题')}</label>
            <input 
              type="text" 
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full bg-app-bg border-2 border-card-border text-app-text px-4 py-3 rounded-xl focus:border-app-primary outline-none transition-colors text-base"
            />
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-app-text text-lg">{t('create.levelDescLabel', '关卡描述')}</label>
            <textarea 
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              rows={3}
              className="w-full bg-app-bg border-2 border-card-border text-app-text px-4 py-3 rounded-xl focus:border-app-primary outline-none transition-colors text-base resize-none"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              onClick={handleTestPlay}
              className="flex-1 bg-transparent border-2 border-app-primary text-app-primary font-bold py-3 rounded-xl hover:bg-app-primary/10 transition-all flex items-center justify-center gap-2"
            >
              {t('create.testPlayBtn', '试玩此关卡')}
            </button>
          </div>
        </div>

        <div className="bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Share2 size={24} className="text-app-success" />
            <h2 className="m-0 text-2xl font-bold text-app-text">{t('create.shareTitle', '分享你的关卡')}</h2>
          </div>
          <p className="text-base opacity-80 text-app-text m-0">
            {t('create.shareDesc', '复制下方链接发送给你的朋友，他们就可以直接挑战你设计的函数了！')}
          </p>
          
          <div className="flex items-center gap-3 bg-app-bg p-4 rounded-xl border-2 border-card-border">
            <span className="flex-1 font-mono text-sm opacity-70 truncate select-all">
              {generatedUrl}
            </span>
            <button 
              onClick={handleCopy}
              className="shrink-0 w-10 h-10 bg-app-primary text-white rounded-lg flex items-center justify-center hover:brightness-110 transition-all shadow-btn"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

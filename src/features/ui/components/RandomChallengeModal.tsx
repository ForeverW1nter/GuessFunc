import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useUIStore } from '../../../store/useUIStore';
import { useGameStore } from '../../../store/useGameStore';
import { useNavigate } from 'react-router-dom';
import { generateFunctionByDifficulty } from '../../../utils/mathEngine/generator';
import { aiManager } from '../../../utils/aiManager';

export const RandomChallengeModal: React.FC = () => {
  const { t } = useTranslation();
  const { isRandomChallengeOpen, setRandomChallengeOpen } = useUIStore();
  const { setTargetFunction } = useGameStore();
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState<number>(1.5);
  const [useAI, setUseAI] = useState<boolean>(false); // 默认不使用AI
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isRandomChallengeOpen) return null;

  const handleClose = () => {
    if (!isGenerating) {
      setRandomChallengeOpen(false);
    }
  };

  const handleStart = async () => {
    let targetFunc = '';
    
    if (useAI) {
      if (!aiManager.hasValidKey()) {
        useUIStore.getState().addToast(t('random.noApiKey', '未配置 AI API Key，请在设置中配置后再使用 AI 生成'), 'error');
        return;
      }
      setIsGenerating(true);
      const aiResult = await aiManager.fetchFunction(difficulty);
      setIsGenerating(false);
      
      if (aiResult) {
        targetFunc = aiResult;
      } else {
        useUIStore.getState().addToast(t('random.aiFailedFallback', 'AI 生成失败，已回退到本地生成算法'), 'error');
        targetFunc = generateFunctionByDifficulty(difficulty);
      }
    } else {
      // 使用本地算法生成基于难度系数的函数
      targetFunc = generateFunctionByDifficulty(difficulty);
    }
    
    setTargetFunction(targetFunc, {}, 'random');
    navigate('/game/random/1/1');
    setRandomChallengeOpen(false);
    useUIStore.getState().addToast(t('random.generatedSuccess', '已生成难度为 {{diff}} 的挑战！', { diff: difficulty.toFixed(2) }), 'success');
  };

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center items-center pointer-events-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full h-full md:h-auto md:max-w-[450px] bg-modal-bg text-modal-text md:rounded-[16px] shadow-modal overflow-hidden border-none md:border md:border-card-border flex flex-col animate-zoom-in md:m-4">
        {/* Header */}
        <div className="flex items-center justify-between h-[64px] px-[24px] border-b border-card-border bg-app-bg shrink-0">
          <h2 className="m-0 text-[1.25rem] font-semibold text-app-text">{t('random.title')}</h2>
          <button
            onClick={handleClose}
            className="w-[40px] h-[40px] flex items-center justify-center text-app-text opacity-50 hover:opacity-100 hover:bg-[rgba(128,128,128,0.1)] hover:rotate-90 rounded-full transition-all"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-[32px] bg-app-bg custom-scrollbar flex flex-col gap-8">
          <div className="flex flex-col items-center gap-6">
            <div className="w-full bg-card-bg border border-card-border p-[24px] rounded-[16px] shadow-sm flex flex-col items-center gap-6">
              <label className="text-[1.1rem] font-bold text-app-text flex items-center gap-2">
                {t('random.difficulty', '难度系数')} <span className="text-app-primary text-[1.4rem] ml-1 font-mono">{difficulty.toFixed(2)}</span>
              </label>
              <div className="w-full px-2">
                <input 
                  type="range" 
                  min="0" 
                  max="5" 
                  step="0.01" 
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseFloat(e.target.value))}
                  className="unified-slider"
                  style={{ background: `linear-gradient(to right, var(--primary-color) ${(difficulty / 5) * 100}%, var(--card-border) ${(difficulty / 5) * 100}%)` }}
                />
              </div>
            </div>

            <div className="w-full bg-card-bg border border-card-border p-[20px] rounded-[16px] shadow-sm flex flex-col items-center gap-4 hover:border-app-primary/50 transition-colors">
              <label className="flex items-center gap-4 cursor-pointer group w-full justify-center">
                <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 bg-card-border group-hover:opacity-80">
                  {useAI && <div className="absolute inset-0 rounded-full bg-app-primary" />}
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition transform z-10 ${useAI ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <input 
                  type="checkbox" 
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="hidden"
                />
                <span className="font-bold text-app-text text-[1.05rem]">{t('random.useAI', '启用 AI 生成高质量题目')}</span>
              </label>
              <div className="text-[0.85rem] text-center opacity-70">
                {useAI ? t('random.aiDescOn', 'AI 将根据难度系数生成更合理的函数') : t('random.aiDescOff', '将使用本地算法生成不同难度的函数')}
              </div>
            </div>
          </div>

          <div className="text-center mt-2">
            <button 
              onClick={handleStart}
              disabled={isGenerating}
              className={`w-full ${isGenerating ? 'bg-app-primary/50 cursor-not-allowed' : 'bg-app-primary hover:brightness-110 shadow-btn hover:shadow-btn-hover active:scale-[0.98]'} text-white py-[14px] text-[1.15rem] font-bold rounded-[12px] transition-all flex items-center justify-center gap-2`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('random.generating', 'AI 生成中...')}
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  {t('random.startBtn', '立即开始挑战')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

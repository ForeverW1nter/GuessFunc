import { useTranslation } from 'react-i18next';
import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../../../store/useUIStore';

export const FontPanel: React.FC = () => {
  const { t } = useTranslation();

  const FONT_OPTIONS = [
    { id: 'system-ui, -apple-system, sans-serif', label: t('settings.font.default') },
    { id: 'serif', label: t('settings.font.serif') },
    { id: 'sans-serif', label: t('settings.font.sansSerif') },
    { id: 'monospace', label: t('settings.font.monospace') },
    { id: '"KaiTi", "楷体", serif', label: t('settings.font.kaiti') },
    { id: '"SimSun", "宋体", serif', label: t('settings.font.simsun') },
    { id: '"SimHei", "黑体", sans-serif', label: t('settings.font.simhei') },
    { id: '"Microsoft YaHei", "微软雅黑", sans-serif', label: t('settings.font.yahei') },
  ];

  const { storyFontSize, storyFontFamily, setStoryFontSize, setStoryFontFamily, addToast } = useUIStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setStoryFontFamily('CustomStoryFont', url);
      
      const style = document.createElement('style');
      style.innerHTML = `
        @font-face {
          font-family: 'CustomStoryFont';
          src: url('${url}');
        }
      `;
      document.head.appendChild(style);
      addToast(t('settings.font.customSuccess'), 'success');
    }
  };

  const currentFontLabel = FONT_OPTIONS.find(f => f.id === storyFontFamily)?.label || (storyFontFamily === 'CustomStoryFont' ? t('settings.font.customFont') : t('settings.font.selectFont'));

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="m-0 font-bold text-lg text-foreground">{t('settings.font.title')}</h3>
        <div className="flex items-center gap-4">
            <span className="text-sm opacity-70 font-serif">A</span>
            <input 
              type="range" 
              min="50" 
              max="200" 
              step="10" 
              value={storyFontSize} 
              onChange={(e) => setStoryFontSize(Number(e.target.value))}
              className="flex-1 unified-slider"
              style={{
                background: `linear-gradient(to right, rgb(var(--primary-color-rgb)) ${((storyFontSize - 50) / 150) * 100}%, var(--card-border) ${((storyFontSize - 50) / 150) * 100}%)`
              }}
            />
            <span className="text-xl opacity-70 font-serif">A</span>
          </div>
      </div>

      <div className="h-px bg-card-border w-full" />

      <div className="space-y-4">
        <h3 className="m-0 font-bold text-lg text-foreground">{t('settings.font.selectTitle')}</h3>
        
        <div className="relative w-full" ref={dropdownRef}>
          <div 
            className={`bg-card text-foreground border-2 px-[20px] py-[12px] pr-[40px] text-[1.05rem] font-semibold rounded-[10px] cursor-pointer transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative select-none ${isDropdownOpen ? 'border-primary' : 'border-border hover:border-primary'}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {currentFontLabel}
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={`absolute right-[15px] top-1/2 -translate-y-1/2 text-primary transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>

          <div 
            className={`absolute top-[calc(100%+8px)] left-0 w-full bg-card border border-border rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.15)] overflow-hidden z-[100] transition-all duration-300 origin-top ${isDropdownOpen ? 'opacity-100 visible scale-y-100 translate-y-0' : 'opacity-0 invisible scale-y-95 -translate-y-[10px]'}`}
          >
            {FONT_OPTIONS.map((font) => (
              <div 
                key={font.id}
                className={`px-[20px] py-[12px] text-[1rem] font-medium cursor-pointer transition-all ${storyFontFamily === font.id ? 'bg-[rgba(var(--primary-color-rgb),0.1)] text-primary border-l-[3px] border-primary' : 'text-foreground hover:bg-[rgba(128,128,128,0.08)] border-l-[3px] border-transparent'}`}
                onClick={() => {
                  setStoryFontFamily(font.id, null);
                  setIsDropdownOpen(false);
                }}
                style={{ fontFamily: font.id }}
              >
                {font.label}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-base transition-all bg-card text-foreground border-2 border-dashed border-border hover:border-primary hover:text-primary hover:bg-primary/5 cursor-pointer">
            <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleFontUpload} />
            {t('settings.font.uploadLocal')}
          </label>
        </div>
      </div>

      <div className="h-px bg-card-border w-full" />

      <div className="space-y-3">
        <h3 className="m-0 font-bold text-lg text-foreground">{t('settings.font.preview')}</h3>
        <div 
          className="p-4 bg-card border border-border rounded-xl leading-relaxed text-foreground"
          style={{ 
            fontSize: `${storyFontSize}%`,
            fontFamily: storyFontFamily
          }}
        >
          <p className="m-0">{t('settings.font.previewText')}</p>
        </div>
      </div>
    </div>
  );
};
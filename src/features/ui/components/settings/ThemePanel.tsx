import React, { useState } from 'react';
import { useUIStore } from '../../../../store/useUIStore';
import { useTranslation } from 'react-i18next';

// 辅助函数：HEX转RGB
const hexToRgb = (hex: string) => {
  let r = 0, g = 188, b = 212; // default #00BCD4
  if (hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
      g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
      b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  }
  return { r, g, b };
};

// 辅助函数：RGB转HEX
const rgbToHex = (r: number, g: number, b: number) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
};

export const ThemePanel: React.FC = () => {
  const { theme, setTheme, customPrimaryColor, setCustomPrimaryColor } = useUIStore();
  const [rgb, setRgb] = useState(() => hexToRgb(customPrimaryColor || '#00BCD4'));
  const { t } = useTranslation();

  const handleRgbChange = (color: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgb, [color]: value };
    setRgb(newRgb);
    setCustomPrimaryColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomPrimaryColor(value);
    if (/^#[0-9A-Fa-f]{6}$/i.test(value)) {
      setRgb(hexToRgb(value));
    }
  };

  const handleColorBlur = () => {
    if (!customPrimaryColor || !/^#[0-9A-Fa-f]{6}$/i.test(customPrimaryColor)) {
      setCustomPrimaryColor('#00BCD4');
      setRgb(hexToRgb('#00BCD4'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 py-3.5 border border-card-border bg-card-bg text-app-text rounded-xl cursor-pointer hover:border-app-primary transition-all" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        <div className="flex items-center gap-2">
          <span className="font-medium text-base">{t('settings.theme.darkMode', '深色模式')}</span>
          <span className="theme-icon text-lg flex items-center justify-center opacity-80">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            )}
          </span>
        </div>
        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${theme === 'dark' ? 'bg-app-primary' : 'bg-card-border'}`}>
          <span className={`inline-block h-4 w-4 rounded-full bg-white transition transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
        </div>
      </div>

      <div className="h-px bg-card-border w-full my-4" />

      <div className="space-y-4">
        <h3 className="m-0 font-bold text-lg text-app-text">{t('settings.theme.primaryColor', '主题色')}</h3>
        
        <div className="pt-2 space-y-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 w-full bg-card-bg p-4 rounded-xl border border-card-border">
              <div 
                className="w-16 h-16 rounded-lg shadow-inner shrink-0"
                style={{ backgroundColor: customPrimaryColor || '#00BCD4' }}
              />
              <div className="flex-1 flex flex-col justify-center">
                <input 
                  type="text" 
                  value={customPrimaryColor || '#00BCD4'}
                  onChange={handleColorChange}
                  onBlur={handleColorBlur}
                  className="bg-transparent border-b border-card-border px-1 py-1 text-app-text font-mono text-xl focus:border-app-primary focus:outline-none transition-colors uppercase tracking-wider w-full"
                  placeholder="#00BCD4"
                  maxLength={7}
                />
                <span className="text-xs opacity-50 mt-1 px-1">{t('settings.theme.hexCode', 'HEX 颜色码')}</span>
              </div>
            </div>
          </div>

          {/* RGB Sliders */}
          <div className="bg-card-bg p-4 rounded-xl border border-card-border space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-4 font-mono font-bold text-red-500">R</span>
              <input 
                type="range" 
                min="0" max="255" 
                value={rgb.r} 
                onChange={(e) => handleRgbChange('r', parseInt(e.target.value))}
                className="flex-1 unified-slider theme-rgb-slider"
                style={{ '--slider-color': '#ff0000', background: `linear-gradient(to right, #ff0000 ${rgb.r / 255 * 100}%, var(--card-border) ${rgb.r / 255 * 100}%)` } as React.CSSProperties}
              />
              <span className="w-8 text-right font-mono text-sm opacity-70">{rgb.r}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-4 font-mono font-bold text-green-500">G</span>
              <input 
                type="range" 
                min="0" max="255" 
                value={rgb.g} 
                onChange={(e) => handleRgbChange('g', parseInt(e.target.value))}
                className="flex-1 unified-slider theme-rgb-slider"
                style={{ '--slider-color': '#00ff00', background: `linear-gradient(to right, #00ff00 ${rgb.g / 255 * 100}%, var(--card-border) ${rgb.g / 255 * 100}%)` } as React.CSSProperties}
              />
              <span className="w-8 text-right font-mono text-sm opacity-70">{rgb.g}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-4 font-mono font-bold text-blue-500">B</span>
              <input 
                type="range" 
                min="0" max="255" 
                value={rgb.b} 
                onChange={(e) => handleRgbChange('b', parseInt(e.target.value))}
                className="flex-1 unified-slider theme-rgb-slider"
                style={{ '--slider-color': '#0000ff', background: `linear-gradient(to right, #0000ff ${rgb.b / 255 * 100}%, var(--card-border) ${rgb.b / 255 * 100}%)` } as React.CSSProperties}
              />
              <span className="w-8 text-right font-mono text-sm opacity-70">{rgb.b}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
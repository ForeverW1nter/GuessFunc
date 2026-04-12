import React, { useState, useRef, useEffect } from 'react';
import { Download, Wand2, Upload, ArrowLeft, Terminal, Plus, Globe, MoreVertical, Undo, Redo } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TextWithCodeFont } from '../../../components/ui/TextWithCodeFont';
import type { RouteData } from '../../../types/story';

interface SystemBarProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onPublish: () => void;
  onOpenBatchGenerator: () => void;
  onClose: () => void;
  routes: RouteData[];
  activeRoute: RouteData;
  routeIndex: number;
  onSelectRoute: (index: number) => void;
  onAddRoute: () => void;
  isMobile: boolean;
  showSidebarOnMobile: boolean;
  onBackToSidebar: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const SystemBar: React.FC<SystemBarProps> = ({ 
  onFileUpload, onExport, onPublish, onOpenBatchGenerator, onClose, 
  routes, activeRoute, routeIndex, onSelectRoute, onAddRoute, 
  isMobile, showSidebarOnMobile, onBackToSidebar,
  canUndo = false, canRedo = false, onUndo, onRedo 
}) => {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setIsToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative z-20 flex items-center justify-between h-[48px] px-[16px] shrink-0 border-b border-border bg-card">
      <div className="flex items-center gap-[16px]">
        <button 
          onClick={isMobile && !showSidebarOnMobile ? onBackToSidebar : onClose}
          className="flex items-center gap-[8px] text-muted-foreground hover:text-foreground transition-colors border-none bg-transparent cursor-pointer p-0"
          title={isMobile && !showSidebarOnMobile ? t('tools.storyEditor.back') : t('tools.storyEditor.systemExit')}
        >
          <ArrowLeft size={16} strokeWidth={2} className="shrink-0" />
          <TextWithCodeFont className="text-[0.85rem] uppercase tracking-wider whitespace-nowrap" text={isMobile && !showSidebarOnMobile ? t('tools.storyEditor.back') : t('tools.storyEditor.systemExit')} />
        </button>
      </div>
      
      <div className="flex items-center gap-[8px]">
        {/* Tools Dropdown for Mobile */}
        <div className="md:hidden relative inline-block" ref={toolsDropdownRef}>
          <button 
            onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
            className={`flex items-center justify-center p-2 rounded-md transition-colors border-none cursor-pointer bg-transparent ${isToolsDropdownOpen ? 'bg-border text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-border'}`}
            title="Tools"
          >
            <MoreVertical size={16} />
          </button>
          <div 
            className={`absolute top-[calc(100%+4px)] right-0 w-[180px] bg-muted border border-border rounded-[4px] shadow-2xl overflow-hidden z-[100] transition-all duration-200 origin-top-right ${isToolsDropdownOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}
          >
            {onUndo && (
              <div 
                className={`px-[16px] py-[10px] transition-colors flex items-center gap-[8px] ${canUndo ? 'cursor-pointer text-muted-foreground hover:bg-border hover:text-foreground' : 'cursor-not-allowed text-muted-foreground/30'}`}
                onClick={() => {
                  if (canUndo) {
                    onUndo();
                    setIsToolsDropdownOpen(false);
                  }
                }}
              >
                <Undo size={14} />
                <span className="text-[0.8rem] uppercase tracking-widest whitespace-nowrap"><TextWithCodeFont text={t('tools.storyEditor.undo')} /></span>
              </div>
            )}
            {onRedo && (
              <div 
                className={`px-[16px] py-[10px] transition-colors flex items-center gap-[8px] ${canRedo ? 'cursor-pointer text-muted-foreground hover:bg-border hover:text-foreground' : 'cursor-not-allowed text-muted-foreground/30'}`}
                onClick={() => {
                  if (canRedo) {
                    onRedo();
                    setIsToolsDropdownOpen(false);
                  }
                }}
              >
                <Redo size={14} />
                <span className="text-[0.8rem] uppercase tracking-widest whitespace-nowrap"><TextWithCodeFont text={t('tools.storyEditor.redo')} /></span>
              </div>
            )}
            <div 
              className="px-[16px] py-[10px] cursor-pointer transition-colors text-muted-foreground hover:bg-border hover:text-foreground flex items-center gap-[8px]"
              onClick={() => {
                onOpenBatchGenerator();
                setIsToolsDropdownOpen(false);
              }}
            >
              <Wand2 size={14} />
              <span className="text-[0.8rem] uppercase tracking-widest"><TextWithCodeFont text={t('tools.storyEditor.batchGenerate')} /></span>
            </div>
            <label 
              className="px-[16px] py-[10px] cursor-pointer transition-colors text-muted-foreground hover:bg-border hover:text-foreground flex items-center gap-[8px]"
              title={t('tools.storyEditor.importBtn')}
            >
              <Upload size={14} />
              <span className="text-[0.8rem] uppercase tracking-widest"><TextWithCodeFont text={t('tools.storyEditor.importBtn')} /></span>
              <input type="file" accept=".json" onChange={(e) => {
                onFileUpload(e);
                setIsToolsDropdownOpen(false);
              }} className="hidden" />
            </label>
            <div 
              className="px-[16px] py-[10px] cursor-pointer transition-colors text-muted-foreground hover:bg-border hover:text-foreground flex items-center gap-[8px]"
              onClick={() => {
                onExport();
                setIsToolsDropdownOpen(false);
              }}
            >
              <Download size={14} />
              <span className="text-[0.8rem] uppercase tracking-widest"><TextWithCodeFont text={t('tools.storyEditor.exportBtn')} /></span>
            </div>
            <div 
              className="px-[16px] py-[10px] cursor-pointer transition-colors text-primary hover:bg-border hover:text-primary/80 flex items-center gap-[8px]"
              onClick={() => {
                onPublish();
                setIsToolsDropdownOpen(false);
              }}
            >
              <Globe size={14} />
              <span className="text-[0.8rem] uppercase tracking-widest"><TextWithCodeFont text={t('mods.publishAction')} /></span>
            </div>
          </div>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-[8px]">
          {onUndo && (
            <button 
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex items-center justify-center p-2 rounded-md transition-colors border-none bg-transparent ${canUndo ? 'text-muted-foreground hover:text-foreground hover:bg-border cursor-pointer' : 'text-muted-foreground/30 cursor-not-allowed'}`}
              title={t('tools.storyEditor.undo')}
            >
              <Undo size={16} />
            </button>
          )}
          {onRedo && (
            <button 
              onClick={onRedo}
              disabled={!canRedo}
              className={`flex items-center justify-center p-2 rounded-md transition-colors border-none bg-transparent ${canRedo ? 'text-muted-foreground hover:text-foreground hover:bg-border cursor-pointer' : 'text-muted-foreground/30 cursor-not-allowed'}`}
              title={t('tools.storyEditor.redo')}
            >
              <Redo size={16} />
            </button>
          )}
          <div className="w-[1px] h-[16px] bg-border mx-[4px]"></div>

          <button 
            onClick={onOpenBatchGenerator}
            className="flex items-center gap-2 p-2 rounded-md text-[0.85rem] uppercase tracking-wider transition-colors border-none cursor-pointer bg-transparent text-muted-foreground hover:text-foreground hover:bg-border"
            title={t('tools.storyEditor.batchGenerate')}
          >
            <Wand2 size={16} />
            <span><TextWithCodeFont text={t('tools.storyEditor.batchGenerate')} /></span>
          </button>

          <label className="flex items-center gap-2 p-2 rounded-md text-[0.85rem] uppercase tracking-wider transition-colors border-none cursor-pointer bg-transparent text-muted-foreground hover:text-foreground hover:bg-border" title={t('tools.storyEditor.importBtn')}>
            <Upload size={16} />
            <span><TextWithCodeFont text={t('tools.storyEditor.importBtn')} /></span>
            <input type="file" accept=".json" onChange={onFileUpload} className="hidden" />
          </label>
          
          <button 
            onClick={onExport}
            className="flex items-center gap-2 p-2 rounded-md text-[0.85rem] uppercase tracking-wider transition-colors border-none cursor-pointer bg-transparent text-muted-foreground hover:text-foreground hover:bg-border"
            title={t('tools.storyEditor.exportBtn')}
          >
            <Download size={16} />
            <span><TextWithCodeFont text={t('tools.storyEditor.exportBtn')} /></span>
          </button>

          <button 
            onClick={onPublish}
            className="flex items-center gap-2 p-2 rounded-md text-[0.85rem] uppercase tracking-wider transition-colors border-none cursor-pointer bg-transparent text-primary hover:bg-border"
            title={t('mods.publishAction')}
          >
            <Globe size={16} />
            <span><TextWithCodeFont text={t('mods.publishAction')} /></span>
          </button>
        </div>

        <div className="w-[1px] h-[24px] bg-border mx-[4px]"></div>

        <div className="relative inline-block" ref={dropdownRef}>
          <div 
            className={`flex items-center gap-[8px] px-[12px] py-[4px] rounded-[4px] cursor-pointer transition-colors ${isDropdownOpen ? 'bg-border text-foreground' : 'hover:bg-muted text-muted-foreground'}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Terminal size={18} strokeWidth={2} className="opacity-70 shrink-0" />
            <TextWithCodeFont className="text-[0.85rem] tracking-widest uppercase select-none truncate max-w-[150px] sm:max-w-none" text={activeRoute?.title || 'ROOT'} />
          </div>

          <div 
            className={`absolute top-[calc(100%+4px)] right-0 w-[200px] bg-muted border border-border rounded-[4px] shadow-2xl overflow-hidden z-[100] transition-all duration-200 origin-top-right ${isDropdownOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}
          >
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {routes.map((route, idx) => (
                <div 
                  key={route.id}
                  className={`px-[16px] py-[10px] cursor-pointer transition-colors ${routeIndex === idx ? 'bg-primary/15 text-primary border-l-[2px] border-primary' : 'text-muted-foreground hover:bg-border hover:text-foreground border-l-[2px] border-transparent'}`}
                  onClick={() => {
                    onSelectRoute(idx);
                    setIsDropdownOpen(false);
                  }}
                >
                  <TextWithCodeFont className="text-[0.8rem] uppercase tracking-widest mb-[2px]" text={route.title} />
                </div>
              ))}
            </div>
            <div 
              className="px-[16px] py-[10px] cursor-pointer transition-colors text-muted-foreground hover:bg-border hover:text-foreground border-t border-border flex items-center gap-[8px]"
              onClick={() => {
                onAddRoute();
                setIsDropdownOpen(false);
              }}
            >
              <Plus size={14} />
              <span className="text-[0.8rem] uppercase tracking-widest"><TextWithCodeFont text={t('tools.storyEditor.newRoute')} /></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

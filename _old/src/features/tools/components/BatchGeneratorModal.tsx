import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Wand2, ArrowLeft, ArrowRight, Download, Upload } from 'lucide-react';
type FunctionType = 'polynomial' | 'absolute' | 'rational' | 'radical' | 'exponential' | 'trigonometric' | 'inverse_trigonometric' | 'hyperbolic' | 'inverse_hyperbolic';
import { generateFunctionByDifficulty } from '../../../utils/mathEngine/generator';
import { SYSTEM_LOGS } from '../../../utils/systemLogs';
import type { ChapterData, LevelData } from '../../../types/story';
import { ToggleSwitch } from '../../../features/ui/components/ToggleSwitch';
import { TextWithCodeFont } from '../../../components/ui/TextWithCodeFont';
import { useUIStore } from '../../../store/useUIStore';

interface BatchGeneratorModalProps {
  startChapterIndex: number;
  startLevelIndex: number;
  onClose: () => void;
  onGenerate: (chapters: ChapterData[]) => void;
}

interface ChapterConfig {
  id: string;
  name: string;
  levelCount: number;
  startDifficulty: number;
  endDifficulty: number;
  withParams: boolean;
  allowedTypes: FunctionType[];
}

export const BatchGeneratorModal: React.FC<BatchGeneratorModalProps> = ({
  startChapterIndex,
  startLevelIndex,
  onClose,
  onGenerate
}) => {
  const { t } = useTranslation();
  const chapterIdPrefix = 'ch';
  
  const ALL_TYPES: { value: FunctionType; label: string }[] = [
    { value: 'polynomial', label: t('tools.storyEditor.funcTypes.polynomial') },
    { value: 'absolute', label: t('tools.storyEditor.funcTypes.absolute') },
    { value: 'rational', label: t('tools.storyEditor.funcTypes.rational') },
    { value: 'radical', label: t('tools.storyEditor.funcTypes.radical') },
    { value: 'exponential', label: t('tools.storyEditor.funcTypes.exponential') },
    { value: 'trigonometric', label: t('tools.storyEditor.funcTypes.trigonometric') },
    { value: 'inverse_trigonometric', label: t('tools.storyEditor.funcTypes.inverse_trigonometric') },
    { value: 'hyperbolic', label: t('tools.storyEditor.funcTypes.hyperbolic') },
    { value: 'inverse_hyperbolic', label: t('tools.storyEditor.funcTypes.inverse_hyperbolic') }
  ];
  
  const createChapterConfig = (index: number, previousConfig?: ChapterConfig): ChapterConfig => ({
    id: `${chapterIdPrefix}${startChapterIndex + index}`,
    name: t('tools.storyEditor.newChapterTitle', { index: startChapterIndex + index + 1 }),
    levelCount: 5,
    startDifficulty: previousConfig ? previousConfig.endDifficulty : 0,
    endDifficulty: previousConfig ? previousConfig.endDifficulty : 2,
    withParams: previousConfig ? previousConfig.withParams : false,
    allowedTypes: previousConfig ? [...previousConfig.allowedTypes] : ['polynomial', 'absolute']
  });

  const [configs, setConfigs] = useState<ChapterConfig[]>([
    createChapterConfig(0)
  ]);

  const handleAddChapter = () => {
    setConfigs(prev => {
      const prevChapter = prev.length > 0 ? prev[prev.length - 1] : null;
      return [
        ...prev,
        createChapterConfig(prev.length, prevChapter ?? undefined)
      ];
    });
  };

  const handleRemoveChapter = (index: number) => {
    setConfigs(prev => prev.filter((_, i) => i !== index));
  };

  const updateConfig = <K extends keyof ChapterConfig>(index: number, field: K, value: ChapterConfig[K]) => {
    setConfigs(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const toggleType = (index: number, type: FunctionType) => {
    setConfigs(prev => {
      const next = [...prev];
      const types = new Set(next[index].allowedTypes);
      if (types.has(type)) {
        types.delete(type);
      } else {
        types.add(type);
      }
      next[index] = { ...next[index], allowedTypes: Array.from(types) };
      return next;
    });
  };

  const handleGenerate = async () => {
    let globalLevelCounter = startLevelIndex;
    
    const generatedChapters: ChapterData[] = [];
    
    for (const config of configs) {
      const levels: LevelData[] = [];
      
      for (let i = 0; i < config.levelCount; i++) {
        // Calculate base difficulty for this level using linear interpolation
        const progress = config.levelCount > 1 ? i / (config.levelCount - 1) : 0;
        const baseDiff = config.startDifficulty + progress * (config.endDifficulty - config.startDifficulty);
        
        // Add random fluctuation between -0.3 and +0.3 to make it less linear
        // Keep it within [0, 7] bounds
        const fluctuation = (Math.random() * 0.6) - 0.3;
        const diff = Math.max(0, Math.min(7, baseDiff + fluctuation));
        
        const generated = await generateFunctionByDifficulty({
          targetDifficulty: diff,
          withParams: config.withParams,
          allowedTypes: config.allowedTypes.length > 0 ? config.allowedTypes : undefined
        });

        levels.push({
          id: `lv${globalLevelCounter}`,
          title: `${globalLevelCounter}`,
          targetFunction: generated.target,
          params: Object.keys(generated.params).length > 0 ? generated.params : null,
          type: 'normal',
          unlockConditions: null,
          tip: ''
        });
        
        globalLevelCounter++;
      }

      generatedChapters.push({
        id: config.id,
        title: config.name,
        levels,
        files: []
      });
    }

    onGenerate(generatedChapters);
    onClose();
  };

  const handleExport = () => {
    const dataStr = `data:text/json;charset=utf-8,${  encodeURIComponent(JSON.stringify(configs, null, 2))}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "batch-config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (Array.isArray(json)) {
            setConfigs(json);
          } else {
            useUIStore.getState().addToast(t('tools.storyEditor.parseError'), 'error');
          }
        } catch (err: unknown) {
          useUIStore.getState().addToast(t('tools.storyEditor.parseError'), 'error');
          console.error(SYSTEM_LOGS.ERROR_IMPORT_DATA, err);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors shrink-0 bg-transparent border-none cursor-pointer px-2 py-1.5 rounded-md hover:bg-muted"
          >
            <ArrowLeft size={18} className="shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap"><TextWithCodeFont text={t('tools.storyEditor.back')} /></span>
          </button>
          <div className="w-px h-5 bg-border"></div>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
            <Wand2 size={18} />
          </div>
          <h2 className="m-0 text-sm font-semibold text-foreground truncate">
            <TextWithCodeFont text={t('tools.storyEditor.batchGenerateTitle')} />
          </h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
        <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto w-full">
          <div className="mb-6">
          <p className="text-sm text-muted-foreground m-0">
            <TextWithCodeFont text={t('tools.storyEditor.batchGenerateDesc')} />
          </p>
        </div>

        {configs.map((config, index) => (
          <div key={index} className="bg-card border border-border rounded-xl p-6 relative transition-colors hover:border-primary/50 shadow-sm">
            <button 
              onClick={() => handleRemoveChapter(index)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-destructive hover:text-destructive hover:bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors cursor-pointer bg-transparent border-none"
            >
              <Trash2 size={18} />
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">
                  <TextWithCodeFont text={t('tools.storyEditor.batchChapterId')} />
                </label>
                <input 
                  value={config.id} 
                  onChange={(e) => updateConfig(index, 'id', e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">
                  <TextWithCodeFont text={t('tools.storyEditor.chapterName')} />
                </label>
                <input 
                  value={config.name} 
                  onChange={e => updateConfig(index, 'name', e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-sans"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">
                  <TextWithCodeFont text={t('tools.storyEditor.levelCount')} />
                </label>
                <input 
                  type="number" min="1" max="50"
                  value={config.levelCount} 
                  onChange={e => updateConfig(index, 'levelCount', parseInt(e.target.value) || 1)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono"
                />
              </div>
              <div className="flex items-center gap-4 pt-6">
                <div className="flex items-center gap-3 cursor-pointer text-sm font-medium text-foreground" onClick={() => updateConfig(index, 'withParams', !config.withParams)}>
                  <ToggleSwitch 
                    checked={config.withParams}
                    onChange={checked => updateConfig(index, 'withParams', checked)}
                  />
                  <TextWithCodeFont text={t('tools.storyEditor.includeParams')} />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                <TextWithCodeFont text={t('tools.storyEditor.difficultyCurve')} />
              </label>
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2 font-mono">
                    <span className=""><TextWithCodeFont text={t('tools.storyEditor.startDiff')} />: <span className="text-foreground ml-1 font-semibold font-mono">{config.startDifficulty.toFixed(1)}</span></span>
                  </div>
                  <input 
                    type="range" min="0" max="7" step="0.1"
                    value={config.startDifficulty}
                    onChange={e => updateConfig(index, 'startDifficulty', parseFloat(e.target.value))}
                    className="w-full unified-slider"
                    style={{ background: `linear-gradient(to right, rgb(var(--primary)) ${(config.startDifficulty / 7) * 100}%, oklch(var(--border)) ${(config.startDifficulty / 7) * 100}%)` }}
                  />
                </div>
                <div className="text-muted-foreground mt-3"><ArrowRight size={16} /></div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2 font-mono">
                    <span className=""><TextWithCodeFont text={t('tools.storyEditor.endDiff')} />: <span className="text-foreground ml-1 font-semibold font-mono">{config.endDifficulty.toFixed(1)}</span></span>
                  </div>
                  <input 
                    type="range" min="0" max="7" step="0.1"
                    value={config.endDifficulty}
                    onChange={e => updateConfig(index, 'endDifficulty', parseFloat(e.target.value))}
                    className="w-full unified-slider"
                    style={{ background: `linear-gradient(to right, rgb(var(--primary)) ${(config.endDifficulty / 7) * 100}%, oklch(var(--border)) ${(config.endDifficulty / 7) * 100}%)` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                <TextWithCodeFont text={t('tools.storyEditor.allowedTypes')} />
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {ALL_TYPES.map(type => {
                  const isSelected = config.allowedTypes.includes(type.value);
                  return (
                    <label 
                      key={type.value} 
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${
                        isSelected 
                          ? 'bg-primary/5 border-primary text-primary' 
                          : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={isSelected}
                        onChange={() => toggleType(index, type.value)}
                      />
                      <div className={`flex items-center justify-center w-5 h-5 rounded flex-shrink-0 border transition-colors ${
                        isSelected 
                          ? 'bg-primary border-primary ' 
                          : 'border-border bg-transparent'
                      }`}>
                        {isSelected && <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <span className="text-sm font-medium leading-tight select-none">
                        <TextWithCodeFont text={type.label} />
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={handleAddChapter}
          className="w-full py-4 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 font-medium text-sm cursor-pointer bg-transparent"
        >
          <Plus size={18} />
          <TextWithCodeFont text={t('tools.storyEditor.addChapterBatch')} />
        </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 md:p-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 shrink-0 bg-background">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
          <label className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer border border-border bg-card flex-1 sm:flex-none">
            <Upload size={16} />
            <span className="inline"><TextWithCodeFont text={t('tools.storyEditor.importBatch')} /></span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer border border-border bg-card flex-1 sm:flex-none"
          >
            <Download size={16} />
            <span className="inline"><TextWithCodeFont text={t('tools.storyEditor.exportBatch')} /></span>
          </button>
        </div>
        <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
          <button 
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-medium text-foreground bg-muted hover:bg-muted/80 transition-colors border-none cursor-pointer text-center"
          >
            <TextWithCodeFont text={t('tools.storyEditor.cancel')} />
          </button>
          <button 
            onClick={handleGenerate}
            disabled={configs.length === 0}
            className="flex-[2] sm:flex-none px-4 py-2.5 rounded-lg text-sm font-medium bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 border-none cursor-pointer shadow-sm"
          >
            <Wand2 size={16} className="shrink-0" />
            <span className="truncate">
              <TextWithCodeFont text={t('tools.storyEditor.generateLevels', { count: configs.reduce((acc, c) => acc + c.levelCount, 0) })} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

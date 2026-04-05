import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Wand2, ArrowLeft, Download, Upload } from 'lucide-react';
import { FunctionType, generateFunctionByDifficulty } from '../../../src/utils/mathEngine/generator';
import { ChapterData, LevelData } from '../../../src/types/story';
import { ToggleSwitch } from '../../../src/features/ui/components/ToggleSwitch';

interface BatchGeneratorModalProps {
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
  onClose,
  onGenerate
}) => {
  const { t } = useTranslation();
  
  const ALL_TYPES: { value: FunctionType; label: string }[] = [
    { value: 'polynomial', label: t('tools.storyEditor.funcTypes.polynomial', 'Polynomial (x, x^2)') },
    { value: 'absolute', label: t('tools.storyEditor.funcTypes.absolute', 'Absolute (|x|)') },
    { value: 'rational', label: t('tools.storyEditor.funcTypes.rational', 'Rational (1/x)') },
    { value: 'radical', label: t('tools.storyEditor.funcTypes.radical', 'Radical (sqrt)') },
    { value: 'exponential', label: t('tools.storyEditor.funcTypes.exponential', 'Exponential (e^{x}, ln)') },
    { value: 'trigonometric', label: t('tools.storyEditor.funcTypes.trigonometric', 'Trigonometric (sin, cos)') },
    { value: 'inverse_trigonometric', label: t('tools.storyEditor.funcTypes.inverse_trigonometric', 'Inv Trig (arcsin, arctan)') },
    { value: 'hyperbolic', label: t('tools.storyEditor.funcTypes.hyperbolic', 'Hyperbolic (sinh, cosh)') },
    { value: 'inverse_hyperbolic', label: t('tools.storyEditor.funcTypes.inverse_hyperbolic', 'Inv Hyperbolic (arsinh)') }
  ];
  
  const [configs, setConfigs] = useState<ChapterConfig[]>([
    {
      id: 'ch_random_1',
      name: t('tools.storyEditor.newChapterTitle', { id: 1, defaultValue: `Chapter 1` }),
      levelCount: 5,
      startDifficulty: 0,
      endDifficulty: 2,
      withParams: false,
      allowedTypes: ['polynomial', 'absolute']
    }
  ]);

  const handleAddChapter = () => {
    setConfigs(prev => {
      const prevChapter = prev.length > 0 ? prev[prev.length - 1] : null;
      const inheritedStart = prevChapter ? prevChapter.endDifficulty : 0;
      const inheritedEnd = prevChapter ? prevChapter.endDifficulty : 2;
      
      return [
        ...prev,
        {
          id: `ch_random_${prev.length + 1}`,
          name: t('tools.storyEditor.newChapterTitle', { id: prev.length + 1, defaultValue: `Chapter ${prev.length + 1}` }),
          levelCount: 5,
          startDifficulty: inheritedStart,
          endDifficulty: inheritedEnd,
          withParams: prevChapter ? prevChapter.withParams : false,
          allowedTypes: prevChapter ? [...prevChapter.allowedTypes] : ['polynomial']
        }
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

  const handleGenerate = () => {
    let globalLevelCounter = 1;
    
    const generatedChapters: ChapterData[] = configs.map(config => {
      const levels: LevelData[] = [];
      
      for (let i = 0; i < config.levelCount; i++) {
        // Calculate base difficulty for this level using linear interpolation
        const progress = config.levelCount > 1 ? i / (config.levelCount - 1) : 0;
        const baseDiff = config.startDifficulty + progress * (config.endDifficulty - config.startDifficulty);
        
        // Add random fluctuation between -0.3 and +0.3 to make it less linear
        // Keep it within [0, 7] bounds
        const fluctuation = (Math.random() * 0.6) - 0.3;
        const diff = Math.max(0, Math.min(7, baseDiff + fluctuation));
        
        const generated = generateFunctionByDifficulty({
          targetDifficulty: diff,
          withParams: config.withParams,
          allowedTypes: config.allowedTypes.length > 0 ? config.allowedTypes : undefined
        });

        levels.push({
          id: `${globalLevelCounter}`,
          title: t('tools.storyEditor.newLevel', { id: globalLevelCounter, defaultValue: `Level ${globalLevelCounter}` }),
          targetFunction: generated.target,
          params: Object.keys(generated.params).length > 0 ? generated.params : null,
          domain: null,
          type: 'normal',
          unlockConditions: null,
          tip: null
        });
        
        globalLevelCounter++;
      }

      return {
        id: config.id,
        title: config.name,
        levels,
        files: []
      };
    });

    onGenerate(generatedChapters);
    onClose();
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configs, null, 2));
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
            alert(t('tools.storyEditor.parseError', 'Failed to parse JSON file'));
          }
        } catch (err: unknown) {
          alert(t('tools.storyEditor.parseError', 'Failed to parse JSON file'));
          console.error(err);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors shrink-0 bg-transparent border-none cursor-pointer px-2 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">{t('tools.storyEditor.back', 'Back')}</span>
          </button>
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800"></div>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-app-primary/10 dark:bg-app-primary/20 text-app-primary dark:text-app-primary shrink-0">
            <Wand2 size={18} />
          </div>
          <h2 className="m-0 text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {t('tools.storyEditor.batchGenerateTitle', 'Batch Generate Chapters')}
          </h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
        <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto w-full">
          <div className="mb-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 m-0">
            {t('tools.storyEditor.batchGenerateDesc', 'Configure random generation parameters for multiple chapters')}
          </p>
        </div>

        {configs.map((config, index) => (
          <div key={index} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 relative transition-colors hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm">
            <button 
              onClick={() => handleRemoveChapter(index)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors cursor-pointer bg-transparent border-none"
            >
              <Trash2 size={18} />
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('tools.storyEditor.chapterId', 'Chapter ID')}
                </label>
                <input 
                  value={config.id} 
                  onChange={e => updateConfig(index, 'id', e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent transition-all font-mono"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('tools.storyEditor.chapterName', 'Chapter Name')}
                </label>
                <input 
                  value={config.name} 
                  onChange={e => updateConfig(index, 'name', e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('tools.storyEditor.levelCount', 'Level Count')}
                </label>
                <input 
                  type="number" min="1" max="50"
                  value={config.levelCount} 
                  onChange={e => updateConfig(index, 'levelCount', parseInt(e.target.value) || 1)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-app-primary focus:border-transparent transition-all font-mono"
                />
              </div>
              <div className="flex items-center gap-4 pt-6">
                <div className="flex items-center gap-3 cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300" onClick={() => updateConfig(index, 'withParams', !config.withParams)}>
                  <ToggleSwitch 
                    checked={config.withParams}
                    onChange={checked => updateConfig(index, 'withParams', checked)}
                  />
                  {t('tools.storyEditor.includeParams', 'Include Parameters (a, b, c)')}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                {t('tools.storyEditor.difficultyCurve', 'Difficulty Curve')}
              </label>
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
                    <span>{t('tools.storyEditor.startDiff', 'Start')}: <span className="text-zinc-900 dark:text-zinc-100 ml-1 font-semibold">{config.startDifficulty.toFixed(1)}</span></span>
                  </div>
                  <input 
                    type="range" min="0" max="7" step="0.1"
                    value={config.startDifficulty}
                    onChange={e => updateConfig(index, 'startDifficulty', parseFloat(e.target.value))}
                    className="w-full unified-slider"
                    style={{ background: `linear-gradient(to right, var(--primary-color) ${(config.startDifficulty / 7) * 100}%, var(--card-border) ${(config.startDifficulty / 7) * 100}%)` }}
                  />
                </div>
                <div className="text-zinc-400 mt-3">➔</div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
                    <span>{t('tools.storyEditor.endDiff', 'End')}: <span className="text-zinc-900 dark:text-zinc-100 ml-1 font-semibold">{config.endDifficulty.toFixed(1)}</span></span>
                  </div>
                  <input 
                    type="range" min="0" max="7" step="0.1"
                    value={config.endDifficulty}
                    onChange={e => updateConfig(index, 'endDifficulty', parseFloat(e.target.value))}
                    className="w-full unified-slider"
                    style={{ background: `linear-gradient(to right, var(--primary-color) ${(config.endDifficulty / 7) * 100}%, var(--card-border) ${(config.endDifficulty / 7) * 100}%)` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                {t('tools.storyEditor.allowedTypes', 'Allowed Function Types')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {ALL_TYPES.map(type => {
                  const isSelected = config.allowedTypes.includes(type.value);
                  return (
                    <label 
                      key={type.value} 
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-app-primary/5 border-app-primary text-app-primary' 
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
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
                          ? 'bg-app-primary border-app-primary text-white' 
                          : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
                      }`}>
                        {isSelected && <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <span className="text-sm font-medium leading-tight select-none">
                        {type.label}
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
          className="w-full py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex items-center justify-center gap-2 font-medium text-sm cursor-pointer bg-transparent"
        >
          <Plus size={18} />
          {t('tools.storyEditor.addChapterBatch', 'Add Chapter')}
        </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0 bg-zinc-50 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <Upload size={16} />
            <span className="hidden sm:inline">{t('tools.storyEditor.importBatch', 'Import Config')}</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          >
            <Download size={16} />
            <span className="hidden sm:inline">{t('tools.storyEditor.exportBatch', 'Export Config')}</span>
          </button>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-none cursor-pointer"
          >
            {t('tools.storyEditor.cancel', 'Cancel')}
          </button>
          <button 
            onClick={handleGenerate}
            disabled={configs.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-app-primary hover:bg-app-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 border-none cursor-pointer shadow-sm"
          >
            <Wand2 size={16} />
            {t('tools.storyEditor.generateLevels', { count: configs.reduce((acc, c) => acc + c.levelCount, 0), defaultValue: `Generate ${configs.reduce((acc, c) => acc + c.levelCount, 0)} Levels` })}
          </button>
        </div>
      </div>
    </div>
  );
};
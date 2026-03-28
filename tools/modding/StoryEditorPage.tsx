import React, { useState } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import { RouteData, FileData, LevelData } from '../../src/types/story';

export const StoryEditorPage: React.FC = () => {
  const [storyData, setStoryData] = useState<{ routes: RouteData[] }>({
    routes: [
      {
        id: 'newRoute',
        title: '新线路',
        description: '线路描述...',
        showToBeContinued: true,
        chapters: []
      }
    ]
  });

  const [activeRouteIndex] = useState(0);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storyData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "story.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          setStoryData(json);
        } catch (err: unknown) {
          alert('解析 JSON 文件失败');
          console.error(err);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const addChapter = () => {
    const newRoutes = [...storyData.routes];
    const newChapterId = `ch${newRoutes[activeRouteIndex].chapters.length}`;
    newRoutes[activeRouteIndex].chapters.push({
      id: newChapterId,
      title: `新章节 ${newChapterId}`,
      levels: [],
      files: []
    });
    setStoryData({ ...storyData, routes: newRoutes });
  };

  const addLevel = (chapterIndex: number) => {
    const newRoutes = [...storyData.routes];
    const chapter = newRoutes[activeRouteIndex].chapters[chapterIndex];
    const newLevelId = `${chapter.levels.length + 1}`;
    chapter.levels.push({
      id: newLevelId,
      title: `第 ${newLevelId} 关`,
      targetFunction: 'x',
      params: null,
      domain: null,
      type: 'normal',
      unlockConditions: null,
      tip: ''
    });
    setStoryData({ ...storyData, routes: newRoutes });
  };

  const addFile = (chapterIndex: number) => {
    const newRoutes = [...storyData.routes];
    const chapter = newRoutes[activeRouteIndex].chapters[chapterIndex];
    const newFileId = `f${chapter.files?.length ? chapter.files.length + 1 : 1}`;
    
    if (!chapter.files) chapter.files = [];
    
    chapter.files.push({
      id: newFileId,
      title: '新文件',
      extension: 'md',
      content: '文件内容...',
      unlockConditions: []
    });
    setStoryData({ ...storyData, routes: newRoutes });
  };

  const updateLevel = (chapterIndex: number, levelIndex: number, field: keyof LevelData, value: unknown) => {
    const newRoutes = [...storyData.routes];
    newRoutes[activeRouteIndex].chapters[chapterIndex].levels[levelIndex][field] = value as never;
    setStoryData({ ...storyData, routes: newRoutes });
  };

  const updateFile = (chapterIndex: number, fileIndex: number, field: keyof FileData, value: unknown) => {
    const newRoutes = [...storyData.routes];
    newRoutes[activeRouteIndex].chapters[chapterIndex].files![fileIndex][field] = value as never;
    setStoryData({ ...storyData, routes: newRoutes });
  };

  const currentRoute = storyData.routes[activeRouteIndex];

  return (
    <div className="w-full h-full flex flex-col bg-app-bg text-app-text overflow-hidden font-mono transition-colors duration-300">
      <div className="h-[64px] border-b border-card-border flex items-center justify-between px-6 shrink-0 bg-card-bg">
        <h1 className="text-[1.2rem] font-bold text-app-text m-0 tracking-wider">STORY_EDITOR.exe</h1>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-app-primary text-white rounded-[4px] hover:opacity-80 transition-all border-none cursor-pointer font-bold tracking-wider text-[0.85rem]">
            <span>IMPORT JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-app-primary text-white rounded-[4px] hover:opacity-80 transition-all border-none cursor-pointer font-bold tracking-wider text-[0.85rem]"
          >
            <Download size={16} />
            <span>EXPORT JSON</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-[800px] mx-auto space-y-8 pb-[100px]">
          {/* Route Info */}
          <div className="bg-card-bg p-6 rounded-[12px] border border-card-border space-y-4 shadow-sm">
            <h2 className="text-[1.1rem] font-bold text-app-text m-0 border-b border-card-border pb-2">线路设置 (Route)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[0.85rem] text-app-text opacity-60">线路 ID</label>
                <input 
                  type="text" 
                  value={currentRoute.id}
                  onChange={(e) => {
                    const newRoutes = [...storyData.routes];
                    newRoutes[activeRouteIndex].id = e.target.value;
                    setStoryData({ ...storyData, routes: newRoutes });
                  }}
                  className="w-full bg-app-bg border border-card-border rounded p-2 text-app-text outline-none focus:border-app-primary transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[0.85rem] text-app-text opacity-60">线路标题</label>
                <input 
                  type="text" 
                  value={currentRoute.title}
                  onChange={(e) => {
                    const newRoutes = [...storyData.routes];
                    newRoutes[activeRouteIndex].title = e.target.value;
                    setStoryData({ ...storyData, routes: newRoutes });
                  }}
                  className="w-full bg-app-bg border border-card-border rounded p-2 text-app-text outline-none focus:border-app-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Chapters */}
          {currentRoute.chapters.map((chapter, cIndex) => (
            <div key={chapter.id} className="bg-card-bg p-6 rounded-[12px] border border-card-border space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-card-border pb-3">
                <input 
                  type="text" 
                  value={chapter.title}
                  onChange={(e) => {
                    const newRoutes = [...storyData.routes];
                    newRoutes[activeRouteIndex].chapters[cIndex].title = e.target.value;
                    setStoryData({ ...storyData, routes: newRoutes });
                  }}
                  className="bg-transparent border-none text-[1.1rem] font-bold text-app-text outline-none focus:text-app-primary transition-colors"
                  placeholder="章节名称..."
                />
                <div className="flex items-center gap-2">
                  <span className="text-[0.8rem] text-app-text opacity-50">ID: {chapter.id}</span>
                  <button className="p-[4px] text-app-text opacity-50 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none flex items-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Levels Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[0.95rem] font-bold text-app-text opacity-70 m-0">关卡列表 (Levels)</h3>
                  <button onClick={() => addLevel(cIndex)} className="flex items-center gap-[6px] px-[12px] py-[6px] rounded-[4px] bg-app-primary/20 text-app-primary hover:bg-app-primary/30 transition-colors text-[0.8rem]">
                    <Plus size={14} /> Add Level
                  </button>
                </div>
                
                <div className="space-y-3">
                  {chapter.levels.map((level, lIndex) => (
                    <div key={level.id} className="bg-app-bg p-4 rounded-[8px] border border-card-border grid grid-cols-[1fr_2fr] gap-4">
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          value={level.title}
                          onChange={(e) => updateLevel(cIndex, lIndex, 'title', e.target.value)}
                          className="w-full bg-card-bg border border-card-border rounded p-1.5 text-[0.9rem] text-app-text outline-none focus:border-app-primary transition-colors"
                          placeholder="关卡名称"
                        />
                        <input 
                          type="text" 
                          value={level.id}
                          onChange={(e) => updateLevel(cIndex, lIndex, 'id', e.target.value)}
                          className="w-full bg-card-bg border border-card-border rounded p-1.5 text-[0.8rem] text-app-text opacity-80 outline-none focus:border-app-primary transition-colors"
                          placeholder="关卡ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          value={level.targetFunction || ''}
                          onChange={(e) => updateLevel(cIndex, lIndex, 'targetFunction', e.target.value)}
                          className="w-full bg-card-bg border border-card-border rounded p-1.5 text-[0.9rem] text-app-primary font-mono outline-none focus:border-app-primary transition-colors"
                          placeholder="目标函数 (如: 2x+1)"
                        />
                        <input 
                          type="text" 
                          value={level.tip || ''}
                          onChange={(e) => updateLevel(cIndex, lIndex, 'tip', e.target.value)}
                          className="w-full bg-card-bg border border-card-border rounded p-1.5 text-[0.85rem] text-app-text opacity-80 outline-none focus:border-app-primary transition-colors"
                          placeholder="过关提示 (可选)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Files Section */}
              <div className="space-y-3 pt-4 border-t border-card-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-[0.95rem] font-bold text-app-text opacity-70 m-0">掉落文件 (Files)</h3>
                  <button onClick={() => addFile(cIndex)} className="flex items-center gap-[6px] px-[12px] py-[6px] rounded-[4px] bg-[rgba(var(--primary-color-rgb),0.1)] text-[#A0A0A5] hover:bg-[rgba(var(--primary-color-rgb),0.2)] transition-colors text-[0.8rem]">
                    <Plus size={14} /> Add File
                  </button>
                </div>
                
                <div className="space-y-3">
                  {chapter.files?.map((file, fIndex) => (
                    <div key={file.id} className="bg-app-bg p-4 rounded-[8px] border border-card-border space-y-3">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={file.title}
                          onChange={(e) => updateFile(cIndex, fIndex, 'title', e.target.value)}
                          className="flex-1 bg-card-bg border border-card-border rounded p-1.5 text-[0.9rem] text-app-text outline-none focus:border-app-primary transition-colors"
                          placeholder="文件名"
                        />
                        <input 
                          type="text" 
                          value={file.extension}
                          onChange={(e) => updateFile(cIndex, fIndex, 'extension', e.target.value)}
                          className="w-[60px] bg-card-bg border border-card-border rounded p-1.5 text-[0.9rem] text-app-text outline-none text-center focus:border-app-primary transition-colors"
                          placeholder="后缀"
                        />
                      </div>
                      <input 
                        type="text" 
                        value={file.unlockConditions?.join(',') || ''}
                        onChange={(e) => updateFile(cIndex, fIndex, 'unlockConditions', e.target.value ? e.target.value.split(',') : [])}
                        className="w-full bg-card-bg border border-card-border rounded p-1.5 text-[0.85rem] text-app-text opacity-80 outline-none focus:border-app-primary transition-colors"
                        placeholder="解锁前置关卡ID (如: 1,2)"
                      />
                      <textarea 
                        value={file.content}
                        onChange={(e) => updateFile(cIndex, fIndex, 'content', e.target.value)}
                        className="w-full h-[100px] bg-card-bg border border-card-border rounded p-2 text-[0.9rem] text-app-text outline-none resize-none custom-scrollbar focus:border-app-primary transition-colors"
                        placeholder="文件内容 (支持 Markdown)..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={addChapter}
            className="w-full py-4 border-2 border-dashed border-[#2A2A2E] rounded-[12px] text-[#A0A0A5] hover:text-white hover:border-app-primary hover:bg-[rgba(var(--primary-color-rgb),0.05)] transition-all flex items-center justify-center gap-2 cursor-pointer bg-transparent"
          >
            <Plus size={18} />
            <span>添加新章节</span>
          </button>

        </div>
      </div>
    </div>
  );
};

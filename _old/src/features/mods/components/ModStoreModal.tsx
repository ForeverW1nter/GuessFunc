import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../../store/useUIStore';
import { useModStore } from '../store';
import { fetchApprovedMods, parseModPackage } from '../api';
import type { ModItem } from '../types';
import { Download, Check, RefreshCw, ArrowLeft, Trash2, Search, ArrowDownAZ, ArrowUpAZ, GripVertical, ListFilter } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { TextWithCodeFont } from '../../../components/ui/TextWithCodeFont';
import { ConfirmModal } from '../../ui/components/ConfirmModal';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Dropdown } from '../../../components/ui/Dropdown';
import { cn } from '../../../utils/cn';


type TabType = 'discover' | 'installed';
type SortType = 'newest' | 'name';

export const ModStoreModal: React.FC = () => {
  const { t } = useTranslation();
  const { addToast, isModStoreOpen, setModStoreOpen } = useUIStore();
  const { installMod, uninstallMod, isInstalled, installedMods, modOrder, reorderMods } = useModStore();
  
  const [mods, setMods] = useState<ModItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);

  // Tabs and filtering state
  const [activeTab, setActiveTab] = useState<TabType>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    // Needed for Firefox
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', 'move');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Call reorderMods to immediately reflect changes
    reorderMods(draggedIndex, index);
    setDraggedIndex(index); // Update dragged index to the new position
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Uninstall confirm state
  const [uninstallConfirm, setUninstallConfirm] = useState<{ isOpen: boolean; modId: string | null; modName: string }>({
    isOpen: false,
    modId: null,
    modName: ''
  });

  const loadMods = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApprovedMods(1, 50); // Get first 50 mods for MVP
      setMods(data);
    } catch (err: unknown) {
      console.error('Fetch mods error:', err);
      if (err instanceof Error && err.message === 'RATE_LIMIT_EXCEEDED') {
        setError(t('mods.rateLimitError'));
      } else {
        setError(t('mods.loadFailed'));
      }
      setMods([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRef = useRef<boolean>(false);

  useEffect(() => {
    if (!fetchRef.current && isModStoreOpen) {
      fetchRef.current = true;
      loadMods();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModStoreOpen]);

  const handleInstall = async (mod: ModItem) => {
    try {
      setInstallingId(mod.id);
      const modPackage = parseModPackage(mod.contentBody);
      
      // Inject API metadata that isn't in the JSON
      modPackage.manifest.avatarUrl = mod.avatarUrl;
      modPackage.manifest.createdAt = mod.createdAt;
      modPackage.manifest.downloadCount = mod.downloadCount;

      await installMod(mod.id, modPackage);
      addToast(t('mods.installSuccess'), 'success');
    } catch (err: unknown) {
      addToast(t('mods.installFailed'), 'error');
      console.error('Install error:', err);
      // Optional: log specific Zod errors if available
      if (err instanceof Error && 'errors' in err) {
        console.error('Zod Validation Errors:', (err as Record<string, unknown>).errors);
      }
    } finally {
      setInstallingId(null);
    }
  };

  const handleUninstall = async () => {
    if (!uninstallConfirm.modId) return;
    try {
      await uninstallMod(uninstallConfirm.modId);
      addToast(t('mods.uninstallSuccess'), 'success');
    } catch (err) {
      addToast(t('mods.uninstallFailed'), 'error');
      console.error('Uninstall error:', err);
    } finally {
      setUninstallConfirm({ isOpen: false, modId: null, modName: '' });
    }
  };

  const filteredMods = useMemo(() => {
    let list = activeTab === 'discover' 
      ? mods 
      : modOrder
          .map(id => installedMods[id])
          .filter(Boolean)
          .filter(m => m.manifest.id !== 'local_workspace')
          .map(m => {
          // 从实际的线路数据中提取信�?
          const routeData = m.storyData.routes[0];
          return {
            id: m.manifest.id,
            title: m.manifest.title,
            description: routeData ? routeData.description : m.manifest.description,
            author: m.manifest.author,
            version: m.manifest.version,
            createdAt: m.manifest.createdAt || new Date().toISOString(),
            downloadCount: m.manifest.downloadCount || 0,
            contentBody: '',
            avatarUrl: m.manifest.avatarUrl,
          } as ModItem;
        });

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => 
        m.title.toLowerCase().includes(q) || 
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.author && m.author.toLowerCase().includes(q))
      );
    }

    // Apply sorting only for discover tab, keep custom order for installed tab
    if (activeTab === 'discover') {
      return list.sort((a, b) => {
        let result = 0;
        switch (sortType) {
          case 'name':
            result = a.title.localeCompare(b.title);
            break;
          case 'newest':
          default:
            result = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            break;
        }
        return sortOrder === 'asc' ? -result : result;
      });
    }
    return list;
  }, [activeTab, mods, installedMods, modOrder, searchQuery, sortType, sortOrder]);

  if (!isModStoreOpen) return null;

  return (
    <div className="absolute inset-0 z-20 h-full flex flex-col min-h-0 bg-background text-foreground animate-fade-in">
      <div className="relative z-20 flex items-center justify-between h-[48px] px-[16px] shrink-0 border-b border-border bg-card">
        <div className="flex items-center gap-[16px]">
          <button 
            onClick={() => setModStoreOpen(false)}
            className="flex items-center gap-[8px] text-muted-foreground hover:text-foreground transition-colors border-none bg-transparent cursor-pointer p-0"
            title={t('game.backBtn')}
          >
            <ArrowLeft size={16} strokeWidth={2} className="shrink-0" />
            <TextWithCodeFont className="text-[0.85rem] uppercase tracking-wider whitespace-nowrap" text={t('game.backBtn')} />
          </button>
        </div>
        
        <div className="flex items-center gap-[4px] sm:gap-[12px] w-full sm:w-auto">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabType)} className="h-full flex items-center justify-end flex-1 sm:flex-none">
            <TabsList variant="line" className="h-[32px] p-0">
              <TabsTrigger value="discover" className="text-xs px-3 data-[selected]:text-foreground">{t('mods.discover')}</TabsTrigger>
              <TabsTrigger value="installed" className="text-xs px-3 flex items-center gap-1.5 data-[selected]:text-foreground">
                {t('mods.installedTab')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="w-[1px] h-[16px] bg-border hidden sm:block mx-1"></div>
          <button 
            onClick={activeTab === 'discover' ? loadMods : undefined} 
            disabled={loading || activeTab === 'installed'} 
            className={`flex items-center justify-center p-2 rounded-md transition-colors border-none bg-transparent ${activeTab === 'discover' ? 'text-muted-foreground hover:text-foreground hover:bg-border cursor-pointer' : 'text-muted-foreground/30 cursor-not-allowed'}`}
            title={t('mods.refresh')}
          >
            <RefreshCw size={16} className={`${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-background p-4 md:p-6 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {/* Controls Bar */}
          {activeTab === 'discover' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
              <div className="relative w-full sm:flex-1 sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  placeholder={t('mods.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl pl-11 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all duration-300"
                />
              </div>
              
              <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                <span className="text-sm text-muted-foreground flex items-center gap-1 shrink-0">
                  <span className="hidden sm:inline">{t('mods.sortBy')}</span>
                </span>
                <Dropdown
                  value={sortType}
                  onChange={(v) => setSortType(v as SortType)}
                  icon={<ListFilter size={16} />}
                  options={[
                    { value: 'newest', label: t('mods.sortNewest') },
                    { value: 'name', label: t('mods.sortName') }
                  ]}
                  className="min-w-[140px] h-[36px] bg-muted/50 hover:bg-muted border border-border"
                />
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center justify-center w-[36px] h-[36px] rounded-[4px] bg-muted/50 hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title={sortOrder === 'asc' ? t('mods.sortAsc') : t('mods.sortDesc')}
                >
                  {sortOrder === 'asc' ? <ArrowUpAZ size={18} /> : <ArrowDownAZ size={18} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg">
              {error}
            </div>
          )}
          
          {loading && filteredMods.length === 0 ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="animate-spin text-primary" size={32} />
            </div>
          ) : filteredMods.length === 0 && !error ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? t('mods.noResults') : (activeTab === 'discover' ? t('mods.empty') : t('mods.emptyInstalled'))}
            </div>
          ) : (
            <div className={activeTab === 'installed' ? 'flex flex-col gap-3' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
              {filteredMods.map((mod, index) => (
                <div 
                  key={mod.id} 
                  className={cn(
                    "bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 transition-all duration-300 transform",
                    activeTab === 'installed' 
                      ? (draggedIndex === index ? 'opacity-50 scale-95 shadow-none' : 'hover:shadow-md hover:border-primary/40 hover:bg-primary/5 cursor-grab active:cursor-grabbing') 
                      : 'hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
                  )}
                  draggable={activeTab === 'installed'}
                  onDragStart={(e) => activeTab === 'installed' && handleDragStart(e, index)}
                  onDragOver={(e) => activeTab === 'installed' && handleDragOver(e, index)}
                  onDragEnd={activeTab === 'installed' ? handleDragEnd : undefined}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 w-full sm:flex-1">
                      {activeTab === 'installed' && (
                        <div 
                          className="cursor-grab hover:text-primary text-muted-foreground transition-colors p-1 -ml-1"
                          title={t('mods.dragToReorder')}
                        >
                          <GripVertical size={18} />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-foreground m-0 truncate pr-4" title={mod.title}>
                          <TextWithCodeFont text={mod.title} />
                        </h3>
                        <span className="text-[0.7rem] sm:text-xs text-muted-foreground mt-0.5 truncate">
                          ID: <TextWithCodeFont text={mod.id} />
                        </span>
                      </div>
                    </div>
                    <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
                      {isInstalled(mod.id) ? (
                        activeTab === 'installed' ? (
                          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => setUninstallConfirm({ isOpen: true, modId: mod.id, modName: mod.title })}
                              disabled={mod.id === 'local_workspace'}
                              className="bg-destructive/10 text-destructive border border-destructive/30 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 h-8"
                            >
                              <Trash2 size={14} className="sm:mr-1" />
                              <span className="hidden sm:inline text-xs font-medium uppercase tracking-wider"><TextWithCodeFont text={t('mods.uninstall')} /></span>
                            </Button>
                          </div>
                        ) : (
                          <span className="flex items-center justify-center w-full sm:w-auto gap-1.5 text-primary text-xs font-medium px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg uppercase tracking-wider">
                            <Check size={14} /> <TextWithCodeFont text={t('mods.installed')} />
                          </span>
                        )
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => handleInstall(mod)}
                          disabled={installingId === mod.id}
                          className="w-full sm:w-auto bg-primary hover:bg-primary/90 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md h-8"
                        >
                          {installingId === mod.id ? (
                            <RefreshCw size={14} className="animate-spin mr-1.5" />
                          ) : (
                            <Download size={14} className="mr-1.5" />
                          )}
                          <span className="text-xs font-medium uppercase tracking-wider whitespace-nowrap"><TextWithCodeFont text={installingId === mod.id ? t('mods.installing') : t('mods.install')} /></span>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className={cn("flex", activeTab === 'installed' ? 'pl-8' : '')}>
                    <p className="text-sm text-muted-foreground m-0 line-clamp-2 flex-1 leading-relaxed">
                      <TextWithCodeFont text={mod.description || t('mods.noDescription')} />
                    </p>
                  </div>
                  
                  <div className={cn("flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border gap-2", activeTab === 'installed' ? 'pl-8' : '')}>
                    <div className="flex items-center gap-2 max-w-full overflow-hidden">
                      {mod.avatarUrl ? (
                        <img src={mod.avatarUrl} alt={mod.author} className="w-5 h-5 rounded-full shrink-0 border border-border" />
                      ) : (
                        <div className="w-5 h-5 rounded-full shrink-0 border border-border bg-muted flex items-center justify-center text-foreground font-bold uppercase">
                          {mod.author ? mod.author.charAt(0) : '?'}
                        </div>
                      )}
                      <span className="truncate font-medium"><TextWithCodeFont text={mod.author || t('mods.unknownAuthor')} /></span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 font-mono">
                      <span><TextWithCodeFont text={new Date(mod.createdAt).toLocaleDateString()} /></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <ConfirmModal
        isOpen={uninstallConfirm.isOpen}
        title={t('mods.uninstallConfirmTitle')}
        message={t('mods.uninstallConfirmDesc', { name: uninstallConfirm.modName })}
        onConfirm={handleUninstall}
        onCancel={() => setUninstallConfirm({ isOpen: false, modId: null, modName: '' })}
        confirmText={t('mods.uninstall')}
        cancelText={t('mods.cancel')}
      />
    </div>
  );
};

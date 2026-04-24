import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, RotateCcw, Download, Upload, Trash2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemUIStore } from '../useSystemUIStore';
import { useAudioStore } from '@/foundation/audio/useAudioStore';
import { useProgressStore } from '@/foundation/storage/useProgressStore';
import { useUI } from '../UIManager';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

const TOTAL_SAVE_SLOTS = 5;

const getInitialSlots = () => {
  const slots = [];
  for (let i = 1; i <= TOTAL_SAVE_SLOTS; i++) {
    const data = localStorage.getItem(`system-core-slot-${i}`);
    slots.push({ id: i, timestamp: data ? JSON.parse(data).timestamp : null });
  }
  return slots;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const restorePayloadToStore = (payload: any, setLanguage: any, setFontFamily: any, setFontSizeMultiplier: any, setVolume: any, toggleMute: any) => {
  if (payload.completedLevels) {
    useProgressStore.setState({ 
      completedLevels: payload.completedLevels || [],
      seenChapters: payload.seenChapters || [],
      readFiles: payload.readFiles || []
    });
  }
  if (payload.uiSettings) {
    setLanguage(payload.uiSettings.language || 'zh');
    setFontFamily(payload.uiSettings.fontFamily || 'system-ui');
    setFontSizeMultiplier(payload.uiSettings.fontSizeMultiplier || 1);
  }
  if (payload.audioSettings) {
    setVolume(payload.audioSettings.volume ?? 0.5);
    if (payload.audioSettings.isMuted) toggleMute();
  }
};

export const StorageTab = () => {
  const { language, setLanguage, fontFamily, setFontFamily, fontSizeMultiplier, setFontSizeMultiplier } = useSystemUIStore();
  const { volume, isMuted, setVolume, toggleMute } = useAudioStore();
  const { completedLevels, seenChapters, readFiles } = useProgressStore();
  const { toast } = useUI();
  const { t } = useTranslation();

  const [saveSlots, setSaveSlots] = useState<{ id: number; timestamp: string | null }[]>(getInitialSlots());
  
  // Menu and Confirm states per slot
  const [activeMenuSlot, setActiveMenuSlot] = useState<number | null>(null);
  const [confirmSlotId, setConfirmSlotId] = useState<number | null>(null);

  const currentLocale = language === 'zh' ? 'zh-CN' : 'en-US';

  const updateSlotTimestamp = (slotId: number, timestamp: string | null) => {
    setSaveSlots(prev => prev.map(s => {
      if (s.id === slotId) return { ...s, timestamp };
      return s;
    }));
  };

  const handleSlotSave = (slotId: number) => {
    try {
      const timestamp = new Date().toISOString();
      const data = {
        timestamp,
        payload: {
          completedLevels, seenChapters, readFiles,
          uiSettings: { language, fontFamily, fontSizeMultiplier },
          audioSettings: { volume, isMuted }
        }
      };
      localStorage.setItem(`system-core-slot-${slotId}`, JSON.stringify(data));
      updateSlotTimestamp(slotId, timestamp);
      toast({ title: t('settings.storage.saved', { slotId }), type: 'success' });
    } catch (err) {
      toast({ title: t('settings.storage.saveError', 'Failed to save slot'), description: String(err), type: 'error' });
    }
  };

  const handleSlotLoad = (slotId: number) => {
    try {
      const raw = localStorage.getItem(`system-core-slot-${slotId}`);
      if (!raw) return;
      const { payload } = JSON.parse(raw);
      
      restorePayloadToStore(payload, setLanguage, setFontFamily, setFontSizeMultiplier, setVolume, toggleMute);
      toast({ title: t('settings.storage.loaded', { slotId }), type: 'success' });
    } catch (err) {
      toast({ title: t('settings.storage.loadError', 'Failed to load slot'), description: String(err), type: 'error' });
    }
  };

  const handleExportSlot = (slotId: number) => {
    try {
      const raw = localStorage.getItem(`system-core-slot-${slotId}`);
      if (!raw) return;
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `save_slot_${slotId}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t('settings.storage.exportSuccess', 'Data exported successfully'), type: 'success' });
    } catch (err) {
      toast({ title: t('settings.storage.exportError', 'Export failed'), description: String(err), type: 'error' });
    }
    setActiveMenuSlot(null);
  };

  const handleImportSlot = (slotId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const processFile = (content: string) => {
      try {
        const parsed = JSON.parse(content);
        localStorage.setItem(`system-core-slot-${slotId}`, content);
        updateSlotTimestamp(slotId, parsed.timestamp);
        toast({ title: t('settings.storage.importSuccess', 'Data imported successfully'), type: 'success' });
      } catch (err) {
        toast({ title: t('settings.storage.importError', 'Invalid save file format'), description: String(err), type: 'error' });
      }
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processFile(content);
      e.target.value = '';
    };
    reader.readAsText(file);
    setActiveMenuSlot(null);
  };

  const handleConfirmClearSlot = () => {
    if (confirmSlotId === null) return;
    localStorage.removeItem(`system-core-slot-${confirmSlotId}`);
    updateSlotTimestamp(confirmSlotId, null);
    toast({ title: t('settings.storage.clearSuccess', 'Slot data cleared'), type: 'success' });
    setConfirmSlotId(null);
    setActiveMenuSlot(null);
  };

  return (
    <div className="space-y-8 relative">
      
      {/* Slot Wipe Confirm Modal */}
      <Modal
        isOpen={confirmSlotId !== null}
        onClose={() => setConfirmSlotId(null)}
        title={t('settings.storage.clearConfirmTitle', 'Wipe Slot Data?')}
        description={t('settings.storage.clearConfirm', 'Are you sure you want to completely erase data in this slot? This action cannot be undone.')}
        variant="danger"
        confirmLabel={t('common.confirm', 'Confirm')}
        cancelLabel={t('common.cancel', 'Cancel')}
        onConfirm={handleConfirmClearSlot}
      />

      <div>
        <h2 className="text-lg font-display uppercase tracking-tight mb-1 text-balance">
          {t('settings.storage.title', 'Storage')}
        </h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t('settings.storage.desc', 'Manage your local saves and progress.')}
        </p>
      </div>

      <div className="space-y-4">
        <span className="text-sm font-mono text-[var(--color-muted-foreground)] uppercase tracking-widest">
          {t('settings.storage.slots', 'Save Slots')}
        </span>
        <div className="grid grid-cols-1 gap-3">
          {saveSlots.map((slot) => (
            <div key={slot.id} className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/30 hover:bg-[var(--color-muted)] transition-all gap-4 sm:gap-0">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-lg bg-[var(--color-foreground)]/10 flex items-center justify-center font-mono text-[var(--color-foreground)] text-sm">
                  0{slot.id}
                </div>
                <div className="min-w-0">
                  <div className="font-medium tracking-wide truncate">
                    {slot.timestamp ? t('settings.storage.slotData', 'System Save Data') : t('settings.storage.slotEmpty', 'Empty Slot')}
                  </div>
                  <div className="text-xs font-mono text-[var(--color-muted-foreground)] mt-1 truncate">
                    {slot.timestamp ? new Date(slot.timestamp).toLocaleString(currentLocale, {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    }) : t('settings.storage.slotNoData', 'No data recorded')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 relative">
                <Button size="sm" variant="primary" onClick={() => handleSlotSave(slot.id)}>
                  <Save size={14} className="mr-2" /> {t('settings.storage.btnSave', 'Save')}
                </Button>
                {slot.timestamp && (
                  <Button size="sm" variant="success" onClick={() => handleSlotLoad(slot.id)}>
                    <RotateCcw size={14} className="mr-2" /> {t('settings.storage.btnLoad', 'Load')}
                  </Button>
                )}
                
                {/* Context Menu Toggle */}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="w-8 h-8 rounded-lg"
                  onClick={() => setActiveMenuSlot(activeMenuSlot === slot.id ? null : slot.id)}
                >
                  <MoreVertical size={16} />
                </Button>

                {/* Context Menu Dropdown */}
                <AnimatePresence>
                  {activeMenuSlot === slot.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl shadow-2xl p-1 z-50 flex flex-col"
                    >
                      {slot.timestamp && (
                        <button
                          onClick={() => handleExportSlot(slot.id)}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-[var(--color-muted)] transition-colors text-left"
                        >
                          <Download size={14} className="text-[var(--color-muted-foreground)]" />
                          <span>{t('settings.storage.exportData', 'Export Slot')}</span>
                        </button>
                      )}
                      
                      <label className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-[var(--color-muted)] transition-colors text-left cursor-pointer">
                        <Upload size={14} className="text-[var(--color-muted-foreground)]" />
                        <span>{t('settings.storage.importData', 'Import Slot')}</span>
                        <input type="file" accept=".json" className="hidden" onChange={(e) => handleImportSlot(slot.id, e)} />
                      </label>

                      {slot.timestamp && (
                        <>
                          <div className="h-[1px] bg-[var(--color-border)]/50 my-1 mx-2" />
                          <button
                            onClick={() => { setConfirmSlotId(slot.id); setActiveMenuSlot(null); }}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-red-500/10 text-red-500 transition-colors text-left"
                          >
                            <Trash2 size={14} />
                            <span>{t('settings.storage.wipeData', 'Clear Slot')}</span>
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

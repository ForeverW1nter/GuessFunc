import React from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import { TextWithCodeFont } from '../../../../components/ui/TextWithCodeFont';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '../../../ui/components/ConfirmModal';

interface Message {
  speaker: string;
  text: string;
}

interface MessageData {
  rightSpeakers?: string[];
  messages?: Message[];
}

interface MessageEditorProps {
  value: Record<string, unknown> | string;
  onChange: (value: Record<string, unknown>) => void;
}

export const MessageEditor: React.FC<MessageEditorProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  
  const data: MessageData = React.useMemo(() => {
    try {
      if (typeof value === 'string') {
        const parsed = JSON.parse(value || '{}');
        return {
          rightSpeakers: parsed.rightSpeakers || [],
          messages: parsed.messages || []
        };
      }
      return {
        rightSpeakers: (value.rightSpeakers as string[]) || [],
        messages: (value.messages as Message[]) || []
      };
    } catch {
      return { rightSpeakers: [], messages: [] };
    }
  }, [value]);

  const handleChange = (newData: MessageData) => {
    onChange(newData as Record<string, unknown>);
  };

  const [isAddingSpeaker, setIsAddingSpeaker] = React.useState(false);
  const [newSpeakerName, setNewSpeakerName] = React.useState('');

  const addRightSpeaker = () => {
    if (newSpeakerName && !data.rightSpeakers?.includes(newSpeakerName)) {
      handleChange({
        ...data,
        rightSpeakers: [...(data.rightSpeakers || []), newSpeakerName]
      });
    }
    setNewSpeakerName('');
    setIsAddingSpeaker(false);
  };

  const removeRightSpeaker = (speaker: string) => {
    handleChange({
      ...data,
      rightSpeakers: data.rightSpeakers?.filter(s => s !== speaker) || []
    });
  };

  const addMessage = () => {
    handleChange({
      ...data,
      messages: [...(data.messages || []), { speaker: '', text: '' }]
    });
  };

  const updateMessage = (index: number, field: keyof Message, val: string) => {
    const newMessages = [...(data.messages || [])];
    newMessages[index] = { ...newMessages[index], [field]: val };
    handleChange({ ...data, messages: newMessages });
  };

  const removeMessage = (index: number) => {
    const newMessages = [...(data.messages || [])];
    newMessages.splice(index, 1);
    handleChange({ ...data, messages: newMessages });
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex flex-col gap-4 sm:gap-6 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-24">
        {/* Right Speakers Config */}
      <div className="flex flex-col gap-3 mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2 shrink-0">
            <User size={16} className="text-primary" />
            <TextWithCodeFont text={t('tools.storyEditor.msgRightSpeakers')} />
          </label>
          <button 
            onClick={() => setIsAddingSpeaker(true)}
            className="flex items-center justify-center gap-1 text-xs bg-primary/10 text-primary hover:bg-primary hover:px-3 py-1.5 rounded-lg transition-colors w-full sm:w-auto"
          >
            <Plus size={14} /> {t('tools.storyEditor.msgAddRightSpeaker')}
          </button>
        </div>
        
        <ConfirmModal 
          isOpen={isAddingSpeaker}
          title={t('tools.storyEditor.msgAddRightSpeaker')}
          message={
            <div className="pt-2">
              <input 
                autoFocus
                type="text" 
                value={newSpeakerName}
                onChange={e => setNewSpeakerName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newSpeakerName) {
                    addRightSpeaker();
                  }
                }}
                placeholder={t('tools.storyEditor.msgAddRightSpeakerPrompt')}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          }
          onConfirm={() => {
            if (newSpeakerName) {
              addRightSpeaker();
            }
          }}
          onCancel={() => {
            setIsAddingSpeaker(false);
            setNewSpeakerName('');
          }}
        />

        <div className="flex flex-wrap gap-2 mt-1">
          {data.rightSpeakers?.map(speaker => (
            <div key={speaker} className="flex items-center gap-1 bg-background text-foreground px-3 py-1 rounded-full text-sm font-mono border border-border shadow-sm">
              {speaker}
              <button 
                onClick={() => removeRightSpeaker(speaker)}
                className="text-muted-foreground hover:text-destructive ml-1"
              >
                &times;
              </button>
            </div>
          ))}
          {(!data.rightSpeakers || data.rightSpeakers.length === 0) && (
            <span className="text-xs text-muted-foreground italic">{t('tools.storyEditor.msgNoRightSpeakers')}</span>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-sm font-semibold text-foreground">
            <TextWithCodeFont text={t('tools.storyEditor.msgChatMessages')} />
          </label>
        </div>
        
        {data.messages?.map((msg, idx) => {
          const isRight = data.rightSpeakers?.includes(msg.speaker);
          return (
            <div key={idx} className={`bg-background border border-border/60 rounded-xl p-3 sm:p-4 shadow-sm relative transition-all hover:shadow-md hover:border-border ${!isRight ? 'border-l-[6px] border-l-muted-foreground/30' : ''}`}>
              <button 
                onClick={() => removeMessage(idx)}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors"
              >
                <Trash2 size={16} />
              </button>
              
              <div className="flex flex-col gap-3 pr-8">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('tools.storyEditor.msgSpeakerName')}</label>
                  <input 
                    type="text" 
                    value={msg.speaker}
                    onChange={(e) => updateMessage(idx, 'speaker', e.target.value)}
                    className="w-full bg-muted/20 border border-border/50 rounded-lg px-3 py-2 text-sm font-mono focus:bg-background focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    placeholder={t('tools.storyEditor.msgSpeakerPlaceholder')}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('tools.storyEditor.msgContent')}</label>
                  <textarea 
                    value={msg.text}
                    onChange={(e) => updateMessage(idx, 'text', e.target.value)}
                    className="w-full bg-muted/20 border border-border/50 rounded-lg px-3 py-2 text-sm font-mono focus:bg-background focus:ring-2 focus:ring-primary/50 outline-none min-h-[80px] resize-y custom-scrollbar transition-all"
                    placeholder={t('tools.storyEditor.msgContentPlaceholder')}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {(!data.messages || data.messages.length === 0) && (
          <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground text-sm bg-muted/10">
            {t('tools.storyEditor.msgNoMessages')}
          </div>
        )}
      </div>
      </div>
      
      {/* Sticky Bottom Bar for Add Message */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border flex justify-end z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] rounded-b-xl -mx-4 -mb-4">
        <button 
          onClick={addMessage}
          className="flex items-center justify-center gap-2 text-sm bg-primary hover:bg-primary/90 px-5 py-2.5 rounded-xl transition-all shadow-btn hover:shadow-btn-hover w-full sm:w-auto font-medium"
        >
          <Plus size={16} /> {t('tools.storyEditor.msgAddMessage')}
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Plus, Trash2, Mail } from 'lucide-react';
import { TextWithCodeFont } from '../../../../components/ui/TextWithCodeFont';
import { useTranslation } from 'react-i18next';

interface Header {
  key: string;
  value: string;
}

interface MailData {
  headers?: Header[];
  body?: string;
}

interface MailEditorProps {
  value: Record<string, unknown> | string;
  onChange: (value: Record<string, unknown>) => void;
}

export const MailEditor: React.FC<MailEditorProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  
  const data: MailData = React.useMemo(() => {
    try {
      if (typeof value === 'string') {
        const parsed = JSON.parse(value || '{}');
        return {
          headers: parsed.headers || [],
          body: parsed.body || ''
        };
      }
      return {
        headers: (value.headers as Header[]) || [],
        body: (value.body as string) || ''
      };
    } catch {
      return { headers: [], body: '' };
    }
  }, [value]);

  const handleChange = (newData: MailData) => {
    onChange(newData as Record<string, unknown>);
  };

  const addHeader = () => {
    handleChange({
      ...data,
      headers: [...(data.headers || []), { key: '', value: '' }]
    });
  };

  const updateHeader = (index: number, field: keyof Header, val: string) => {
    const newHeaders = [...(data.headers || [])];
    newHeaders[index] = { ...newHeaders[index], [field]: val };
    handleChange({ ...data, headers: newHeaders });
  };

  const removeHeader = (index: number) => {
    const newHeaders = [...(data.headers || [])];
    newHeaders.splice(index, 1);
    handleChange({ ...data, headers: newHeaders });
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 h-full overflow-y-auto custom-scrollbar pr-2 pb-4">
      {/* Mail Headers */}
      <div className="flex flex-col gap-3 mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Mail size={16} className="text-primary" />
            <TextWithCodeFont text={t('tools.storyEditor.mailHeaders')} />
          </label>
          <button 
            onClick={addHeader}
            className="flex items-center justify-center gap-1 text-xs bg-primary/10 text-primary hover:bg-primary hover:px-3 py-1.5 rounded-lg transition-colors w-full sm:w-auto"
          >
            <Plus size={14} /> {t('tools.storyEditor.mailAddHeader')}
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          {data.headers?.map((header, idx) => (
            <div key={idx} className="flex flex-col gap-3 bg-background p-3 sm:p-4 rounded-lg border border-border/60 shadow-sm transition-all hover:shadow-md hover:border-border">
              <div className="flex flex-row items-center gap-2 sm:gap-3">
                <input 
                  type="text" 
                  value={header.key}
                  onChange={(e) => updateHeader(idx, 'key', e.target.value)}
                  className="flex-1 bg-muted/20 border border-border/50 rounded px-3 py-1.5 text-sm font-mono focus:bg-background focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  placeholder={t('tools.storyEditor.mailKeyPlaceholder')}
                />
                <button 
                  onClick={() => removeHeader(idx)}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2 w-full">
                <input 
                  type="text" 
                  value={header.value}
                  onChange={(e) => updateHeader(idx, 'value', e.target.value)}
                  className="flex-1 bg-muted/20 border border-border/50 rounded px-3 py-1.5 text-sm font-mono focus:bg-background focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  placeholder={t('tools.storyEditor.mailValuePlaceholder')}
                />
              </div>
            </div>
          ))}

          {(!data.headers || data.headers.length === 0) && (
            <div className="text-center py-4 border-2 border-dashed border-border/50 rounded-lg text-muted-foreground text-xs italic bg-muted/10">
              {t('tools.storyEditor.mailNoHeaders')}
            </div>
          )}
        </div>
      </div>

      {/* Mail Body */}
      <div className="flex flex-col flex-1 min-h-[300px]">
        <label className="text-sm font-semibold text-foreground mb-2 block">
          <TextWithCodeFont text={t('tools.storyEditor.mailBody')} />
        </label>
        <textarea 
          value={data.body}
          onChange={(e) => handleChange({ ...data, body: e.target.value })}
          className="w-full flex-1 bg-background border border-border/60 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none custom-scrollbar leading-relaxed shadow-sm font-mono text-foreground hover:border-border"
          placeholder={t('tools.storyEditor.mailBodyPlaceholder')}
        />
      </div>
    </div>
  );
};

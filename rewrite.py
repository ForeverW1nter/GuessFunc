import re

with open("src/features/story/components/viewers/MessageViewer.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the parsing logic
old_parsing = """  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 跳过空行
    if (line.trim() === '') {
        if(messageLines.length === 0) {
            bodyStartIndex = i + 1;
            continue;
        } else {
            // 如果已经在解析对话，遇到空行可以认为这一句是空的，或者直接跳过
            continue;
        }
    }

    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) {
        if(messageLines.length === 0 && (match[1].toLowerCase().includes('发件人') || match[1].toLowerCase().includes('收件人') || match[1].toLowerCase().includes('主题') || match[1].toLowerCase() === 'from' || match[1].toLowerCase() === 'to' || match[1].toLowerCase() === 'subject')) {
            // 这看起来像是一个邮件的 Header
            headers.push({ key: match[1], value: match[2] });
            isMessageFormat = false; // 邮件形式不按照对话框渲染
        } else {
            // 正常对话
            const speaker = match[1].trim();
            speakers.add(speaker);
            messageLines.push({ speaker, text: match[2] });
        }
    } else {
        // 如果遇到无法解析为 `A: B` 的行
        if(messageLines.length === 0) {
            // 一开始就没匹配上，说明是普通文本
            bodyStartIndex = i;
            isMessageFormat = false;
            break;
        } else {
            // 如果已经开始了解析对话，但中间突然穿插了非对话行，我们把它追加到上一句话中，或者视为普通格式
            messageLines[messageLines.length - 1].text += '\n' + line;
        }
    }
  }

  const isEmail = headers.some(h => h.key.toLowerCase().includes('发件人') || h.key.toLowerCase().includes('收件人') || h.key.toLowerCase().includes('主题') || h.key.toLowerCase() === 'from' || h.key.toLowerCase() === 'to' || h.key.toLowerCase() === 'subject');"""

new_parsing = """  let isParsingHeaders = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 跳过空行
    if (line.trim() === '') {
        if (isParsingHeaders && headers.length > 0) {
            isParsingHeaders = false;
            bodyStartIndex = i + 1;
            continue;
        }
        if(messageLines.length === 0 && headers.length === 0) {
            bodyStartIndex = i + 1;
            continue;
        } else {
            continue;
        }
    }

    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match && isParsingHeaders) {
        const keyLower = match[1].toLowerCase();
        const isHeaderKey = keyLower.includes('发件人') || keyLower.includes('收件人') || keyLower.includes('主题') || keyLower.includes('时间') || keyLower.includes('日期') || keyLower.includes('状态') || keyLower.includes('运营商') || ['from', 'to', 'subject', 'date', 'time', 'status'].includes(keyLower);
        
        if (headers.length > 0 || isHeaderKey) {
            headers.push({ key: match[1], value: match[2] });
            isMessageFormat = false; // 邮件形式不按照对话框渲染
            continue;
        }
    }
    
    isParsingHeaders = false;

    if (match) {
        // 正常对话
        const speaker = match[1].trim();
        speakers.add(speaker);
        messageLines.push({ speaker, text: match[2] });
    } else {
        if(messageLines.length === 0) {
            bodyStartIndex = i;
            isMessageFormat = false;
            break;
        } else {
            messageLines[messageLines.length - 1].text += '\\n' + line;
        }
    }
  }

  const isEmail = headers.length > 0;"""

content = content.replace(old_parsing, new_parsing)

old_ui = """        <div className="bg-gray-50 dark:bg-[#252526] p-4 border-b border-gray-200 dark:border-[#333]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              {isEmail ? <Mail size={20} /> : <MessageSquare size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 m-0 leading-none">{title}</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{isEmail ? 'EMAIL MESSAGE' : 'SECURE MESSAGE'}</span>
            </div>
          </div>
          
          {headers.length > 0 && (
            <div className="space-y-1.5 mt-2 bg-white dark:bg-[#1a1a1a] p-3 rounded-lg border border-gray-100 dark:border-[#2a2a2a]">
              {headers.map((h, i) => (
                <div key={i} className="flex text-sm">
                  <span className="text-gray-500 dark:text-gray-400 w-16 shrink-0">{h.key}:</span>
                  <span className="text-gray-900 dark:text-gray-200 font-medium break-all">{h.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>"""

new_ui = """        <div className="bg-gray-50 dark:bg-[#252526] p-5 border-b border-gray-200 dark:border-[#333]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
              {isEmail ? <Mail size={24} /> : <MessageSquare size={24} />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 m-0 leading-tight tracking-tight">{title}</h3>
              <span className="text-[0.8rem] font-medium text-blue-600/80 dark:text-blue-400/80 mt-1 block tracking-wider uppercase">{isEmail ? 'SECURE MAIL' : 'SECURE MESSAGE'}</span>
            </div>
          </div>
          
          {headers.length > 0 && (
            <div className="mt-5 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200/80 dark:border-[#2a2a2a] shadow-sm overflow-hidden">
              <div className="bg-gray-50/80 dark:bg-[#1e1e1e] px-4 py-2 border-b border-gray-100 dark:border-[#2a2a2a]">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Metadata</span>
              </div>
              <div className="p-4 space-y-3">
                {headers.map((h, i) => (
                  <div key={i} className="flex text-[0.95rem] leading-snug">
                    <span className="text-gray-500 dark:text-gray-400 w-20 shrink-0 font-medium">{h.key}</span>
                    <span className="text-gray-900 dark:text-gray-200 break-all">{h.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>"""

content = content.replace(old_ui, new_ui)

with open("src/features/story/components/viewers/MessageViewer.tsx", "w", encoding="utf-8") as f:
    f.write(content)

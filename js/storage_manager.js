
/**
 * 存储管理器模块
 * 负责游戏进度的本地存储、加密与导入导出
 */

const StorageManager = {
    STORAGE_KEY: 'guessfunc_progress_v1',
    SECRET_KEY: 'GuessFuncSecretKey_2024', // 简单的密钥

    /**
     * 获取所有已通关的关卡ID列表
     * @returns {Array<number>}
     */
    getCompletedLevels: function() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return [];
            
            // 尝试解密
            // 为了简单起见，我们本地存储也存加密后的，防止直接修改 localStorage 作弊
            // 但其实前端防作弊意义不大，主要是为了导入导出格式统一
            const decrypted = this._decrypt(data);
            if (!decrypted) return [];
            
            const parsed = JSON.parse(decrypted);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("Failed to load progress:", e);
            return [];
        }
    },

    /**
     * 标记关卡为已通关
     * @param {number} levelId 
     */
    markLevelCompleted: function(levelId) {
        const completed = this.getCompletedLevels();
        if (!completed.includes(levelId)) {
            completed.push(levelId);
            this._save(completed);
        }
    },

    /**
     * 检查关卡是否已通关
     * @param {number} levelId 
     */
    isLevelCompleted: function(levelId) {
        const completed = this.getCompletedLevels();
        return completed.includes(levelId);
    },

    /**
     * 检查关卡是否已解锁
     * @param {Object} unlockCriteria 解锁条件 { levels: [1, 2], count: 5 }
     * @returns {Object} { unlocked: boolean, reason: string }
     */
    checkLevelUnlock: function(unlockCriteria) {
        if (!unlockCriteria) return { unlocked: true };
        
        const completed = this.getCompletedLevels();
        
        // 1. 检查特定关卡依赖
        if (unlockCriteria.levels && Array.isArray(unlockCriteria.levels)) {
            const missing = unlockCriteria.levels.filter(id => !completed.includes(id));
            if (missing.length > 0) {
                return { 
                    unlocked: false, 
                    reason: `需要先通关第 ${missing.join(', ')} 关` 
                };
            }
        }
        
        // 2. 检查通关数量依赖
        if (unlockCriteria.count && typeof unlockCriteria.count === 'number') {
            if (completed.length < unlockCriteria.count) {
                return { 
                    unlocked: false, 
                    reason: `需要累计通关 ${unlockCriteria.count} 个关卡 (当前: ${completed.length})` 
                };
            }
        }
        
        return { unlocked: true };
    },

    /**
     * 导出存档 (加密字符串)
     */
    exportSave: function() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return this._encrypt(JSON.stringify([]));
        return data;
    },

    /**
     * 导入存档
     * @param {string} encryptedData 
     * @returns {boolean} 是否成功
     */
    importSave: function(encryptedData) {
        try {
            const decrypted = this._decrypt(encryptedData);
            if (!decrypted) return false;
            
            const parsed = JSON.parse(decrypted);
            if (Array.isArray(parsed)) {
                localStorage.setItem(this.STORAGE_KEY, encryptedData);
                return true;
            }
        } catch (e) {
            console.error("Import failed:", e);
        }
        return false;
    },

    /**
     * 清空存档
     */
    clearSave: function() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    _save: function(data) {
        const encrypted = this._encrypt(JSON.stringify(data));
        localStorage.setItem(this.STORAGE_KEY, encrypted);
    },

    _encrypt: function(text) {
        if (!window.CryptoJS) return text; // Fallback
        return CryptoJS.AES.encrypt(text, this.SECRET_KEY).toString();
    },

    _decrypt: function(ciphertext) {
        if (!window.CryptoJS) return ciphertext; // Fallback
        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, this.SECRET_KEY);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.error("Decrypt error:", e);
            return null;
        }
    }
};

window.StorageManager = StorageManager;

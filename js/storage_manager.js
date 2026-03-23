
/**
 * 存储管理器模块
 * 负责游戏进度的本地存储、加密与导入导出
 */

const StorageManager = {
    STORAGE_KEY: 'guessfunc_progress_v1',
    CHAPTER_KEY: 'guessfunc_chapters_v1',
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
            const decrypted = this._decrypt(data);
            if (!decrypted) return [];
            
            const parsed = JSON.parse(decrypted);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            Logger.error("Failed to load progress:", e);
            return [];
        }
    },

    /**
     * 获取所有已观看剧情的章节ID列表
     * @returns {Array<string>}
     */
    getSeenChapters: function() {
        try {
            const data = localStorage.getItem(this.CHAPTER_KEY);
            if (!data) return [];
            
            const decrypted = this._decrypt(data);
            if (!decrypted) return [];
            
            const parsed = JSON.parse(decrypted);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            Logger.error("Failed to load chapters:", e);
            return [];
        }
    },

    /**
     * 标记章节剧情为已观看
     * @param {string} chapterId 
     */
    markChapterSeen: function(chapterId) {
        const seen = this.getSeenChapters();
        if (!seen.includes(chapterId)) {
            seen.push(chapterId);
            this._saveChapters(seen);
        }
    },

    /**
     * 检查章节剧情是否已观看
     * @param {string} chapterId 
     */
    isChapterSeen: function(chapterId) {
        const seen = this.getSeenChapters();
        return seen.includes(chapterId);
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
     * 检查区域（章节）是否已解锁
     * @param {Object} region 区域数据
     * @returns {Object} { unlocked: boolean, reason: string }
     */
    checkRegionUnlock: function(region) {
        if (!window.REGIONS || window.REGIONS.length === 0) return { unlocked: true };
        
        const regionIndex = window.REGIONS.findIndex(r => r.id === region.id);
        if (regionIndex === 0) return { unlocked: true }; // 第一章默认解锁
        
        const prevRegion = window.REGIONS[regionIndex - 1];
        if (!prevRegion) return { unlocked: true };

        const completed = this.getCompletedLevels();
        const prevCompletedCount = prevRegion.levels.filter(id => completed.includes(id)).length;
        const prevTotal = prevRegion.levels.length;
        const requiredCount = Math.ceil(prevTotal * 0.8); // 80%
        
        if (prevCompletedCount >= requiredCount) {
            return { unlocked: true };
        } else {
            return { 
                unlocked: false, 
                reason: `需要上一章节（${prevRegion.title}）完成度达到 80% (至少 ${requiredCount} 关，当前 ${prevCompletedCount} 关)` 
            };
        }
    },

    /**
     * 检查具体关卡是否已解锁
     * @param {Object} levelData 关卡数据
     * @param {Object} region 所属区域数据
     * @returns {Object} { unlocked: boolean, reason: string }
     */
    checkLevelUnlock: function(levelData, region) {
        // 先检查所在章节是否解锁
        const regionUnlock = this.checkRegionUnlock(region);
        if (!regionUnlock.unlocked) {
            return regionUnlock;
        }

        // 如果关卡自身定义了旧的解锁条件，可以先忽略，采用新的全局统一规则
        const completed = this.getCompletedLevels();
        
        // 如果已经通关，那肯定是解锁的
        if (completed.includes(levelData.id)) return { unlocked: true };
        
        // 找到该关卡在当前章节中的位置
        const levelIndexInRegion = region.levels.indexOf(levelData.id);
        if (levelIndexInRegion === -1) return { unlocked: true };

        // 统计排在这个关卡“前面”的所有未通关的关卡数量
        let uncompletedBefore = 0;
        for (let i = 0; i <= levelIndexInRegion; i++) {
            const lId = region.levels[i];
            if (!completed.includes(lId)) {
                uncompletedBefore++;
            }
        }

        // 规则：当前章节最多允许同时存在 3 个未通关的关卡
        // 也就是说，包括它自己在内，前面的未通关数量不能超过 3
        if (uncompletedBefore <= 3) {
            return { unlocked: true };
        } else {
            return { 
                unlocked: false, 
                reason: `本章未通过关卡过多。请先完成本章前面的关卡，最多允许同时挑战 3 个未通关关卡。` 
            };
        }
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
            Logger.error("Import failed:", e);
        }
        return false;
    },

    /**
     * 清空存档
     */
    clearSave: function() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.CHAPTER_KEY);
    },

    _save: function(data) {
        const encrypted = this._encrypt(JSON.stringify(data));
        localStorage.setItem(this.STORAGE_KEY, encrypted);
    },

    _saveChapters: function(data) {
        const encrypted = this._encrypt(JSON.stringify(data));
        localStorage.setItem(this.CHAPTER_KEY, encrypted);
    },

    _encrypt: function(text) {
        if (!window.CryptoJS) return text; // 保底方案
        return CryptoJS.AES.encrypt(text, this.SECRET_KEY).toString();
    },

    _decrypt: function(ciphertext) {
        if (!window.CryptoJS) return ciphertext; // 保底方案
        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, this.SECRET_KEY);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            Logger.error("解密错误:", e);
            return null;
        }
    }
};

window.StorageManager = StorageManager;

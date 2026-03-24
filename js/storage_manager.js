
/**
 * 存储管理器模块
 * 负责游戏进度的本地存储、加密与导入导出
 */

const StorageManager = {
    STORAGE_KEY: 'guessfunc_save_v2', // 升级为 v2 版本，整合存储
    SECRET_KEY: 'GuessFuncSecretKey_2024', // 简单的密钥

    /**
     * 获取所有进度数据
     */
    getAllProgress: function() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return this._migrateFromV1(); // 如果没有v2，尝试迁移v1
            
            const decrypted = this._decrypt(data);
            if (!decrypted) return {};
            
            return JSON.parse(decrypted);
        } catch (e) {
            Logger.error("Failed to load progress:", e);
            return {};
        }
    },

    /**
     * 保存所有进度数据
     */
    saveAllProgress: function(progressObj) {
        const encrypted = this._encrypt(JSON.stringify(progressObj));
        localStorage.setItem(this.STORAGE_KEY, encrypted);
    },

    /**
     * 兼容旧版迁移
     */
    _migrateFromV1: function() {
        try {
            const levelData = localStorage.getItem('guessfunc_progress_v1');
            const chapterData = localStorage.getItem('guessfunc_chapters_v1');
            
            let completedLevels = [];
            let seenChapters = [];
            
            if (levelData) {
                const dec = this._decrypt(levelData);
                if (dec) completedLevels = JSON.parse(dec) || [];
            }
            if (chapterData) {
                const dec = this._decrypt(chapterData);
                if (dec) seenChapters = JSON.parse(dec) || [];
            }
            
            // 构造 v2 格式
            const progress = {};
            
            // 旧版本的数据统一迁移到 classic 线路
            if (window.ROUTES) {
                const classicRoute = window.ROUTES.find(r => r.id === 'classic');
                if (classicRoute) {
                    progress['classic'] = {
                        completedLevels: completedLevels.map(String),
                        // 旧版的章节ID没有 "classic_" 前缀，加上前缀进行匹配
                        seenChapters: seenChapters.map(id => 'classic_' + id)
                    };
                }
            }
            
            // 如果有迁移数据，保存一下
            if (completedLevels.length > 0 || seenChapters.length > 0) {
                this.saveAllProgress(progress);
                
                // 标记发生过迁移，供外部使用
                window.guessfunc_legacy_migrated = true;
                
                // 清理旧缓存，避免重复迁移
                localStorage.removeItem('guessfunc_progress_v1');
                localStorage.removeItem('guessfunc_chapters_v1');
            }
            
            return progress;
        } catch (e) {
            return {};
        }
    },

    /**
     * 获取当前保存的线路ID
     */
    getCurrentRoute: function() {
        return localStorage.getItem('guessfunc_route_v1') || null;
    },

    /**
     * 保存当前线路ID
     */
    saveCurrentRoute: function(routeId) {
        localStorage.setItem('guessfunc_route_v1', routeId);
    },

    /**
     * 获取所有已通关的关卡ID列表
     * @returns {Array<number>}
     */
    getCompletedLevels: function() {
        const routeId = window.currentRouteId || this.getCurrentRoute() || 'AI2';
        const progress = this.getAllProgress();
        if (!progress[routeId]) return [];
        return progress[routeId].completedLevels || [];
    },

    /**
     * 获取所有已观看剧情的章节ID列表
     * @returns {Array<string>}
     */
    getSeenChapters: function() {
        const routeId = window.currentRouteId || this.getCurrentRoute() || 'AI2';
        const progress = this.getAllProgress();
        if (!progress[routeId]) return [];
        return progress[routeId].seenChapters || [];
    },

    /**
     * 标记章节剧情为已观看
     * @param {string} chapterId 
     */
    markChapterSeen: function(chapterId) {
        const routeId = window.currentRouteId || this.getCurrentRoute() || 'AI2';
        const progress = this.getAllProgress();
        if (!progress[routeId]) progress[routeId] = { completedLevels: [], seenChapters: [] };
        
        if (!progress[routeId].seenChapters) progress[routeId].seenChapters = [];
        
        if (!progress[routeId].seenChapters.includes(chapterId)) {
            progress[routeId].seenChapters.push(chapterId);
            this.saveAllProgress(progress);
        }
    },

    /**
     * 检查章节剧情是否已观看
     * @param {string} chapterId 
     */
    isChapterSeen: function(chapterId) {
        return this.getSeenChapters().includes(chapterId);
    },

    /**
     * 标记关卡为已通关
     * @param {number} levelId 
     */
    markLevelCompleted: function(levelId) {
        const routeId = window.currentRouteId || this.getCurrentRoute() || 'AI2';
        const progress = this.getAllProgress();
        if (!progress[routeId]) progress[routeId] = { completedLevels: [], seenChapters: [] };
        
        if (!progress[routeId].completedLevels) progress[routeId].completedLevels = [];
        
        if (!this.isLevelCompleted(levelId)) {
            progress[routeId].completedLevels.push(levelId);
            this.saveAllProgress(progress);
        }
    },

    /**
     * 检查关卡是否已通关
     * @param {number} levelId 
     */
    isLevelCompleted: function(levelId) {
        return this.getCompletedLevels().some(id => String(id) === String(levelId));
    },

    /**
     * 检查解锁条件
     */
    checkUnlockCondition: function(condition) {
        if (!condition) return { unlocked: true };
        const routeId = window.currentRouteId || this.getCurrentRoute() || 'AI2';
        const progress = this.getAllProgress();
        const completed = progress[routeId]?.completedLevels || [];

        switch (condition.type) {
            case 'specific_levels':
                const uncompleted = condition.target.filter(id => !completed.some(cid => String(cid) === String(id)));
                if (uncompleted.length === 0) return { unlocked: true };
                return { unlocked: false, reason: `需要先完成关卡: ${uncompleted.join(', ')}` };
            
            case 'total_completed':
                if (completed.length >= condition.target) return { unlocked: true };
                return { unlocked: false, reason: `需要总共完成 ${condition.target} 个关卡 (当前 ${completed.length})` };
            
            case 'chapter_percentage':
                const chap = window.REGIONS.find(r => r.id === condition.target.chapterId);
                if (!chap) return { unlocked: true };
                const chapCompleted = chap.levels.filter(id => completed.some(cid => String(cid) === String(id))).length;
                const reqCount = Math.ceil(chap.levels.length * condition.target.percentage);
                if (chapCompleted >= reqCount) return { unlocked: true };
                return { unlocked: false, reason: `需要章节[${chap.title}]完成度达到 ${Math.round(condition.target.percentage * 100)}% (至少 ${reqCount} 关，当前 ${chapCompleted} 关)` };

            case 'chapter_completed_count':
                const chap2 = window.REGIONS.find(r => r.id === condition.target.chapterId);
                if (!chap2) return { unlocked: true };
                const chapCompleted2 = chap2.levels.filter(id => completed.some(cid => String(cid) === String(id))).length;
                if (chapCompleted2 >= condition.target.count) return { unlocked: true };
                return { unlocked: false, reason: `需要章节[${chap2.title}]完成 ${condition.target.count} 关 (当前 ${chapCompleted2} 关)` };
            
            default:
                return { unlocked: true };
        }
    },

    /**
     * 检查多个解锁条件
     */
    checkConditions: function(conditions) {
        if (!conditions) return { unlocked: true };
        if (!Array.isArray(conditions)) conditions = [conditions];
        
        for (const cond of conditions) {
            const res = this.checkUnlockCondition(cond);
            if (!res.unlocked) return res;
        }
        return { unlocked: true };
    },

    /**
     * 检查区域（章节）是否已解锁
     * @param {Object} region 区域数据
     * @returns {Object} { unlocked: boolean, reason: string }
     */
    checkRegionUnlock: function(region) {
        if (!window.REGIONS || window.REGIONS.length === 0) return { unlocked: true };
        
        if (region.unlock) {
            return this.checkConditions(region.unlock);
        }

        const regionIndex = window.REGIONS.findIndex(r => r.id === region.id);
        if (regionIndex === 0) return { unlocked: true }; // 第一章默认解锁
        
        const prevRegion = window.REGIONS[regionIndex - 1];
        if (!prevRegion) return { unlocked: true };

        const completed = this.getCompletedLevels();
        const prevCompletedCount = prevRegion.levels.filter(id => completed.some(cid => String(cid) === String(id))).length;
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
        
        // 如果已经通关，那肯定是解锁的
        if (this.isLevelCompleted(levelData.id)) return { unlocked: true };

        if (levelData.unlock) {
            return this.checkConditions(levelData.unlock);
        }
        
        const completed = this.getCompletedLevels();
        
        // 找到该关卡在当前章节中的位置
        const levelIndexInRegion = region.levels.findIndex(id => String(id) === String(levelData.id));
        if (levelIndexInRegion === -1) return { unlocked: true };

        // 统计排在这个关卡“前面”的所有未通关的关卡数量
        let uncompletedBefore = 0;
        for (let i = 0; i <= levelIndexInRegion; i++) {
            const lId = region.levels[i];
            if (!this.isLevelCompleted(lId)) {
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
        const progress = this.getAllProgress();
        return this._encrypt(JSON.stringify(progress));
    },

    /**
     * 导入存档
     * @param {string} encryptedData 
     * @returns {boolean|string} 失败返回false，成功返回 'success'，如果是旧版迁移则返回 'migrated'
     */
    importSave: function(encryptedData) {
        try {
            const decrypted = this._decrypt(encryptedData);
            if (!decrypted) return false;
            
            const parsed = JSON.parse(decrypted);
            if (typeof parsed === 'object' && parsed !== null) {
                // 如果是旧版的数组格式，需要迁移
                if (Array.isArray(parsed)) {
                     const progress = this.getAllProgress();
                     if (!progress['classic']) {
                         progress['classic'] = { completedLevels: [], seenChapters: [] };
                     }
                     
                     // 迁移关卡进度
                     parsed.forEach(id => {
                         if (!progress['classic'].completedLevels.includes(String(id))) {
                             progress['classic'].completedLevels.push(String(id));
                         }
                     });
                     
                     // 自动推断已看过的章节
                     if (window.ROUTES) {
                         const classicRoute = window.ROUTES.find(r => r.id === 'classic');
                         if (classicRoute && classicRoute.regions) {
                             classicRoute.regions.forEach(region => {
                                 const hasCompletedLevelInRegion = region.levels.some(lId => parsed.includes(Number(lId)) || parsed.includes(String(lId)));
                                 if (hasCompletedLevelInRegion && !progress['classic'].seenChapters.includes(region.id)) {
                                     progress['classic'].seenChapters.push(region.id);
                                 }
                             });
                         }
                     }
                     
                     this.saveAllProgress(progress);
                     this.saveCurrentRoute('classic');
                     window.currentRouteId = 'classic';
                     if (window.ROUTES) {
                         const route = window.ROUTES.find(r => r.id === 'classic');
                         if (route) {
                             window.LEVELS = route.levels;
                             window.REGIONS = route.regions;
                         }
                     }
                     return 'migrated';
                }
                localStorage.setItem(this.STORAGE_KEY, encryptedData);
                return 'success';
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
        // 也清空旧版
        localStorage.removeItem('guessfunc_progress_v1');
        localStorage.removeItem('guessfunc_chapters_v1');
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

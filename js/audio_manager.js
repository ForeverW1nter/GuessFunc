/**
 * 音频管理器
 * 负责剧情背景音乐的播放与控制
 */
window.AudioManager = {
    bgmPlayer: null,
    isMusicEnabled: true,
    currentTrack: null,
    fadeInterval: null,
    stopTimeout: null,
    targetVolume: 0.5, // 默认最大音量
    
    init: function() {
        // 从 localStorage 读取音乐设置，默认开启
        const stored = localStorage.getItem('guessfunc_music_enabled');
        if (stored !== null) {
            this.isMusicEnabled = stored === 'true';
        }
        
        this.bgmPlayer = new Audio();
        this.bgmPlayer.loop = true;
        
        this.updateMusicButton();
    },
    
    toggleMusic: function() {
        this.isMusicEnabled = !this.isMusicEnabled;
        localStorage.setItem('guessfunc_music_enabled', this.isMusicEnabled);
        
        if (this.isMusicEnabled) {
            if (this.currentTrack) {
                this.bgmPlayer.play().catch(e => console.error("Play failed:", e));
            }
        } else {
            this.bgmPlayer.pause();
        }
        
        this.updateMusicButton();
        return this.isMusicEnabled;
    },
    
    updateMusicButton: function() {
        document.querySelectorAll('.btn-music-toggle').forEach(btn => {
            const wrapper = btn.querySelector('.music-icon-wrapper');
            if (wrapper) {
                if (this.isMusicEnabled && this.bgmPlayer && !this.bgmPlayer.paused) {
                    wrapper.classList.add('playing');
                } else {
                    wrapper.classList.remove('playing');
                }
            }
        });
    },
    
    playStoryMusic: function(isEnding = false) {
        // 只在 classic 线路下播放 (现在 See You Tomorrow 也要播)
        if (window.currentRouteId !== 'classic' && window.currentRouteId !== 'seeYouTomorrow') return;

        const track = isEnding ? 'musics/end1.mp3' : 'musics/mid1.mp3';
        
        // 清除可能正在执行的停止倒计时
        if (this.stopTimeout) {
            clearTimeout(this.stopTimeout);
            this.stopTimeout = null;
        }

        // 如果想播的音乐和正在播的音乐一样，并且正在播放中或即将淡出，就不需要重新加载重头播
        if (this.currentTrack === track && this.bgmPlayer && !this.bgmPlayer.paused) {
            this.fadeIn();
            return;
        }

        if (this.currentTrack !== track) {
            this.currentTrack = track;
            this.bgmPlayer.src = track;
            this.bgmPlayer.load();
        }
        
        if (this.isMusicEnabled) {
            this.bgmPlayer.volume = 0; // 从0开始淡入
            this.bgmPlayer.play().then(() => {
                this.fadeIn();
                this.updateMusicButton();
            }).catch(e => {
                console.error("Play failed (maybe blocked by browser):", e);
                // 某些浏览器需要用户交互才能播放音频
                this.updateMusicButton();
            });
        } else {
            this.updateMusicButton();
        }
    },
    
    fadeIn: function() {
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        if (!this.bgmPlayer) return;
        
        this.fadeInterval = setInterval(() => {
            if (this.bgmPlayer.volume < this.targetVolume) {
                let newVolume = this.bgmPlayer.volume + 0.05;
                if (newVolume > this.targetVolume) newVolume = this.targetVolume;
                this.bgmPlayer.volume = newVolume;
            } else {
                clearInterval(this.fadeInterval);
            }
        }, 100); // 每100ms增加音量
    },
    
    fadeOutAndStop: function() {
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        if (!this.bgmPlayer) return;
        
        this.fadeInterval = setInterval(() => {
            if (this.bgmPlayer.volume > 0) {
                let newVolume = this.bgmPlayer.volume - 0.05;
                if (newVolume < 0) newVolume = 0;
                this.bgmPlayer.volume = newVolume;
            } else {
                clearInterval(this.fadeInterval);
                this.bgmPlayer.pause();
                this.updateMusicButton();
            }
        }, 100); // 每100ms减小音量
    },

    stopMusic: function() {
        if (!this.bgmPlayer) return;
        
        // 延迟 5 秒后真正停止
        this.fadeOutAndStop(); // 先开始淡出
        
        this.stopTimeout = setTimeout(() => {
            if (this.bgmPlayer.paused) { // 确保确实已经淡出并暂停了
                this.bgmPlayer.currentTime = 0;
                this.currentTrack = null;
            }
        }, 5000);
    }
};

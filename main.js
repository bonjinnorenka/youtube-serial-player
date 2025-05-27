class YoutubeSerialPlayer {
    constructor() {
        this.player = null;
        this.videoIds = [];
        this.currentVideoIndex = 0;
        this.playIntervals = [];
        this.defaultInterval = 10;
        this.maxDuration = 0;
        this.currentTime = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.progressTimer = null;
        this.isChangingVideo = false;
        this.lastProcessedVideoIndex = -1;
        
        this.initializeElements();
        this.bindEvents();
        this.loadFromStorage();
    }
    
    initializeElements() {
        this.elements = {
            videoIds: document.getElementById('videoIds'),
            defaultInterval: document.getElementById('defaultInterval'),
            customIntervals: document.getElementById('customIntervals'),
            loadVideos: document.getElementById('loadVideos'),
            shuffleVideos: document.getElementById('shuffleVideos'),
            saveToStorage: document.getElementById('saveToStorage'),
            loadFromStorage: document.getElementById('loadFromStorage'),
            playBtn: document.getElementById('playBtn'),
            stopBtn: document.getElementById('stopBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resumeBtn: document.getElementById('resumeBtn'),
            currentStatus: document.getElementById('currentStatus'),
            progressInfo: document.getElementById('progressInfo'),
            progressFill: document.getElementById('progressFill'),
            videoList: document.getElementById('videoList')
        };
    }
    
    bindEvents() {
        this.elements.loadVideos.addEventListener('click', () => this.loadVideoIds());
        this.elements.shuffleVideos.addEventListener('click', () => this.shuffleVideoList());
        this.elements.saveToStorage.addEventListener('click', () => this.saveToStorage());
        this.elements.loadFromStorage.addEventListener('click', () => this.loadFromStorage());
        this.elements.playBtn.addEventListener('click', () => this.startPlayback());
        this.elements.stopBtn.addEventListener('click', () => this.stopPlayback());
        this.elements.pauseBtn.addEventListener('click', () => this.pausePlayback());
        this.elements.resumeBtn.addEventListener('click', () => this.resumePlayback());
        
        this.elements.defaultInterval.addEventListener('change', () => {
            this.defaultInterval = parseInt(this.elements.defaultInterval.value) || 10;
        });
    }
    
    loadVideoIds() {
        try {
            const input = this.elements.videoIds.value.trim();
            if (!input) {
                alert('動画IDリストを入力してください。');
                return;
            }
            
            this.videoIds = JSON.parse(input);
            if (!Array.isArray(this.videoIds) || this.videoIds.length === 0) {
                throw new Error('有効な配列形式で入力してください。');
            }
            
            this.setupPlayIntervals();
            this.displayVideoList();
            this.updateStatus('動画リストが読み込まれました。');
            this.updateButtons();
            
        } catch (error) {
            alert('動画IDリストの形式が正しくありません。JSON配列形式で入力してください。\n例: ["dQw4w9WgXcQ", "9bZkp7q19f0"]');
        }
    }
    
    shuffleVideoList() {
        if (this.videoIds.length === 0) {
            alert('まず動画リストを読み込んでください。');
            return;
        }
        
        if (this.isPlaying) {
            alert('再生中はシャッフルできません。停止してから実行してください。');
            return;
        }
        
        // Fisher-Yatesアルゴリズムでシャッフル
        const shuffled = [...this.videoIds];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        this.videoIds = shuffled;
        
        // テキストエリアの内容も更新
        this.elements.videoIds.value = JSON.stringify(this.videoIds);
        
        // 再生間隔を再設定
        this.setupPlayIntervals();
        
        // 動画リスト表示を更新
        this.displayVideoList();
        
        this.updateStatus('動画リストがシャッフルされました。');
    }
    
    setupPlayIntervals() {
        const customIntervalsText = this.elements.customIntervals.value.trim();
        
        if (customIntervalsText) {
            // カスタム間隔が指定されている場合
            try {
                this.playIntervals = customIntervalsText.split(',')
                    .map(s => parseInt(s.trim()))
                    .filter(n => !isNaN(n) && n >= 0)
                    .sort((a, b) => a - b);
                
                if (this.playIntervals.length === 0) {
                    throw new Error('有効な数値が見つかりません。');
                }
            } catch (error) {
                alert('カスタム間隔の形式が正しくありません。数値をカンマ区切りで入力してください。');
                this.playIntervals = [];
                return;
            }
        } else {
            // デフォルト間隔を使用
            this.playIntervals = [];
            for (let i = 0; i < this.videoIds.length; i++) {
                this.playIntervals.push(i * this.defaultInterval);
            }
        }
        
        // 最大再生時間を設定（最初の動画の長さ + 最後の開始時間 + デフォルト間隔）
        this.maxDuration = Math.max(...this.playIntervals) + this.defaultInterval;
    }
    
    displayVideoList() {
        let html = '';
        this.videoIds.forEach((videoId, index) => {
            const startTime = this.playIntervals[index] || (index * this.defaultInterval);
            const endTime = this.playIntervals[index + 1] || this.maxDuration;
            const duration = endTime - startTime;
            
            html += `
                <div class="video-item" id="video-item-${index}">
                    <div>
                        <div class="video-title">動画 ${index + 1}: ${videoId}</div>
                        <div class="video-timing">
                            開始: ${startTime}秒 | 再生時間: ${duration}秒
                        </div>
                    </div>
                </div>
            `;
        });
        
        this.elements.videoList.innerHTML = html;
    }
    
    saveToStorage() {
        try {
            const data = {
                videoIds: this.videoIds,
                defaultInterval: this.defaultInterval,
                customIntervals: this.elements.customIntervals.value
            };
            
            localStorage.setItem('youtubeSerialPlayer', JSON.stringify(data));
            this.updateStatus('ローカルストレージに保存されました。');
        } catch (error) {
            alert('保存に失敗しました: ' + error.message);
        }
    }
    
    loadFromStorage() {
        try {
            const data = localStorage.getItem('youtubeSerialPlayer');
            if (!data) {
                alert('保存されたデータが見つかりません。');
                return;
            }
            
            const parsed = JSON.parse(data);
            this.videoIds = parsed.videoIds || [];
            this.defaultInterval = parsed.defaultInterval || 10;
            
            this.elements.videoIds.value = JSON.stringify(this.videoIds);
            this.elements.defaultInterval.value = this.defaultInterval;
            this.elements.customIntervals.value = parsed.customIntervals || '';
            
            if (this.videoIds.length > 0) {
                this.setupPlayIntervals();
                this.displayVideoList();
                this.updateButtons();
            }
            
            this.updateStatus('ローカルストレージから読み込まれました。');
        } catch (error) {
            alert('読み込みに失敗しました: ' + error.message);
        }
    }
    
    async startPlayback() {
        if (this.videoIds.length === 0) {
            alert('まず動画リストを読み込んでください。');
            return;
        }
        
        this.currentVideoIndex = 0;
        this.currentTime = 0;
        this.isPlaying = true;
        this.isPaused = false;
        this.lastProcessedVideoIndex = -1;
        
        this.updateStatus('再生準備中...');
        this.updateButtons();
        
        if (!this.player) {
            await this.initializePlayer();
        }
        
        this.playCurrentVideo();
        this.startProgressTracking();
    }
    
    stopPlayback() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.currentVideoIndex = 0;
        this.isChangingVideo = false;
        this.lastProcessedVideoIndex = -1;
        
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
        
        if (this.player) {
            this.player.stopVideo();
        }
        
        this.updateStatus('停止しました。');
        this.updateProgress(0, this.maxDuration);
        this.updateButtons();
        this.clearVideoHighlight();
    }
    
    pausePlayback() {
        if (!this.isPlaying) return;
        
        this.isPaused = true;
        
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
        
        if (this.player) {
            this.player.pauseVideo();
        }
        
        this.updateStatus('一時停止中');
        this.updateButtons();
    }
    
    resumePlayback() {
        if (!this.isPlaying || !this.isPaused) return;
        
        this.isPaused = false;
        
        if (this.player) {
            this.player.playVideo();
        }
        
        this.startProgressTracking();
        this.updateStatus(`動画 ${this.currentVideoIndex + 1} を再生中`);
        this.updateButtons();
    }
    
    async initializePlayer() {
        return new Promise((resolve) => {
            this.player = new YT.Player('player', {
                height: '480',
                width: '854',
                videoId: this.videoIds[0],
                playerVars: {
                    'autoplay': 0,
                    'controls': 1,
                    'rel': 0,
                    'showinfo': 0
                },
                events: {
                    'onReady': () => {
                        console.log('Player ready');
                        resolve();
                    },
                    'onStateChange': (event) => this.onPlayerStateChange(event)
                }
            });
        });
    }
    
    onPlayerStateChange(event) {
        // プレイヤーの状態変化をハンドル
        console.log('Player state changed:', event.data, 'isChangingVideo:', this.isChangingVideo);
        
        if (event.data === YT.PlayerState.ENDED && this.isPlaying && !this.isPaused && !this.isChangingVideo && this.currentVideoIndex !== this.lastProcessedVideoIndex) {
            console.log('Video ended, playing next video');
            this.isChangingVideo = true; // 動画切り替え中フラグを設定
            this.lastProcessedVideoIndex = this.currentVideoIndex; // 処理済みインデックスを記録
            
            // 少し遅延を入れて連続イベントを防ぐ
            setTimeout(() => {
                if (this.isPlaying && !this.isPaused) {
                    this.playNextVideo();
                }
            }, 100);
        } else if (event.data === YT.PlayerState.PLAYING && this.isPlaying && !this.isPaused) {
            // 動画が再生開始された時の処理
            this.isChangingVideo = false; // 再生開始時にフラグをリセット
            const currentStartTime = this.playIntervals[this.currentVideoIndex] || 0;
            const nextStartTime = this.playIntervals[this.currentVideoIndex + 1];
            const endTime = nextStartTime !== undefined ? nextStartTime : (currentStartTime + this.defaultInterval);
            
            this.updateStatus(`動画 ${this.currentVideoIndex + 1} を再生中 (${currentStartTime}秒〜${endTime}秒)`);
        }
        // UNSTARTED状態での処理を削除 - isChangingVideoをリセットしない
    }
    
    playCurrentVideo() {
        if (this.currentVideoIndex >= this.videoIds.length) {
            this.completePlayback();
            return;
        }
        
        const videoId = this.videoIds[this.currentVideoIndex];
        const startTime = this.playIntervals[this.currentVideoIndex] || 0;
        const nextStartTime = this.playIntervals[this.currentVideoIndex + 1];
        
        let endTime;
        if (nextStartTime !== undefined) {
            endTime = nextStartTime;
        } else {
            endTime = startTime + this.defaultInterval;
        }
        
        console.log(`Loading video ${this.currentVideoIndex + 1}: ${videoId} (${startTime}s - ${endTime}s)`);
        
        // 動画読み込み開始時にフラグを設定
        this.isChangingVideo = true;
        
        // loadVideoByIdにstartTimeとendTimeを指定
        this.player.loadVideoById({
            videoId: videoId,
            startSeconds: startTime,
            endSeconds: endTime
        });
        
        this.updateStatus(`動画 ${this.currentVideoIndex + 1} を読み込み中...`);
        this.highlightCurrentVideo();
    }
    
    // scheduleNextVideoメソッドは削除 - onPlayerStateChangeでENDED状態を処理
    
    playNextVideo() {
        this.markVideoCompleted(this.currentVideoIndex);
        this.currentVideoIndex++;
        
        if (this.currentVideoIndex < this.videoIds.length) {
            this.playCurrentVideo();
        } else {
            this.completePlayback();
        }
    }
    
    completePlayback() {
        this.isPlaying = false;
        this.isPaused = false;
        this.isChangingVideo = false;
        
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
        
        this.updateStatus('再生完了');
        this.updateProgress(this.maxDuration, this.maxDuration);
        this.updateButtons();
        this.clearVideoHighlight();
    }
    
    startProgressTracking() {
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
        }
        
        this.progressTimer = setInterval(() => {
            if (this.isPlaying && !this.isPaused && this.player) {
                // 現在の動画の開始時間と実際の再生時間から現在時間を計算
                const currentStartTime = this.playIntervals[this.currentVideoIndex] || 0;
                const playerCurrentTime = this.player.getCurrentTime() || 0;
                this.currentTime = currentStartTime + (playerCurrentTime - currentStartTime);
                
                this.updateProgress(this.currentTime, this.maxDuration);
                
                if (this.currentTime >= this.maxDuration) {
                    this.completePlayback();
                }
            }
        }, 100);
    }
    
    updateStatus(message) {
        this.elements.currentStatus.textContent = message;
    }
    
    updateProgress(current, total) {
        const percentage = total > 0 ? (current / total) * 100 : 0;
        this.elements.progressFill.style.width = `${Math.min(percentage, 100)}%`;
        this.elements.progressInfo.textContent = 
            `進行状況: ${current.toFixed(1)}秒 / ${total}秒 (${percentage.toFixed(1)}%)`;
    }
    
    updateButtons() {
        this.elements.playBtn.disabled = this.isPlaying;
        this.elements.stopBtn.disabled = !this.isPlaying;
        this.elements.pauseBtn.disabled = !this.isPlaying || this.isPaused;
        this.elements.resumeBtn.disabled = !this.isPlaying || !this.isPaused;
        this.elements.shuffleVideos.disabled = this.isPlaying || this.videoIds.length === 0;
    }
    
    highlightCurrentVideo() {
        this.clearVideoHighlight();
        const currentItem = document.getElementById(`video-item-${this.currentVideoIndex}`);
        if (currentItem) {
            currentItem.classList.add('current');
        }
    }
    
    markVideoCompleted(index) {
        const item = document.getElementById(`video-item-${index}`);
        if (item) {
            item.classList.remove('current');
            item.classList.add('completed');
        }
    }
    
    clearVideoHighlight() {
        document.querySelectorAll('.video-item').forEach(item => {
            item.classList.remove('current', 'completed');
        });
    }
}

// YouTube IFrame API コールバック
function onYouTubeIframeAPIReady() {
    console.log('YouTube IFrame API ready');
    window.player = new YoutubeSerialPlayer();
}

// DOMContentLoaded の場合の初期化
document.addEventListener('DOMContentLoaded', () => {
    // YouTube API がまだ読み込まれていない場合の処理
    if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
        console.log('Waiting for YouTube API...');
    } else {
        onYouTubeIframeAPIReady();
    }
}); 
// 事件处理模块

/**
 * 创建事件处理器
 * @param {Object} params - 依赖对象
 * @returns {Object}
 */
export function createEventHandler(params) {
  const {
    store,
    services,
    topicListManager,
    settingsManager,
    filterBarManager,
    refreshProgress,
    statusIndicator
  } = params;

  let progressTimer = null;
  let currentProgress = 0;

  return {
    /**
     * 绑定所有事件
     */
    bindAll() {
      this.bindRefreshEvents();
      this.bindSettingsEvents();
      this.bindTopicEvents();
      this.bindDocumentClick();
    },

    /**
     * 绑定刷新相关事件
     */
    bindRefreshEvents() {
      const refreshBtn = document.getElementById('refreshBtn');
      const autoRefreshToggle = document.getElementById('autoRefreshToggle');

      refreshBtn.onclick = () => this.handleManualRefresh();
      autoRefreshToggle.onclick = () => this.toggleAutoRefresh();
    },

    /**
     * 绑定设置相关事件
     */
    bindSettingsEvents() {
      const settingsBtn = document.getElementById('settingsBtn');

      settingsBtn.onclick = () => settingsManager.open();
    },

    /**
     * 绑定主题列表事件
     */
    bindTopicEvents() {
      topicListManager.bindClick((topicId) => {
        this.handleTopicClick(topicId);
      });

      topicListManager.bindContextMenu((e, topicId) => {
        this.showContextMenu(e, topicId);
      });
    },

    /**
     * 绑定文档点击事件（隐藏右键菜单）
     */
    bindDocumentClick() {
      document.onclick = () => {
        const menu = document.getElementById('customContextMenu');
        if (menu) menu.style.display = 'none';
      };
    },

    /**
     * 处理主题点击
     * @param {number} topicId
     */
    async handleTopicClick(topicId) {
      const topic = store.getTopics().find(t => t.id === topicId);
      if (!topic) return;

      const config = store.getConfig();
      const url = `https://linux.do/t/${topicId}`;

      // 标记已读
      store.markAsRead(topicId);

      // 如果开启同步，则上报给站内
      if (config.syncReadStatus && topic.highest_post_number) {
        services.markTopicReadOnSite(topicId, topic.highest_post_number);
      }

      // 保存已读状态
      services.saveReadTopicIds(store.getReadTopicIds());

      // 打开链接
      const behavior = config.clickBehavior;
      if (behavior === 'background') {
        chrome.tabs.create({ url, active: false });
      } else {
        chrome.tabs.create({ url, active: true });
      }

      // 更新 UI
      this.refreshTopicList();
    },

    /**
     * 处理手动刷新
     */
    async handleManualRefresh() {
      const settings = filterBarManager.getSettings();

      // 如果是书签视图，不调用 API
      if (settings.categoryFilter === 'bookmarks') {
        // 显示书签列表
        if (window.__showBookmarks) {
          window.__showBookmarks();
        }
        return;
      }

      currentProgress = 0;
      refreshProgress.style.width = '0%';

      statusIndicator.classList.add('loading');

      try {
        const response = await services.fetchTopics(settings);

        if (response.success) {
          const usersMap = new Map(response.users.map(u => [u.id, u]));
          store.setTopics(response.topics, usersMap);

          // 检查通知
          services.checkNotifications(
            response.topics,
            store.getReadTopicIds(),
            store.getConfig().notifyKeywords
          );

          this.refreshTopicList();
        } else {
          throw new Error(response.error || '获取数据失败');
        }
      } catch (e) {
        console.error('加载失败:', e);
        this.showError(e.message);
      } finally {
        statusIndicator.classList.remove('loading');
      }
    },

    /**
     * 切换自动刷新
     */
    toggleAutoRefresh() {
      const enabled = !store.getState().autoRefreshEnabled;
      store.setAutoRefresh(enabled);

      const autoRefreshToggle = document.getElementById('autoRefreshToggle');
      autoRefreshToggle.classList.toggle('active', enabled);

      if (enabled) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }

      // 保存设置
      services.saveUserSettings({
        ...store.getUserSettings(),
        autoRefreshEnabled: enabled
      });
    },

    /**
     * 开始自动刷新
     */
    startAutoRefresh() {
      this.stopAutoRefresh();

      const config = store.getConfig();
      if (config.pollingInterval === 0) return;

      currentProgress = 0;
      refreshProgress.style.width = '0%';

      progressTimer = setInterval(() => {
        currentProgress += (100 / config.pollingInterval);
        requestAnimationFrame(() => {
          refreshProgress.style.width = `${Math.min(currentProgress, 100)}%`;
        });

        if (currentProgress >= 100) {
          this.handleManualRefresh();
        }
      }, 1000);
    },

    /**
     * 停止自动刷新
     */
    stopAutoRefresh() {
      clearInterval(progressTimer);
      refreshProgress.style.width = '0%';
    },

    /**
     * 刷新主题列表
     */
    async refreshTopicList() {
      const state = store.getState();
      const settings = filterBarManager.getSettings();

      // 如果是书签视图，不刷新普通列表
      if (settings.categoryFilter === 'bookmarks') {
        return;
      }

      // 过滤
      let filtered = this.applyFilters(state.topics, state.config, state.readTopicIds);
      // 排序
      filtered = this.applySorting(filtered, settings.sortFilter);

      topicListManager.render(filtered, {
        config: state.config,
        readTopicIds: state.readTopicIds,
        usersMap: state.usersMap
      });

      // 更新计数
      this.updateTopicCount(filtered.length);

      // 更新书签按钮状态
      if (window.__updateBookmarkButtons) {
        await window.__updateBookmarkButtons(filtered);
      }
    },

    /**
     * 应用过滤规则
     */
    applyFilters(topics, config, readTopicIds) {
      let res = [...topics];

      // 分类屏蔽
      if (config.blockCategories?.length > 0) {
        res = res.filter(t => {
          const cat = CATEGORIES.find(c => c.id == t.category_id);
          return !cat || !config.blockCategories.includes(cat.slug);
        });
      }

      // 关键词黑名单
      if (config.keywordBlacklist) {
        const black = config.keywordBlacklist.split(',').map(k => k.trim().toLowerCase());
        res = res.filter(t => !black.some(k => t.title.toLowerCase().includes(k)));
      }

      // 高热度过滤
      if (config.qualityFilter) {
        res = res.filter(t => t.posts_count > 10);
      }

      // 已读隐藏
      if (config.readStatusAction === 'hide') {
        res = res.filter(t => !readTopicIds.has(t.id));
      }

      return res;
    },

    /**
     * 应用排序规则
     */
    applySorting(topics, sortType) {
      const res = [...topics];
      if (sortType === 'latest') {
        res.sort((a, b) => new Date(b.last_posted_at) - new Date(a.last_posted_at));
      } else if (sortType === 'created') {
        res.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (sortType === 'views') {
        res.sort((a, b) => b.views - a.views);
      } else if (sortType === 'replies') {
        res.sort((a, b) => b.posts_count - a.posts_count);
      }
      return res;
    },

    /**
     * 更新主题计数
     */
    updateTopicCount(count) {
      const topicCountEl = document.getElementById('topicCount');
      if (topicCountEl) {
        topicCountEl.textContent = count;
      }
    },

    /**
     * 显示错误
     */
    showError(message) {
      const topicList = document.getElementById('topicList');
      if (topicList) {
        topicList.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-tertiary)">加载失败: ${message}</div>`;
      }
    },

    /**
     * 显示右键菜单
     */
    showContextMenu(e, topicId) {
      const topic = store.getTopics().find(t => t.id === topicId);
      if (!topic) return;

      let menu = document.getElementById('customContextMenu');
      if (!menu) {
        menu = document.createElement('div');
        menu.id = 'customContextMenu';
        menu.className = 'custom-menu';
        document.body.appendChild(menu);
      }

      const url = `https://linux.do/t/${topicId}`;
      menu.innerHTML = `
        <div class="menu-item" onclick="window.__copyText('${url}')">复制链接</div>
        <div class="menu-item" onclick="window.__copyText('[${topic.title.replace(/'/g, "\\'")}](${url})')">复制 Markdown</div>
        <div class="menu-item" onclick="window.__toggleRead(${topicId})">标记为未读</div>
      `;

      menu.style.display = 'block';
      menu.style.left = `${Math.min(e.pageX, window.innerWidth - 160)}px`;
      menu.style.top = `${Math.min(e.pageY, window.innerHeight - 120)}px`;
    },

    /**
     * 清理事件监听器
     */
    destroy() {
      this.stopAutoRefresh();
    }
  };
}

// 导出全局函数（供 onclick 使用）
window.__copyText = async (text) => {
  await navigator.clipboard.writeText(text);
};

window.__toggleRead = (id) => {
  // 这里需要在外部绑定 store
  if (window.__onToggleRead) {
    window.__onToggleRead(id);
  }
};

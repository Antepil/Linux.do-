// 侧边栏入口文件

import { createStore } from './state/index.js';
import * as storage from './state/storage.js';
import {
  fetchTopics, sendMessage, updateBadge, showNotification, markTopicReadOnSite,
  checkLoginStatus, getBookmarks, addBookmark, removeBookmark
} from './services/api.js';
import { createNotificationManager } from './services/notifications.js';
import { createTopicListManager } from './components/topic-list.js';
import { createSettingsManager } from './components/settings.js';
import { createFilterBarManager } from './components/filter-bar.js';
import { createBookmarksManager, createLoginStatusManager } from './components/bookmarks.js';
import { createEventHandler } from './events/index.js';
import { DEFAULT_CONFIG, DEFAULT_USER_SETTINGS, ICONS } from './utils/constants.js';

// DOM 元素
const elements = {
  topicList: document.getElementById('topicList'),
  statusIndicator: document.getElementById('statusIndicator'),
  topicCountEl: document.getElementById('topicCount'),
  refreshProgress: document.getElementById('refreshProgress'),
  settingsBtn: document.getElementById('settingsBtn'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  settingsPanel: document.getElementById('settingsPanel'),
  resetSettingsBtn: document.getElementById('resetSettingsBtn'),
  pollingInterval: document.getElementById('pollingInterval'),
  lowDataMode: document.getElementById('lowDataMode'),
  categoryBlockList: document.getElementById('categoryBlockList'),
  keywordBlacklist: document.getElementById('keywordBlacklist'),
  qualityFilter: document.getElementById('qualityFilter'),
  hoverPreview: document.getElementById('hoverPreview'),
  readStatusAction: document.getElementById('readStatusAction'),
  showBadge: document.getElementById('showBadge'),
  notifyKeywords: document.getElementById('notifyKeywords'),
  fontSize: document.getElementById('fontSize'),
  compactMode: document.getElementById('compactMode'),
  categoryFilter: document.getElementById('categoryFilter'),
  subCategoryFilter: document.getElementById('subCategoryFilter'),
  subCategoryContainer: document.getElementById('subCategoryContainer'),
  sortFilter: document.getElementById('sortFilter'),
  loginStatus: document.getElementById('loginStatus'),
  loginPrompt: document.getElementById('loginPrompt')
};

// 服务层
const services = {
  fetchTopics,
  updateBadge,
  showNotification,
  markTopicReadOnSite,
  checkLoginStatus,
  getBookmarks,
  addBookmark,
  removeBookmark,

  async loadData() {
    return storage.loadAllData();
  },

  async saveConfig(config) {
    await storage.saveConfig(config);
  },

  async resetConfig() {
    await storage.saveConfig(DEFAULT_CONFIG);
    store.updateConfig(DEFAULT_CONFIG);
  },

  async saveUserSettings(settings) {
    await storage.saveUserSettings(settings);
  },

  async saveReadTopicIds(topicIds) {
    await storage.saveReadTopicIds(topicIds);
  },

  getConfig() {
    return store.getConfig();
  },

  checkNotifications(topics, readTopicIds, notifyKeywords) {
    notificationManager.notifyIfNeeded(topics, readTopicIds, notifyKeywords);
  }
};

// 创建通知管理器
const notificationManager = createNotificationManager({
  showNotification
});

// 初始化状态
const store = createStore();

// 创建组件管理器
const topicListManager = createTopicListManager(elements.topicList, {
  updateBadge: services.updateBadge
});

const settingsManager = createSettingsManager(elements, services);
const filterBarManager = createFilterBarManager(elements, services);
const bookmarksManager = createBookmarksManager(elements, services);
const loginStatusManager = createLoginStatusManager(elements, services);

// 创建事件处理器
const eventHandler = createEventHandler({
  store,
  services,
  topicListManager,
  settingsManager,
  filterBarManager,
  bookmarksManager,
  loginStatusManager,
  refreshProgress: elements.refreshProgress,
  statusIndicator: elements.statusIndicator
});

// 导出全局函数
window.__onToggleRead = (id) => {
  store.unmarkAsRead(id);
  services.saveReadTopicIds(store.getReadTopicIds());
  eventHandler.refreshTopicList();
};

/**
 * 应用外观设置
 */
function applyAppearance() {
  const config = store.getConfig();
  document.body.classList.remove('font-small', 'font-large', 'compact');

  if (config.fontSize === 'small') document.body.classList.add('font-small');
  if (config.fontSize === 'large') document.body.classList.add('font-large');
  if (config.compactMode) document.body.classList.add('compact');

  document.documentElement.setAttribute('data-theme', config.themeMode || 'system');
}

/**
 * 刷新主题列表
 */
function refreshTopicList() {
  eventHandler.refreshTopicList();
}

/**
 * 初始化
 */
async function init() {
  try {
    // 加载存储数据
    const savedData = await services.loadData();

    if (savedData.config) {
      store.updateConfig(savedData.config);
    }
    if (savedData.userSettings) {
      store.updateUserSettings(savedData.userSettings);
    }
    if (savedData.readTopicIds) {
      store.setReadTopicIds(Array.from(savedData.readTopicIds));
    }

    const state = store.getState();

    // 初始化 UI
    filterBarManager.init(
      refreshTopicList,  // 排序变更时的回调
      (settings) => {    // 分类变更时的回调
        // 保存设置并重新获取数据
        services.saveUserSettings(settings);
        store.updateUserSettings(settings);
        eventHandler.handleManualRefresh();
      }
    );
    filterBarManager.loadSettings(state.userSettings);

    settingsManager.init(() => {
      const newConfig = settingsManager.getConfig();
      store.updateConfig(newConfig);
      services.saveConfig(newConfig);
      applyAppearance();
      refreshTopicList();

      // 重启自动刷新
      if (state.autoRefreshEnabled) {
        eventHandler.startAutoRefresh();
      }
    });
    settingsManager.loadConfig(state.config);

    applyAppearance();

    // 设置图标
    const refreshBtn = document.getElementById('refreshBtn');
    const autoRefreshToggle = document.getElementById('autoRefreshToggle');
    refreshBtn.innerHTML = ICONS.refresh;
    autoRefreshToggle.innerHTML = ICONS.timer;

    if (state.autoRefreshEnabled) {
      autoRefreshToggle.classList.add('active');
    }

    // 检测登录状态并更新UI
    const loginStatus = await loginStatusManager.checkStatus();
    if (loginStatus.isLoggedIn) {
      elements.loginStatus.innerHTML = loginStatusManager.showLoggedInStatus();
      // 已登录，加载收藏
      await bookmarksManager.loadBookmarks();
    } else {
      elements.loginStatus.innerHTML = '';
    }

    // 初始化书签管理器
    bookmarksManager.init((topicId, bookmarked) => {
      console.log(`主题 ${topicId} ${bookmarked ? '已收藏' : '取消收藏'}`);
    });

    // 绑定事件
    eventHandler.bindAll();

    // 显示骨架屏并加载数据
    topicListManager.showSkeleton();
    await eventHandler.handleManualRefresh();

    // 启动自动刷新
    if (state.autoRefreshEnabled && state.config.pollingInterval > 0) {
      eventHandler.startAutoRefresh();
    }

  } catch (error) {
    console.error('初始化失败:', error);
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 导出供测试使用
export { store, services, topicListManager, settingsManager, filterBarManager, eventHandler };

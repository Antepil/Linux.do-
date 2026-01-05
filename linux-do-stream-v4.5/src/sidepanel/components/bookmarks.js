// 书签/收藏模块组件

import { ICONS } from '../utils/constants.js';
import { formatTime, escapeHtml } from '../utils/formatter.js';

/**
 * 创建书签管理器
 * @param {Object} elements - DOM 元素
 * @param {Object} services - 服务对象
 * @returns {Object}
 */
export function createBookmarksManager(elements, services) {
  let bookmarkedTopicIds = new Set();
  let isLoggedIn = false;
  let onBookmarkChange = null;

  return {
    /**
     * 初始化
     */
    init(onChange) {
      onBookmarkChange = onChange;
    },

    /**
     * 设置登录状态
     */
    setLoggedIn(loggedIn) {
      isLoggedIn = loggedIn;
    },

    /**
     * 加载用户收藏
     */
    async loadBookmarks() {
      if (!isLoggedIn) {
        return new Set();
      }

      const result = await services.getBookmarks();
      if (result.success && result.bookmarks) {
        // 提取收藏的主题ID
        const ids = result.bookmarks.map(b => b.topic_id || b.id);
        bookmarkedTopicIds = new Set(ids);
        return bookmarkedTopicIds;
      }
      return new Set();
    },

    /**
     * 获取收藏状态
     */
    isBookmarked(topicId) {
      return bookmarkedTopicIds.has(topicId);
    },

    /**
     * 切换收藏状态
     */
    async toggleBookmark(topicId) {
      if (!isLoggedIn) {
        return { success: false, error: 'NOT_LOGGED_IN' };
      }

      if (bookmarkedTopicIds.has(topicId)) {
        // 取消收藏
        const result = await services.removeBookmark(topicId);
        if (result.success) {
          bookmarkedTopicIds.delete(topicId);
          if (onBookmarkChange) onBookmarkChange(topicId, false);
          return { success: true, bookmarked: false };
        }
        return result;
      } else {
        // 添加收藏
        const result = await services.addBookmark(topicId);
        if (result.success) {
          bookmarkedTopicIds.add(topicId);
          if (onBookmarkChange) onBookmarkChange(topicId, true);
          return { success: true, bookmarked: true };
        }
        return result;
      }
    },

    /**
     * 获取收藏的主题ID集合
     */
    getBookmarkedIds() {
      return bookmarkedTopicIds;
    },

    /**
     * 创建收藏按钮HTML
     */
    createBookmarkButton(topicId, compact = false) {
      const isBookmarked = bookmarkedTopicIds.has(topicId);
      const title = isBookmarked ? '取消收藏' : '收藏';
      const icon = isBookmarked ? ICONS.bookmark : ICONS.bookmarkOutline;

      return `
        <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}"
                data-topic-id="${topicId}"
                title="${title}"
                aria-label="${title}">
          ${icon}
        </button>
      `;
    }
  };
}

/**
 * 创建登录状态管理器
 * @param {Object} elements - DOM 元素
 * @param {Object} services - 服务对象
 * @returns {Object}
 */
export function createLoginStatusManager(elements, services) {
  let isLoggedIn = false;
  let currentUser = null;

  return {
    /**
     * 检测登录状态
     */
    async checkStatus() {
      const result = await services.checkLoginStatus();
      isLoggedIn = result.loggedIn;
      currentUser = result.user;
      return { isLoggedIn, currentUser };
    },

    /**
     * 获取登录状态
     */
    getStatus() {
      return { isLoggedIn, currentUser };
    },

    /**
     * 显示登录提示
     */
    showLoginPrompt() {
      return `
        <div class="login-prompt">
          <div class="login-prompt-icon">${ICONS.login}</div>
          <p>请先登录 Linux.do 以使用收藏功能</p>
          <a href="https://linux.do/login" target="_blank" class="login-btn">
            前往登录
          </a>
        </div>
      `;
    },

    /**
     * 显示已登录状态
     */
    showLoggedInStatus() {
      if (!currentUser) return '';
      const username = currentUser.username || currentUser.name || '用户';
      return `
        <div class="logged-in-status">
          <span class="user-avatar">
            ${currentUser.avatar_template ?
              `<img src="https://linux.do${currentUser.avatar_template.replace('{size}', '25')}" alt="">` :
              ICONS.user.replace('<svg class="icon-svg"', '<svg class="icon-svg" width="16" height="16"')
            }
          </span>
          <span class="user-name">${escapeHtml(username)}</span>
        </div>
      `;
    },

    /**
     * 打开登录页面
     */
    openLoginPage() {
      chrome.tabs.create({ url: 'https://linux.do/login' });
    }
  };
}

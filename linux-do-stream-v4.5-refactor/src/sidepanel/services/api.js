// API 服务 - 处理与后台的通信

import { CATEGORIES, API_ENDPOINTS } from '../utils/constants.js';

/**
 * 获取主题列表
 * @param {Object} options - 选项
 * @param {string} options.categoryFilter - 分类筛选
 * @param {string} options.subCategoryFilter - 子分类筛选
 * @returns {Promise<Object>} API 响应
 */
export async function fetchTopics({ categoryFilter, subCategoryFilter }) {
  let endpoint = API_ENDPOINTS.latest;

  if (categoryFilter === 'top') {
    endpoint = API_ENDPOINTS.top;
  } else if (categoryFilter === 'categories') {
    const cat = CATEGORIES.find(c => c.id == subCategoryFilter);
    if (cat) {
      endpoint = `/c/${cat.slug}/${cat.id}.json`;
    }
  }

  return chrome.runtime.sendMessage({ type: 'FETCH_API', endpoint });
}

/**
 * 发送消息到后台
 * @param {Object} message - 消息对象
 * @returns {Promise<any>}
 */
export function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

/**
 * 标记主题为已读（站内同步）
 * @param {number} topicId - 主题 ID
 * @param {number} postNumber - 帖子编号
 * @returns {Promise<void>}
 */
export async function markTopicReadOnSite(topicId, postNumber) {
  return sendMessage({
    type: 'MARK_READ_ON_SITE',
    topicId,
    postNumber
  });
}

/**
 * 更新扩展图标角标
 * @param {number} count - 未读数量
 * @returns {Promise<void>}
 */
export async function updateBadge(count) {
  return sendMessage({ type: 'UPDATE_BADGE', count });
}

/**
 * 显示通知
 * @param {string} text - 通知内容
 * @returns {Promise<void>}
 */
export async function showNotification(text) {
  return sendMessage({ type: 'SHOW_NOTIFICATION', text });
}

/**
 * 获取用户书签
 * @returns {Promise<Object>} 包含 bookmarks 和 total
 */
export async function fetchUserBookmarks() {
  return sendMessage({ type: 'FETCH_USER_BOOKMARKS' });
}

/**
 * 从服务器刷新书签列表
 * @returns {Promise<Object[]>} 书签数组
 */
export async function refreshBookmarksFromServer() {
  const response = await fetchUserBookmarks();
  if (response && response.success) {
    return response.bookmarks;
  }
  return [];
}

/**
 * 构建 API 响应处理器
 * @returns {Object}
 */
export function createApiHandlers() {
  return {
    /**
     * 处理 API 响应
     * @param {Object} response - API 响应
     * @returns {Object}
     */
    handleResponse(response) {
      if (response && response.success && response.topics) {
        return {
          success: true,
          topics: response.topics,
          users: response.users || []
        };
      }
      return {
        success: false,
        error: response?.error || '获取数据失败',
        topics: [],
        users: []
      };
    }
  };
}

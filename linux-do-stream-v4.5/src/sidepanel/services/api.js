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
 * 检测用户登录状态
 * @returns {Promise<Object>}
 */
export async function checkLoginStatus() {
  return chrome.runtime.sendMessage({ type: 'CHECK_LOGIN_STATUS' });
}

/**
 * 获取用户信息
 * @returns {Promise<Object>}
 */
export async function getUserInfo() {
  return chrome.runtime.sendMessage({ type: 'GET_USER_INFO' });
}

/**
 * 获取用户收藏列表
 * @returns {Promise<Object>}
 */
export async function getBookmarks() {
  return chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS' });
}

/**
 * 添加收藏
 * @param {number} topicId - 主题ID
 * @returns {Promise<Object>}
 */
export async function addBookmark(topicId) {
  return chrome.runtime.sendMessage({ type: 'ADD_BOOKMARK', topicId });
}

/**
 * 取消收藏
 * @param {number} topicId - 主题ID
 * @returns {Promise<Object>}
 */
export async function removeBookmark(topicId) {
  return chrome.runtime.sendMessage({ type: 'REMOVE_BOOKMARK', topicId });
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

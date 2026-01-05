// 状态管理 - 轻量级状态机

import { DEFAULT_CONFIG, DEFAULT_USER_SETTINGS } from '../utils/constants.js';

export class Store {
  constructor(initialState = {}) {
    this.state = {
      config: { ...DEFAULT_CONFIG, ...initialState.config },
      userSettings: { ...DEFAULT_USER_SETTINGS, ...initialState.userSettings },
      topics: [],
      readTopicIds: new Set(),
      usersMap: new Map(),
      autoRefreshEnabled: true,
      ...initialState
    };
    this.listeners = new Set();
  }

  /**
   * 获取完整状态
   */
  getState() {
    return this.state;
  }

  /**
   * 获取配置
   */
  getConfig() {
    return this.state.config;
  }

  /**
   * 获取用户设置
   */
  getUserSettings() {
    return this.state.userSettings;
  }

  /**
   * 获取主题列表
   */
  getTopics() {
    return this.state.topics;
  }

  /**
   * 获取已读主题 ID 集合
   */
  getReadTopicIds() {
    return this.state.readTopicIds;
  }

  /**
   * 检查主题是否已读
   * @param {number} topicId
   */
  isTopicRead(topicId) {
    const { readTopicIds, config } = this.state;
    return readTopicIds.has(topicId);
  }

  /**
   * 更新配置
   * @param {Object} partialConfig - 部分配置
   */
  updateConfig(partialConfig) {
    this.state.config = { ...this.state.config, ...partialConfig };
    this._notify('config');
  }

  /**
   * 更新用户设置
   * @param {Object} partialSettings - 部分设置
   */
  updateUserSettings(partialSettings) {
    this.state.userSettings = { ...this.state.userSettings, ...partialSettings };
    this._notify('userSettings');
  }

  /**
   * 设置主题列表
   * @param {Array} topics
   * @param {Map} usersMap - 用户数据映射表
   */
  setTopics(topics, usersMap = null) {
    this.state.topics = topics;
    if (usersMap) {
      this.state.usersMap = usersMap;
    }
    this._notify('topics');
  }

  /**
   * 添加新主题
   * @param {Array} newTopics
   */
  addTopics(newTopics) {
    const existingIds = new Set(this.state.topics.map(t => t.id));
    const unique = newTopics.filter(t => !existingIds.has(t.id));
    if (unique.length > 0) {
      this.state.topics = [...unique, ...this.state.topics];
      this._notify('topics');
    }
    return unique;
  }

  /**
   * 标记主题为已读
   * @param {number} topicId
   */
  markAsRead(topicId) {
    this.state.readTopicIds.add(topicId);
    this._notify('readTopicIds');
  }

  /**
   * 取消主题已读状态
   * @param {number} topicId
   */
  unmarkAsRead(topicId) {
    this.state.readTopicIds.delete(topicId);
    this._notify('readTopicIds');
  }

  /**
   * 批量设置已读主题
   * @param {Array} topicIds
   */
  setReadTopicIds(topicIds) {
    this.state.readTopicIds = new Set(topicIds);
    this._notify('readTopicIds');
  }

  /**
   * 设置自动刷新状态
   * @param {boolean} enabled
   */
  setAutoRefresh(enabled) {
    this.state.autoRefreshEnabled = enabled;
    this._notify('autoRefreshEnabled');
  }

  /**
   * 获取用户数据
   * @param {number} userId
   */
  getUser(userId) {
    return this.state.usersMap.get(userId);
  }

  /**
   * 订阅状态变化
   * @param {Function} callback - 回调函数
   * @param {string} [key] - 可选，指定监听的状态键
   * @returns {Function} 取消订阅函数
   */
  subscribe(callback, key = null) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * 通知所有监听器
   * @private
   */
  _notify(changedKey = null) {
    const stateSnapshot = this.getState();
    this.listeners.forEach(fn => fn(stateSnapshot, changedKey));
  }
}

// 导出单例工厂函数
export function createStore(initialState) {
  return new Store(initialState);
}

// 通知服务 - 处理关键词提醒和系统通知

import { parseKeywords, isTopicRecent } from '../utils/formatter.js';

/**
 * 检查并发送关键词通知
 * @param {Object} params - 参数
 * @param {Array} params.topics - 主题列表
 * @param {Set} params.readTopicIds - 已读主题 ID 集合
 * @param {string} params.notifyKeywords - 关键词配置
 * @param {Function} params.sendNotification - 发送通知函数
 * @returns {Array} 匹配到的新主题
 */
export function checkKeywordNotifications({ topics, readTopicIds, notifyKeywords, sendNotification }) {
  if (!notifyKeywords) return [];

  const keywords = parseKeywords(notifyKeywords);
  if (keywords.length === 0) return [];

  const newTopics = topics.filter(t =>
    isTopicRecent(t) && !readTopicIds.has(t.id)
  );

  const matched = [];

  newTopics.forEach(t => {
    const title = t.title.toLowerCase();
    if (keywords.some(k => title.includes(k))) {
      matched.push(t);
      sendNotification(t.title);
    }
  });

  return matched;
}

/**
 * 创建通知管理器
 * @param {Object} services - 服务对象
 * @returns {Object}
 */
export function createNotificationManager(services) {
  let lastNotificationTime = 0;
  const NOTIFICATION_COOLDOWN = 5000; // 5秒冷却

  return {
    /**
     * 检查主题并发送通知
     * @param {Array} topics
     * @param {Set} readTopicIds
     * @param {string} notifyKeywords
     */
    notifyIfNeeded(topics, readTopicIds, notifyKeywords) {
      const now = Date.now();
      if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
        return;
      }

      checkKeywordNotifications({
        topics,
        readTopicIds,
        notifyKeywords,
        sendNotification: (text) => {
          lastNotificationTime = now;
          services.showNotification(text);
        }
      });
    },

    /**
     * 清除冷却时间
     */
    resetCooldown() {
      lastNotificationTime = 0;
    }
  };
}

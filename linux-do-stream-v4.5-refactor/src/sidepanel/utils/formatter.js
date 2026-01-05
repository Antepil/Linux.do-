// 格式化工具函数

/**
 * 格式化时间差
 * @param {string} iso - ISO 时间字符串
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(iso) {
  const d = new Date(iso);
  const diff = (new Date() - d) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * 格式化数字 (支持大数字)
 * @param {number} n - 数字
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n;
}

/**
 * HTML 转义
 * @param {string} text - 原始文本
 * @returns {string} 转义后的 HTML
 */
export function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

/**
 * 判断主题是否是新发布的
 * @param {Object} topic - 主题对象
 * @param {number} threshold - 时间阈值 (毫秒)
 * @returns {boolean}
 */
export function isTopicRecent(topic, threshold = 14400000) {
  return (new Date() - new Date(topic.created_at)) < threshold;
}

/**
 * 格式化日期
 * @param {string} iso - ISO 时间字符串
 * @returns {string} 格式化后的日期
 */
export function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 截取字符串并添加省略号
 * @param {string} str - 原始字符串
 * @param {number} maxLength - 最大长度
 * @returns {string}
 */
export function truncate(str, maxLength = 50) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * 解析关键词列表
 * @param {string} keywords - 逗号分隔的关键词
 * @returns {string[]} 关键词数组
 */
export function parseKeywords(keywords) {
  return keywords
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(k => k);
}

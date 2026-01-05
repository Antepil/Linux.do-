// 存储管理 - Chrome Storage 封装

/**
 * 加载存储数据
 * @param {string[]} keys - 要加载的键
 * @returns {Promise<Object>}
 */
export async function loadStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * 保存数据到存储
 * @param {Object} data - 要保存的数据
 * @returns {Promise<void>}
 */
export async function saveStorage(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * 清除存储
 * @returns {Promise<void>}
 */
export async function clearStorage() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * 加载配置
 * @returns {Promise<Object>}
 */
export async function loadConfig() {
  const result = await loadStorage(['config']);
  return result.config || {};
}

/**
 * 保存配置
 * @param {Object} config - 配置对象
 * @returns {Promise<void>}
 */
export async function saveConfig(config) {
  await saveStorage({ config });
}

/**
 * 加载用户设置
 * @returns {Promise<Object>}
 */
export async function loadUserSettings() {
  const result = await loadStorage(['userSettings']);
  return result.userSettings || {};
}

/**
 * 保存用户设置
 * @param {Object} settings - 设置对象
 * @returns {Promise<void>}
 */
export async function saveUserSettings(settings) {
  await saveStorage({ userSettings: settings });
}

/**
 * 加载已读主题 ID
 * @returns {Promise<Set>}
 */
export async function loadReadTopicIds() {
  const result = await loadStorage(['readTopicIds']);
  if (result.readTopicIds) {
    return new Set(result.readTopicIds);
  }
  return new Set();
}

/**
 * 保存已读主题 ID
 * @param {Set} topicIds - 主题 ID 集合
 * @returns {Promise<void>}
 */
export async function saveReadTopicIds(topicIds) {
  await saveStorage({ readTopicIds: Array.from(topicIds) });
}

/**
 * 批量加载所有持久化数据
 * @returns {Promise<Object>}
 */
export async function loadAllData() {
  const result = await loadStorage(['config', 'userSettings', 'readTopicIds', 'bookmarks']);
  return {
    config: result.config || {},
    userSettings: result.userSettings || {},
    readTopicIds: result.readTopicIds ? new Set(result.readTopicIds) : new Set(),
    bookmarks: result.bookmarks || []
  };
}

/**
 * 加载书签列表
 * @returns {Promise<Object[]>}
 */
export async function loadBookmarks() {
  const result = await loadStorage(['bookmarks']);
  return result.bookmarks || [];
}

/**
 * 保存书签列表
 * @param {Object[]} bookmarks - 书签数组
 * @returns {Promise<void>}
 */
export async function saveBookmarks(bookmarks) {
  await saveStorage({ bookmarks });
}

/**
 * 添加书签
 * @param {Object} topic - 主题对象
 * @returns {Promise<Object[]>}
 */
export async function addBookmark(topic) {
  const bookmarks = await loadBookmarks();
  // 检查是否已存在
  if (!bookmarks.find(b => b.id === topic.id)) {
    bookmarks.unshift({
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      created_at: topic.created_at || new Date().toISOString(),
      saved_at: new Date().toISOString()
    });
    await saveBookmarks(bookmarks);
  }
  return bookmarks;
}

/**
 * 移除书签
 * @param {number} topicId - 主题 ID
 * @returns {Promise<Object[]>}
 */
export async function removeBookmark(topicId) {
  const bookmarks = await loadBookmarks();
  const filtered = bookmarks.filter(b => b.id !== topicId);
  await saveBookmarks(filtered);
  return filtered;
}

/**
 * 检查是否已收藏
 * @param {number} topicId - 主题 ID
 * @returns {Promise<boolean>}
 */
export async function isBookmarked(topicId) {
  const bookmarks = await loadBookmarks();
  return bookmarks.some(b => b.id === topicId);
}

/**
 * 保存所有数据
 * @param {Object} data - 包含 config, userSettings, readTopicIds 的对象
 * @returns {Promise<void>}
 */
export async function saveAllData(data) {
  const toSave = {};
  if (data.config) toSave.config = data.config;
  if (data.userSettings) toSave.userSettings = data.userSettings;
  if (data.readTopicIds) toSave.readTopicIds = Array.from(data.readTopicIds);
  await saveStorage(toSave);
}

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
  const result = await loadStorage(['config', 'userSettings', 'readTopicIds']);
  return {
    config: result.config || {},
    userSettings: result.userSettings || {},
    readTopicIds: result.readTopicIds ? new Set(result.readTopicIds) : new Set()
  };
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

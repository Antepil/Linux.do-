// Background Service Worker - 统一入口
// 注意：Manifest V3 service worker 不完全支持 ES modules，
// 这里使用内联方式组织代码

const BASE_URL = 'https://linux.do';

// ==================== 角标管理 ====================

function updateBadge(count) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count > 99 ? '99+' : count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#FF3B30' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// ==================== API 服务 ====================

async function fetchWithRetry(endpoint, retries = 2) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const jsonUrl = url.includes('.json') ? url : `${url}.json`;

  try {
    const response = await fetch(jsonUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 403 && retries > 0) {
        return fetchWithRetry(url, retries - 1);
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    let topics = [];

    if (data.topic_list?.topics) {
      topics = data.topic_list.topics;
    } else if (data.topics) {
      topics = data.topics;
    } else if (Array.isArray(data)) {
      topics = data;
    }

    return {
      success: true,
      topics,
      users: data.users
    };
  } catch (error) {
    console.error(`抓取失败 [${jsonUrl}]:`, error);
    return { success: false, error: error.message, topics: [], users: [] };
  }
}

// ==================== 用户认证与书签 ====================

async function checkLoginStatus() {
  try {
    const response = await fetch(`${BASE_URL}/session/current.json`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return { loggedIn: true, user: data.current_user || null };
    }
    return { loggedIn: false, user: null };
  } catch (error) {
    console.error('检测登录状态失败:', error);
    return { loggedIn: false, user: null, error: error.message };
  }
}

async function getUserInfo() {
  try {
    const response = await fetch(`${BASE_URL}/u/current.json`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include'
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

async function getBookmarks() {
  try {
    const response = await fetch(`${BASE_URL}/user-bookmarks.json`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, bookmarks: data.bookmarks || [] };
    }
    return { success: false, bookmarks: [], error: '未登录或无权限' };
  } catch (error) {
    console.error('获取收藏失败:', error);
    return { success: false, bookmarks: [], error: error.message };
  }
}

async function addBookmark(topicId) {
  try {
    const formData = new FormData();
    formData.append('topic_id', topicId);

    const response = await fetch(`${BASE_URL}/bookmarks`, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: formData,
      credentials: 'include'
    });

    if (response.ok) {
      return { success: true, message: '收藏成功' };
    }
    return { success: false, message: '收藏失败' };
  } catch (error) {
    console.error('添加收藏失败:', error);
    return { success: false, message: error.message };
  }
}

async function removeBookmark(topicId) {
  try {
    const response = await fetch(`${BASE_URL}/bookmarks/${topicId}`, {
      method: 'DELETE',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'include'
    });

    if (response.ok) {
      return { success: true, message: '取消收藏成功' };
    }
    return { success: false, message: '取消收藏失败' };
  } catch (error) {
    console.error('取消收藏失败:', error);
    return { success: false, message: error.message };
  }
}

// ==================== 消息处理 ====================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // API 请求
  if (message.type === 'FETCH_API') {
    fetchWithRetry(message.endpoint).then(sendResponse);
    return true;
  }

  // 检测用户登录状态
  if (message.type === 'CHECK_LOGIN_STATUS') {
    checkLoginStatus().then(sendResponse);
    return true;
  }

  // 获取用户信息
  if (message.type === 'GET_USER_INFO') {
    getUserInfo().then(sendResponse);
    return true;
  }

  // 获取用户收藏
  if (message.type === 'GET_BOOKMARKS') {
    getBookmarks().then(sendResponse);
    return true;
  }

  // 添加收藏
  if (message.type === 'ADD_BOOKMARK') {
    addBookmark(message.topicId).then(sendResponse);
    return true;
  }

  // 取消收藏
  if (message.type === 'REMOVE_BOOKMARK') {
    removeBookmark(message.topicId).then(sendResponse);
    return true;
  }

  // 更新角标
  if (message.type === 'UPDATE_BADGE') {
    updateBadge(message.count);
    return true;
  }

  // 显示通知
  if (message.type === 'SHOW_NOTIFICATION') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'Linux.do 强提醒',
      message: message.text,
      priority: 2
    });
    return true;
  }

  // 站内已读上报
  if (message.type === 'MARK_READ_ON_SITE') {
    const formData = new FormData();
    formData.append('topic_id', message.topicId);
    formData.append('post_number', message.postNumber);

    fetch(`${BASE_URL}/topics/read`, {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: formData,
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => console.log('Mark read success:', data))
      .catch(err => console.error('Mark read failed:', err));
    return true;
  }
});

// 点击图标打开侧边栏
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

console.log('Linux.do Background Service Worker 已加载');

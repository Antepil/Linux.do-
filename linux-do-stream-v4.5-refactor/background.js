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

// ==================== 书签服务 ====================

async function fetchUserBookmarks(retries = 2) {
  try {
    const response = await fetch(`${BASE_URL}/user_bookmarks.json`, {
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
        return fetchUserBookmarks(retries - 1);
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const bookmarks = [];

    // 解析书签数据
    if (data.user_bookmarks && Array.isArray(data.user_bookmarks)) {
      data.user_bookmarks.forEach(item => {
        if (item.topic) {
          bookmarks.push({
            id: item.topic.id,
            title: item.topic.title,
            slug: item.topic.slug,
            posts_count: item.topic.posts_count || 0,
            views: item.topic.views || 0,
            last_posted_at: item.topic.last_posted_at || item.created_at,
            created_at: item.created_at,
            bookmarked_at: item.created_at,
            category_id: item.topic.category_id,
            posters: item.topic.posters,
            excerpt: item.topic.excerpt
          });
        }
      });
    }

    return {
      success: true,
      bookmarks,
      total: bookmarks.length
    };
  } catch (error) {
    console.error(`获取书签失败:`, error);
    return { success: false, error: error.message, bookmarks: [], total: 0 };
  }
}

// ==================== 消息处理 ====================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // API 请求
  if (message.type === 'FETCH_API') {
    fetchWithRetry(message.endpoint).then(sendResponse);
    return true;
  }

  // 获取用户书签
  if (message.type === 'FETCH_USER_BOOKMARKS') {
    fetchUserBookmarks().then(sendResponse);
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

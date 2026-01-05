// 主题列表组件

import { CATEGORIES, TAG_COLORS, TRUST_BADGES, ICONS } from '../utils/constants.js';
import { formatTime, formatNumber, escapeHtml, isTopicRecent } from '../utils/formatter.js';

/**
 * 创建信任等级徽章 HTML
 * @param {number} level - 信任等级
 * @param {boolean} isAdmin - 是否管理员
 * @returns {string}
 */
export function createTrustBadge(level, isAdmin) {
  if (isAdmin) {
    const badge = TRUST_BADGES.admin;
    return `<span class="trust-badge admin" title="${badge.title}">
      <svg viewBox="0 0 24 24"><path d="${badge.icon}"/></svg>
    </span>`;
  }

  const badge = TRUST_BADGES[level];
  if (!badge) return '';

  return `<span class="trust-badge ${badge.class}" title="${badge.title}">
    <svg viewBox="0 0 24 24">${badge.icon}</svg>
  </span>`;
}

/**
 * 获取分类信息
 * @param {number} categoryId
 * @returns {Object}
 */
function getCategoryInfo(categoryId) {
  return CATEGORIES.find(c => c.id == categoryId) || { name: '其他', color: 'tag-default' };
}

/**
 * 创建单个主题元素
 * @param {Object} topic - 主题数据
 * @param {Object} options - 选项
 * @returns {HTMLElement}
 */
export function createTopicElement(topic, options) {
  const {
    config,
    readTopicIds,
    usersMap
  } = options;

  const el = document.createElement('div');
  el.className = 'topic-item';
  el.dataset.topicId = topic.id;

  // 智能已读识别
  const isSiteRead = config.syncReadStatus && topic.last_read_post_number &&
    topic.last_read_post_number >= topic.highest_post_number;
  const isRead = readTopicIds.has(topic.id) || isSiteRead;

  if (isRead && config.readStatusAction === 'fade') {
    el.classList.add('read');
  }

  const time = formatTime(topic.last_posted_at || topic.created_at);
  const isNew = isTopicRecent(topic) && !isRead;
  const cat = getCategoryInfo(topic.category_id);
  const excerpt = config.lowDataMode ? '' : (topic.excerpt || topic.title);

  // 生成标签 HTML
  let tagsHtml = `<span class="category-tag ${cat.color}">${cat.name}</span>`;
  if (topic.tags && topic.tags.length > 0) {
    topic.tags.slice(0, 2).forEach(tag => {
      const tagColor = TAG_COLORS[tag] || 'tag-default';
      tagsHtml += `<span class="category-tag ${tagColor}" style="margin-left:4px">${tag}</span>`;
    });
  }

  // 提取信任等级
  let trustLevel = 0;
  let isAdmin = false;

  if (topic.posters && topic.posters.length > 0) {
    const latestPoster = topic.posters.find(p => p.extras === 'latest') ||
      topic.posters[topic.posters.length - 1];
    const userId = latestPoster?.user_id;

    if (userId && usersMap?.has(userId)) {
      const userData = usersMap.get(userId);
      trustLevel = userData.trust_level || 0;
      isAdmin = userData.admin || false;
    }
  }

  const trustBadge = createTrustBadge(trustLevel, isAdmin);

  // 构建 HTML
  el.innerHTML = `
    ${isNew ? '<div class="new-dot"></div>' : ''}
    <div class="tag-container">${tagsHtml}</div>
    <div class="topic-title">${escapeHtml(topic.title)}</div>
    ${excerpt ? `<div class="topic-excerpt">${escapeHtml(excerpt)}</div>` : ''}
    <div class="topic-meta">
      <div class="meta-group">
        ${!config.lowDataMode ? ICONS.user : ''} <span>${topic.last_poster_username || '匿名'}</span>
        ${trustBadge}
      </div>
      <div class="meta-group">
        ${ICONS.posts} <span>${formatNumber(topic.posts_count)}</span>
        ${ICONS.views} <span>${formatNumber(topic.views)}</span>
        <span style="margin-left:4px">${time}</span>
      </div>
    </div>
  `;

  return el;
}

/**
 * 主题列表管理器
 * @param {HTMLElement} container - 容器元素
 * @param {Object} services - 服务对象
 */
export function createTopicListManager(container, services) {
  let hoverTimer = null;

  return {
    /**
     * 渲染主题列表
     * @param {Array} topics - 主题列表
     * @param {Object} state - 状态对象
     */
    render(topics, state) {
      const { config, readTopicIds, usersMap } = state;

      // 更新角标
      if (config.showBadge) {
        const unreadCount = topics.filter(t => !readTopicIds.has(t.id)).length;
        services.updateBadge(unreadCount);
      } else {
        services.updateBadge(0);
      }

      if (topics.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-tertiary)">暂无内容 (可能被过滤)</div>';
        return;
      }

      const fragment = document.createDocumentFragment();
      topics.forEach(t => {
        fragment.appendChild(createTopicElement(t, {
          config,
          readTopicIds,
          usersMap
        }));
      });

      requestAnimationFrame(() => {
        container.innerHTML = '';
        container.appendChild(fragment);
      });
    },

    /**
     * 显示骨架屏
     */
    showSkeleton() {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < 6; i++) {
        const s = document.createElement('div');
        s.className = 'skeleton-item';
        s.innerHTML = '<div class="skeleton-line" style="width:80%"></div><div class="skeleton-line" style="width:60%"></div><div class="skeleton-line" style="width:40%"></div>';
        fragment.appendChild(s);
      }
      container.innerHTML = '';
      container.appendChild(fragment);
    },

    /**
     * 设置悬停预览
     * @param {boolean} enabled
     */
    setHoverPreview(enabled) {
      if (!enabled) {
        container.querySelectorAll('.topic-item').forEach(el => {
          el.classList.remove('show-preview');
        });
      }
    },

    /**
     * 绑定点击事件
     * @param {Function} handler - 点击处理函数
     */
    bindClick(handler) {
      container.onclick = (e) => {
        const item = e.target.closest('.topic-item');
        if (item) {
          handler(parseInt(item.dataset.topicId));
        }
      };
    },

    /**
     * 绑定右键菜单
     * @param {Function} handler - 右键处理函数
     */
    bindContextMenu(handler) {
      container.oncontextmenu = (e) => {
        const item = e.target.closest('.topic-item');
        if (item) {
          e.preventDefault();
          handler(e, parseInt(item.dataset.topicId));
        }
      };
    },

    /**
     * 绑定悬停预览
     * @param {Function} handler - 悬停处理函数
     */
    bindHoverPreview(handler) {
      if (!handler) return;

      container.querySelectorAll('.topic-item').forEach(el => {
        el.onmouseenter = () => {
          hoverTimer = setTimeout(() => {
            requestAnimationFrame(() => el.classList.add('show-preview'));
          }, 300);
        };
        el.onmouseleave = () => {
          clearTimeout(hoverTimer);
          requestAnimationFrame(() => el.classList.remove('show-preview'));
        };
      });
    }
  };
}

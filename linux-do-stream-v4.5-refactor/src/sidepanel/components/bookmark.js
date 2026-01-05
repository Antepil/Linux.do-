// 书签管理组件

import { CATEGORIES, TAG_COLORS, ICONS } from '../utils/constants.js';
import { formatTime, formatNumber, escapeHtml } from '../utils/formatter.js';

/**
 * 获取分类信息
 * @ categoryId
 *param {number} @returns {Object}
 */
function getCategoryInfo(categoryId) {
  return CATEGORIES.find(c => c.id == categoryId) || { name: '其他', color: 'tag-default' };
}

/**
 * 创建书签管理器
 * @param {Object} elements - DOM 元素
 * @param {Object} services - 服务对象
 * @returns {Object}
 */
export function createBookmarkManager(elements, services) {
  let onChangeCallback = null;

  return {
    /**
     * 初始化
     * @param {Function} onChange - 变化回调
     */
    init(onChange) {
      onChangeCallback = onChange;
    },

    /**
     * 从服务器加载并渲染书签列表
     */
    async loadAndRenderBookmarks() {
      const container = elements.topicList;
      container.innerHTML = `
        <div class="skeleton-item" style="padding: 16px;">
          <div class="skeleton-line" style="width: 80%;"></div>
          <div class="skeleton-line" style="width: 50%;"></div>
        </div>
      `;

      const bookmarks = await services.refreshBookmarksFromServer();
      this.renderBookmarks(bookmarks);
      elements.topicCountEl.textContent = bookmarks.length;

      // 更新状态指示器
      const statusIndicator = document.getElementById('statusIndicator');
      const statusLabel = document.querySelector('.status-label');
      if (statusIndicator) {
        statusIndicator.style.background = 'var(--apple-orange)';
        statusIndicator.style.boxShadow = '0 0 8px var(--apple-orange)';
      }
      if (statusLabel) {
        statusLabel.textContent = 'Bookmarks';
      }

      return bookmarks;
    },

    /**
     * 渲染书签列表
     * @param {Object[]} bookmarks - 书签数组
     */
    renderBookmarks(bookmarks) {
      const container = elements.topicList;

      if (!bookmarks || bookmarks.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">${ICONS.bookmark}</div>
            <p>暂无书签</p>
            <p class="empty-hint">请确保已登录 Linux.do 账号</p>
          </div>
        `;
        return;
      }

      container.innerHTML = bookmarks.map(bookmark => {
        const cat = getCategoryInfo(bookmark.category_id);
        const time = formatTime(bookmark.bookmarked_at || bookmark.created_at);

        return `
          <div class="topic-item bookmark-item" data-id="${bookmark.id}">
            ${bookmark.category_id ? `<div class="tag-container"><span class="category-tag ${cat.color}">${cat.name}</span></div>` : ''}
            <a href="https://linux.do/t/${bookmark.id}" target="_blank" class="topic-title-link">
              <span class="topic-title">${escapeHtml(bookmark.title)}</span>
            </a>
            <div class="topic-meta">
              <div class="meta-group">
                ${ICONS.posts} <span>${formatNumber(bookmark.posts_count)}</span>
                ${ICONS.views} <span>${formatNumber(bookmark.views)}</span>
                <span style="margin-left: 4px;">${time}</span>
              </div>
              <span class="meta-group bookmark-actions">
                <button class="icon-btn bookmark-remove-btn" title="移除书签" data-id="${bookmark.id}">
                  ${ICONS.trash}
                </button>
              </span>
            </div>
          </div>
        `;
      }).join('');

      // 绑定移除按钮事件
      container.querySelectorAll('.bookmark-remove-btn').forEach(btn => {
        btn.onclick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const topicId = parseInt(btn.dataset.id);
          await services.removeBookmark(topicId);

          // 重新加载并刷新角标
          await this.loadAndRenderBookmarks();
          this.updateBadgeCount();

          if (onChangeCallback) onChangeCallback();
        };
      });
    },

    /**
     * 渲染帖子列表中的书签按钮
     * @param {HTMLElement} item - 帖子元素
     * @param {Object} topic - 帖子数据
     * @param {boolean} bookmarked - 是否已收藏
     */
    async renderBookmarkButton(item, topic, bookmarked) {
      // 检查是否已有书签按钮
      let btn = item.querySelector('.bookmark-btn');
      if (!btn) {
        btn = document.createElement('button');
        btn.className = 'icon-btn bookmark-btn';
        btn.title = '添加书签';

        // 插入到 meta-group 后面
        const meta = item.querySelector('.topic-meta');
        if (meta) {
          meta.insertBefore(btn, meta.lastElementChild);
        }
      }

      btn.innerHTML = bookmarked ? ICONS.bookmarkFilled : ICONS.bookmarkEmpty;
      btn.title = bookmarked ? '取消书签' : '添加书签';
      btn.classList.toggle('bookmarked', bookmarked);

      // 绑定点击事件
      btn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (bookmarked) {
          await services.removeBookmark(topic.id);
        } else {
          await services.addBookmark(topic);
        }

        if (onChangeCallback) onChangeCallback();
      };
    },

    /**
     * 更新所有帖子的书签状态
     * @param {Object[]} topics - 帖子列表
     */
    async updateAllBookmarkButtons(topics) {
      const items = elements.topicList.querySelectorAll('.topic-item:not(.bookmark-item)');

      for (const item of items) {
        const topicId = parseInt(item.dataset.id);
        const topic = topics.find(t => t.id === topicId);
        if (topic) {
          const bookmarked = await services.isBookmarked(topicId);
          this.renderBookmarkButton(item, topic, bookmarked);
        }
      }
    },

    /**
     * HTML 转义
     * @param {string} text - 文本
     * @returns {string}
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    /**
     * 更新角标数量
     */
    async updateBadgeCount() {
      try {
        const bookmarks = await services.refreshBookmarksFromServer();
        const badge = document.getElementById('bookmarkBadge');
        if (badge) {
          if (bookmarks && bookmarks.length > 0) {
            badge.textContent = bookmarks.length > 99 ? '99+' : bookmarks.length;
            badge.style.display = 'flex';
          } else {
            badge.style.display = 'none';
          }
        }
      } catch (error) {
        console.error('更新书签角标失败:', error);
      }
    }
  };
}

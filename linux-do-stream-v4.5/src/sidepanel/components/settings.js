// 设置面板组件

import { CATEGORIES } from '../utils/constants.js';

/**
 * 创建设置面板管理器
 * @param {Object} elements - DOM 元素
 * @param {Object} services - 服务对象
 * @returns {Object}
 */
export function createSettingsManager(elements, services) {
  let onChangeCallback = null;

  return {
    /**
     * 初始化
     * @param {Function} onChange - 变化回调
     */
    init(onChange) {
      onChangeCallback = onChange;
      this.bindEvents();
      this.renderCategoryBlockList();
    },

    /**
     * 绑定事件
     */
    bindEvents() {
      // 关闭按钮
      elements.closeSettingsBtn.onclick = () => {
        elements.settingsPanel.classList.remove('open');
      };

      // 重置按钮
      elements.resetSettingsBtn.onclick = () => {
        if (confirm('确定要恢复默认设置吗？所有个性化配置将被重置。')) {
          services.resetConfig().then(() => {
            if (onChangeCallback) onChangeCallback();
          });
        }
      };

      // 所有输入框变更事件
      const inputs = [
        elements.pollingInterval,
        elements.lowDataMode,
        elements.keywordBlacklist,
        elements.qualityFilter,
        elements.hoverPreview,
        elements.readStatusAction,
        elements.showBadge,
        elements.notifyKeywords,
        elements.fontSize,
        elements.compactMode
      ];

      inputs.forEach(el => {
        el.onchange = () => this.notifyChange();
      });

      // 单选按钮
      document.querySelectorAll('input[name="clickBehavior"], input[name="themeMode"]').forEach(el => {
        el.onchange = () => this.notifyChange();
      });

      // 同步状态复选框
      const syncReadStatus = document.getElementById('syncReadStatus');
      if (syncReadStatus) {
        syncReadStatus.onchange = () => this.notifyChange();
      }
    },

    /**
     * 通知变更
     */
    notifyChange() {
      if (onChangeCallback) onChangeCallback();
    },

    /**
     * 渲染分类屏蔽列表
     */
    renderCategoryBlockList() {
      elements.categoryBlockList.innerHTML = CATEGORIES.map(c => `
        <div class="selectable-tag" data-slug="${c.slug}">${c.name}</div>
      `).join('');

      // 绑定标签点击事件
      elements.categoryBlockList.querySelectorAll('.selectable-tag').forEach(tag => {
        tag.onclick = () => {
          const slug = tag.dataset.slug;
          const config = services.getConfig();
          const blockCategories = [...config.blockCategories];

          if (blockCategories.includes(slug)) {
            config.blockCategories = blockCategories.filter(s => s !== slug);
            tag.classList.remove('blocked');
          } else {
            blockCategories.push(slug);
            config.blockCategories = blockCategories;
            tag.classList.add('blocked');
          }

          services.saveConfig(config).then(() => {
            if (onChangeCallback) onChangeCallback();
          });
        };
      });
    },

    /**
     * 加载配置到 UI
     * @param {Object} config
     */
    loadConfig(config) {
      elements.pollingInterval.value = config.pollingInterval;
      elements.lowDataMode.checked = config.lowDataMode;
      elements.keywordBlacklist.value = config.keywordBlacklist;
      elements.qualityFilter.checked = config.qualityFilter;
      elements.hoverPreview.checked = config.hoverPreview;
      elements.readStatusAction.value = config.readStatusAction;
      elements.showBadge.checked = config.showBadge;
      elements.notifyKeywords.value = config.notifyKeywords;
      elements.fontSize.value = config.fontSize;
      elements.compactMode.checked = config.compactMode;

      // 同步状态
      const syncReadStatus = document.getElementById('syncReadStatus');
      if (syncReadStatus) syncReadStatus.checked = config.syncReadStatus;

      // 点击行为
      const clickRadio = document.querySelector(`input[name="clickBehavior"][value="${config.clickBehavior}"]`);
      if (clickRadio) clickRadio.checked = true;

      // 主题模式
      const themeRadio = document.querySelector(`input[name="themeMode"][value="${config.themeMode || 'system'}"]`);
      if (themeRadio) themeRadio.checked = true;

      // 更新标签组状态
      document.querySelectorAll('.selectable-tag').forEach(tag => {
        const slug = tag.dataset.slug;
        if (config.blockCategories.includes(slug)) {
          tag.classList.add('blocked');
        } else {
          tag.classList.remove('blocked');
        }
      });
    },

    /**
     * 获取当前配置
     * @returns {Object}
     */
    getConfig() {
      const syncReadStatus = document.getElementById('syncReadStatus');
      const clickBehavior = document.querySelector('input[name="clickBehavior"]:checked')?.value || 'newTab';
      const themeMode = document.querySelector('input[name="themeMode"]:checked')?.value || 'system';

      return {
        pollingInterval: parseInt(elements.pollingInterval.value),
        lowDataMode: elements.lowDataMode.checked,
        keywordBlacklist: elements.keywordBlacklist.value,
        qualityFilter: elements.qualityFilter.checked,
        hoverPreview: elements.hoverPreview.checked,
        clickBehavior,
        readStatusAction: elements.readStatusAction.value,
        showBadge: elements.showBadge.checked,
        notifyKeywords: elements.notifyKeywords.value,
        fontSize: elements.fontSize.value,
        compactMode: elements.compactMode.checked,
        themeMode,
        syncReadStatus: syncReadStatus ? syncReadStatus.checked : true
      };
    },

    /**
     * 打开设置面板
     */
    open() {
      elements.settingsPanel.classList.add('open');
    },

    /**
     * 关闭设置面板
     */
    close() {
      elements.settingsPanel.classList.remove('open');
    }
  };
}

// 筛选栏组件

import { CATEGORIES } from '../utils/constants.js';

/**
 * 创建筛选栏管理器
 * @param {Object} elements - DOM 元素
 * @param {Object} services - 服务对象
 * @returns {Object}
 */
export function createFilterBarManager(elements, services) {
  let onChangeCallback = null;
  let onCategoryChangeCallback = null;

  return {
    /**
     * 初始化
     * @param {Function} onChange - 变化回调（排序等）
     * @param {Function} onCategoryChange - 分类变化回调（需要重新获取数据）
     */
    init(onChange, onCategoryChange) {
      onChangeCallback = onChange;
      onCategoryChangeCallback = onCategoryChange;
      this.bindEvents();
      this.fillSubCategories();
    },

    /**
     * 绑定事件
     */
    bindEvents() {
      elements.categoryFilter.onchange = () => {
        this.toggleSubCategoryVisibility();
        // 分类变更需要重新获取数据
        if (onCategoryChangeCallback) {
          onCategoryChangeCallback(this.getSettings());
        }
        this.notifyChange();
      };

      elements.subCategoryFilter.onchange = () => {
        // 子分类变更需要重新获取数据
        if (onCategoryChangeCallback) {
          onCategoryChangeCallback(this.getSettings());
        }
        this.notifyChange();
      };

      elements.sortFilter.onchange = () => {
        // 排序变更只需要重新渲染
        if (onChangeCallback) {
          onChangeCallback();
        }
      };
    },

    /**
     * 填充子分类选项
     */
    fillSubCategories() {
      elements.subCategoryFilter.innerHTML = CATEGORIES.map(c =>
        `<option value="${c.id}">${c.name}</option>`
      ).join('');
    },

    /**
     * 切换子分类可见性
     */
    toggleSubCategoryVisibility() {
      const value = elements.categoryFilter.value;
      elements.subCategoryContainer.style.display =
        value === 'categories' ? 'block' : 'none';
    },

    /**
     * 通知变更
     */
    notifyChange() {
      if (onChangeCallback) onChangeCallback();
    },

    /**
     * 加载用户设置
     * @param {Object} settings
     */
    loadSettings(settings) {
      elements.categoryFilter.value = settings.categoryFilter || 'all';
      elements.subCategoryFilter.value = settings.subCategoryFilter || CATEGORIES[0].id;
      elements.sortFilter.value = settings.sortFilter || 'latest';
      this.toggleSubCategoryVisibility();
    },

    /**
     * 获取当前筛选设置
     * @returns {Object}
     */
    getSettings() {
      return {
        categoryFilter: elements.categoryFilter.value,
        subCategoryFilter: elements.subCategoryFilter.value,
        sortFilter: elements.sortFilter.value
      };
    }
  };
}

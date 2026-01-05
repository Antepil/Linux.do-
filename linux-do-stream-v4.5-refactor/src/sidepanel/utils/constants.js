// 常量定义 - 集中管理所有配置和分类

// 分类配置
export const CATEGORIES = [
  { id: 4, name: '开发调优', slug: 'develop', color: 'tag-dev' },
  { id: 98, name: '国产替代', slug: 'domestic', color: 'tag-dev' },
  { id: 14, name: '资源荟萃', slug: 'resource', color: 'tag-resource' },
  { id: 42, name: '文档共建', slug: 'wiki', color: 'tag-dev' },
  { id: 27, name: '非我莫属', slug: 'job', color: 'tag-news' },
  { id: 32, name: '读书成诗', slug: 'reading', color: 'tag-life' },
  { id: 34, name: '前沿快讯', slug: 'news', color: 'tag-news' },
  { id: 92, name: '网络记忆', slug: 'feeds', color: 'tag-news' },
  { id: 36, name: '福利羊毛', slug: 'welfare', color: 'tag-resource' },
  { id: 11, name: '搞七捻三', slug: 'gossip', color: 'tag-life' },
  { id: 2, name: '运营反馈', slug: 'feedback', color: 'tag-default' }
];

// 标签颜色映射
export const TAG_COLORS = {
  '人工智能': 'tag-ai',
  '抽奖': 'tag-resource',
  '精华神帖': 'tag-ai',
  '纯水': 'tag-life'
};

// 信任等级徽章配置
export const TRUST_BADGES = {
  admin: {
    class: 'admin',
    title: '管理员',
    icon: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>'
  },
  4: { class: 'l4', title: '信任等级 4: 领袖', icon: '<path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z"/>' },
  3: { class: 'l3', title: '信任等级 3: 常任成员', icon: '<path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"/>' },
  2: { class: 'l2', title: '信任等级 2: 成员', icon: '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>' },
  1: { class: 'l1', title: '信任等级 1: 基本用户', icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>' }
};

// SVG 图标
export const ICONS = {
  refresh: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
  timer: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>',
  posts: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>',
  views: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>',
  user: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
  bookmark: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>',
  bookmarkFilled: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>',
  bookmarkEmpty: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/></svg>',
  trash: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'
};

// 默认配置
export const DEFAULT_CONFIG = {
  pollingInterval: 30,
  lowDataMode: false,
  blockCategories: [],
  keywordBlacklist: '',
  qualityFilter: false,
  hoverPreview: true,
  clickBehavior: 'newTab',
  readStatusAction: 'fade',
  showBadge: true,
  notifyKeywords: '',
  fontSize: 'medium',
  compactMode: false,
  themeMode: 'system',
  syncReadStatus: true
};

// 默认用户设置
export const DEFAULT_USER_SETTINGS = {
  autoRefreshEnabled: true,
  categoryFilter: 'all',
  subCategoryFilter: 4,
  sortFilter: 'latest'
};

// API 端点
export const API_ENDPOINTS = {
  latest: '/latest.json',
  top: '/top.json'
};

// 新帖子时间阈值 (4小时)
export const NEW_TOPIC_THRESHOLD = 14400000;

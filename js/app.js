/* ==========================================================
 * app.js —— 界面层入口
 * 职责：App 公共命名空间（类别图标 / 轻提示 / 一键复制 / 卡片模板）、
 *       哈希路由、初始化（演示模式、分享链接关键词）。
 * 依赖：Utils、Store，以及 view-home / view-publish / view-detail / view-my。
 * 说明：本文件需在四个视图文件之后加载；所有用户内容经 escapeHtml 转义后渲染。
 * ========================================================== */
(function () {
  'use strict';

  /* ---------- App 命名空间：公共渲染组件 ---------- */
  var CAT_ICONS = {
    '校园卡': '💳',
    '钥匙': '🔑',
    '书籍文具': '📚',
    '电子设备': '🎧',
    '衣物伞具': '🧥',
    '其他': '📦'
  };

  function catIcon(c) { return CAT_ICONS[c] || '📦'; }

  /* ---------- 轻提示 ---------- */
  var toastTimer = null;
  function showToast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2000);
  }

  /* ---------- 一键复制（含降级方案） ---------- */
  function copyText(text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast('联系方式已复制到剪贴板');
      } catch (e) {
        showToast('复制失败，请长按手动复制');
      }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { showToast('联系方式已复制到剪贴板'); },
        fallback
      );
    } else {
      fallback();
    }
  }

  /* ---------- 信息卡片模板 ---------- */
  function itemCardHTML(item) {
    var st = Utils.statusOf(item);
    var stClass = item.status === 'done' ? 'done' : item.type;
    var iconClass = item.status === 'done' ? 'done' : item.type;
    return (
      '<div class="item-card' + (item.status === 'done' ? ' is-done' : '') + '" data-id="' + item.id + '">' +
        '<div class="item-icon ' + iconClass + '">' + catIcon(item.category) + '</div>' +
        '<div class="item-body">' +
          '<div class="item-top">' +
            '<span class="item-name">' + Utils.escapeHtml(item.name) + '</span>' +
            '<span class="badge ' + stClass + '">' + st + '</span>' +
          '</div>' +
          '<div class="item-meta">' +
            '<span class="type-tag ' + item.type + '">' + (item.type === 'lost' ? '寻物' : '招领') + '</span>' +
            '<span>' + Utils.escapeHtml(item.category) + '</span>' +
            '<span>' + Utils.escapeHtml(item.place) + '</span>' +
            '<span>' + Utils.friendlyDate(item.time) + '</span>' +
          '</div>' +
          (item.desc ? '<div class="item-desc">' + Utils.escapeHtml(item.desc) + '</div>' : '') +
          '<div class="item-foot">' +
            '<span>👀 ' + (item.views || 0) + ' 次浏览</span>' +
            '<span>发布于 ' + Utils.timeAgo(item.createdAt) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  window.App = {
    catIcon: catIcon,
    showToast: showToast,
    copyText: copyText,
    itemCardHTML: itemCardHTML,
    // 与各视图文件共享的可变状态
    homeFilter: { keyword: '', type: 'all', category: 'all', place: 'all', onlyActive: false },
    pubType: 'lost'
  };

  /* ==========================================================
   * 路由与初始化
   * ========================================================== */
  function setNavActive(name) {
    document.querySelectorAll('.nav-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.nav === name);
    });
  }

  function route() {
    var hash = location.hash || '#/home';
    var m = hash.match(/^#\/detail\/(\d+)/);
    if (m) { setNavActive('home'); window.renderDetail(parseInt(m[1], 10)); return; }
    if (hash.indexOf('#/publish') === 0) { setNavActive('publish'); window.renderPublish(); return; }
    if (hash.indexOf('#/my') === 0) { setNavActive('my'); window.renderMy(); return; }
    setNavActive('home');
    window.renderHome();
  }

  function init() {
    Store.seedIfEmpty();
    var params = new URLSearchParams(location.search);
    if (params.get('demo') === '1') {
      Store.seedDemoOwner();
    }
    if (params.has('q')) {
      App.homeFilter.keyword = params.get('q').trim(); // 支持带关键词的分享链接
    }
    document.querySelectorAll('.nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { location.hash = '#/' + btn.dataset.nav; });
    });
    window.addEventListener('hashchange', route);
    route();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

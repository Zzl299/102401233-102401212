/* ==========================================================
 * utils.js —— 工具函数
 * 说明：本文件不依赖 DOM，可被单元测试直接引用。
 * ========================================================== */
(function (global) {
  'use strict';

  /** HTML 转义，防止用户输入注入脚本（XSS） */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** 防抖：延迟 delay 毫秒后执行 */
  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }

  /** 数字补零 */
  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  /** 将 Date 对象转为 YYYY-MM-DD */
  function toDateStr(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  /** 判断 YYYY-MM-DD 是否为未来日期（不能晚于今天） */
  function isFutureDate(dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    return dateStr > toDateStr(new Date()); // YYYY-MM-DD 字典序 == 时间序
  }

  /** 信息状态文案映射：lost/found × active/done */
  function statusOf(item) {
    if (!item) return '';
    if (item.type === 'lost') {
      return item.status === 'done' ? '已找到' : '寻找中';
    }
    return item.status === 'done' ? '已归还' : '待认领';
  }

  /** 相对时间：刚刚 / n 分钟前 / n 小时前 / n 天前 / 日期 */
  function timeAgo(ts) {
    var diff = Date.now() - ts;
    if (diff < 60 * 1000) return '刚刚';
    var m = Math.floor(diff / 60000);
    if (m < 60) return m + ' 分钟前';
    var h = Math.floor(diff / 3600000);
    if (h < 24) return h + ' 小时前';
    var d = Math.floor(diff / 86400000);
    if (d < 30) return d + ' 天前';
    return formatDate(new Date(ts));
  }

  /** Date -> YYYY-MM-DD */
  function formatDate(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  /** 友好日期：今天 / 昨天 / YYYY-MM-DD */
  function friendlyDate(dateStr) {
    if (!dateStr) return '';
    var today = toDateStr(new Date());
    var yesterday = toDateStr(new Date(Date.now() - 86400000));
    if (dateStr === today) return '今天';
    if (dateStr === yesterday) return '昨天';
    return dateStr;
  }

  global.Utils = {
    escapeHtml: escapeHtml,
    debounce: debounce,
    pad2: pad2,
    toDateStr: toDateStr,
    formatDate: formatDate,
    isFutureDate: isFutureDate,
    statusOf: statusOf,
    timeAgo: timeAgo,
    friendlyDate: friendlyDate
  };
})(window);

/* ==========================================================
 * view-detail.js —— 详情视图
 * 职责：信息详情渲染、浏览数 +1、一键复制、标记已找到/已归还、恢复、删除。
 * 依赖：Utils、Store、App（catIcon / copyText / showToast）。
 * ========================================================== */
(function () {
  'use strict';

  var view = document.getElementById('view');

  function renderDetail(id) {
    var item = Store.incrementViews(id);
    if (!item) {
      view.innerHTML =
        '<div class="sub-nav"><button class="back-btn" data-back="1">←</button><h2>信息详情</h2></div>' +
        '<div class="empty"><div class="empty-icon">😢</div><h3>信息不存在或已被删除</h3><button class="btn btn-primary" id="btn-back-home">返回首页</button></div>';
      document.getElementById('btn-back-home').addEventListener('click', function () { location.hash = '#/home'; });
      bindBack();
      return;
    }

    var st = Utils.statusOf(item);
    var stClass = item.status === 'done' ? 'done' : item.type;
    var isMine = item.publisherKey === Store.getOwner();
    var doneLabel = item.type === 'lost' ? '已找到' : '已归还';
    var activeLabel = item.type === 'lost' ? '寻找中' : '待认领';

    var ownerHtml = '';
    if (isMine) {
      if (item.status === 'active') {
        ownerHtml =
          '<div class="owner-actions">' +
            '<button class="btn btn-primary btn-block" id="btn-mark-done">✓ 标记为' + doneLabel + '</button>' +
            '<button class="btn btn-danger btn-block" id="btn-delete">删除这条信息</button>' +
          '</div>';
      } else {
        ownerHtml =
          '<div class="notice-done">✅ 该信息已标记为「' + st + '」，不再展示联系入口。</div>' +
          '<div class="owner-actions">' +
            '<button class="btn btn-ghost btn-block" id="btn-recover">恢复为' + activeLabel + '</button>' +
            '<button class="btn btn-danger btn-block" id="btn-delete">删除这条信息</button>' +
          '</div>';
      }
    } else if (item.status === 'done') {
      ownerHtml = '<div class="notice-done">✅ 该信息已完成（' + st + '），请勿再联系发布者。</div>';
    }

    view.innerHTML =
      '<div class="sub-nav">' +
        '<button class="back-btn" data-back="1">←</button>' +
        '<h2>信息详情</h2>' +
      '</div>' +
      '<div class="detail-hero">' +
        '<div class="item-icon ' + item.type + '">' + App.catIcon(item.category) + '</div>' +
        '<h2>' + Utils.escapeHtml(item.name) + '</h2>' +
        '<span class="badge ' + stClass + '">' + st + '</span>' +
      '</div>' +
      '<div class="detail-grid">' +
        '<div class="detail-cell"><div class="dc-label">信息类型</div><div class="dc-value">' + (item.type === 'lost' ? '寻物' : '招领') + '</div></div>' +
        '<div class="detail-cell"><div class="dc-label">物品类别</div><div class="dc-value">' + Utils.escapeHtml(item.category) + '</div></div>' +
        '<div class="detail-cell"><div class="dc-label">地点</div><div class="dc-value">' + Utils.escapeHtml(item.place) + '</div></div>' +
        '<div class="detail-cell"><div class="dc-label">时间</div><div class="dc-value">' + Utils.escapeHtml(item.time) + '</div></div>' +
      '</div>' +
      '<div class="section-title">详细描述</div>' +
      '<div class="detail-desc">' + (item.desc ? Utils.escapeHtml(item.desc) : '（发布者未填写描述）') + '</div>' +
      '<div class="section-title">发布者信息</div>' +
      '<div class="contact-box">' +
        '<div class="contact-line">' +
          '<span class="cl-label">联系人：</span>' +
          '<span class="cl-value">' + Utils.escapeHtml(item.contactName) + '</span>' +
        '</div>' +
        '<div class="contact-line">' +
          '<span class="cl-label">联系方式：</span>' +
          '<span class="cl-value">' + Utils.escapeHtml(item.contact) + '</span>' +
          '<button class="copy-btn" id="btn-copy">一键复制</button>' +
        '</div>' +
      '</div>' +
      ownerHtml +
      '<div class="detail-foot">发布于 ' + Utils.timeAgo(item.createdAt) + ' · 👀 ' + (item.views || 0) + ' 次浏览</div>';

    bindBack();
    document.getElementById('btn-copy').addEventListener('click', function () {
      App.copyText(item.contact);
    });

    var markBtn = document.getElementById('btn-mark-done');
    if (markBtn) markBtn.addEventListener('click', function () {
      if (window.confirm('确定将「' + item.name + '」标记为「' + doneLabel + '」吗？\n标记后其他同学将不再联系你。')) {
        Store.updateStatus(item.id, 'done');
        App.showToast('已标记为' + doneLabel);
        renderDetail(item.id);
      }
    });

    var recoverBtn = document.getElementById('btn-recover');
    if (recoverBtn) recoverBtn.addEventListener('click', function () {
      Store.updateStatus(item.id, 'active');
      App.showToast('已恢复为' + activeLabel);
      renderDetail(item.id);
    });

    var delBtn = document.getElementById('btn-delete');
    if (delBtn) delBtn.addEventListener('click', function () {
      if (window.confirm('确定删除「' + item.name + '」这条信息吗？删除后不可恢复。')) {
        Store.deleteItem(item.id);
        App.showToast('已删除');
        location.hash = '#/my';
      }
    });
  }

  function bindBack() {
    var btn = document.querySelector('.back-btn[data-back]');
    if (btn) btn.addEventListener('click', function () { history.back(); });
  }

  window.renderDetail = renderDetail;
})();

/* ==========================================================
 * view-my.js —— 我的发布视图
 * 职责：按本机发布者标识过滤、统计卡片、标记完成 / 恢复 / 删除管理。
 * 依赖：Utils、Store、App（catIcon / showToast）。
 * ========================================================== */
(function () {
  'use strict';

  var view = document.getElementById('view');

  function renderMy() {
    var myItems = Store.getMyItems(Store.getOwner());
    var activeCount = myItems.filter(function (i) { return i.status === 'active'; }).length;
    var doneCount = myItems.length - activeCount;

    var listHtml;
    if (myItems.length === 0) {
      listHtml =
        '<div class="empty">' +
          '<div class="empty-icon">📭</div>' +
          '<h3>你还没有发布过信息</h3>' +
          '<p>点击下方「发布」，帮自己或同学找回失物吧</p>' +
          '<button class="btn btn-primary" id="btn-go-publish-my">去发布</button>' +
        '</div>';
    } else {
      listHtml = '<div class="item-list">' + myItems.map(function (item) {
        var st = Utils.statusOf(item);
        var stClass = item.status === 'done' ? 'done' : item.type;
        var actionBtn = item.status === 'active'
          ? '<button class="mini-btn done" data-act="done" data-id="' + item.id + '">✓ 标记完成</button>'
          : '<button class="mini-btn recover" data-act="recover" data-id="' + item.id + '">↺ 恢复</button>';
        return (
          '<div class="item-card" data-id="' + item.id + '">' +
            '<div class="item-icon ' + item.type + '">' + App.catIcon(item.category) + '</div>' +
            '<div class="item-body">' +
              '<div class="item-top">' +
                '<span class="item-name">' + Utils.escapeHtml(item.name) + '</span>' +
                '<span class="badge ' + stClass + '">' + st + '</span>' +
              '</div>' +
              '<div class="item-meta">' +
                '<span class="type-tag ' + item.type + '">' + (item.type === 'lost' ? '寻物' : '招领') + '</span>' +
                '<span>' + Utils.escapeHtml(item.place) + '</span>' +
                '<span>' + Utils.friendlyDate(item.time) + '</span>' +
              '</div>' +
              '<div class="my-item-actions">' +
                '<button class="mini-btn view" data-act="view" data-id="' + item.id + '">查看详情</button>' +
                actionBtn +
                '<button class="mini-btn del" data-act="del" data-id="' + item.id + '">删除</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('') + '</div>';
    }

    view.innerHTML =
      '<div class="sub-nav"><h2>我的发布</h2></div>' +
      '<div class="stats-row">' +
        '<div class="stat-card"><div class="stat-num blue">' + myItems.length + '</div><div class="stat-label">共发布</div></div>' +
        '<div class="stat-card"><div class="stat-num green">' + activeCount + '</div><div class="stat-label">进行中</div></div>' +
        '<div class="stat-card"><div class="stat-num grey">' + doneCount + '</div><div class="stat-label">已完成</div></div>' +
      '</div>' +
      listHtml;

    var goBtn = document.getElementById('btn-go-publish-my');
    if (goBtn) goBtn.addEventListener('click', function () { location.hash = '#/publish'; });

    // 我的信息卡片动作
    document.querySelectorAll('.my-item-actions .mini-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = parseInt(btn.dataset.id, 10);
        var act = btn.dataset.act;
        var name = (Store.getItem(id) || {}).name || '';
        if (act === 'view') { location.hash = '#/detail/' + id; return; }
        if (act === 'done') {
          if (window.confirm('确定将「' + name + '」标记为已完成吗？')) {
            var updated = Store.updateStatus(id, 'done');
            App.showToast('已标记为' + Utils.statusOf(updated));
            renderMy();
          }
          return;
        }
        if (act === 'recover') {
          var updated2 = Store.updateStatus(id, 'active');
          App.showToast('已恢复为' + Utils.statusOf(updated2));
          renderMy();
          return;
        }
        if (act === 'del') {
          if (window.confirm('确定删除「' + name + '」这条信息吗？删除后不可恢复。')) {
            Store.deleteItem(id);
            App.showToast('已删除');
            renderMy();
          }
        }
      });
    });

    // 点击卡片进入详情
    document.querySelectorAll('.item-card[data-id]').forEach(function (card) {
      card.addEventListener('click', function () {
        location.hash = '#/detail/' + card.dataset.id;
      });
    });
  }

  window.renderMy = renderMy;
})();

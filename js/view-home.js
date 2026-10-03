/* ==========================================================
 * view-home.js —— 首页视图
 * 职责：信息流渲染、关键词实时搜索（防抖）、类型 / 类别 / 地点 / 状态筛选。
 * 依赖：Utils、Store、App（公共渲染组件与筛选状态）。
 * ========================================================== */
(function () {
  'use strict';

  var view = document.getElementById('view');
  var F = window.App.homeFilter; // 与 app.js 共享的首页筛选状态

  /* ---------- 首页筛选状态（逐字段重置，避免丢失引用） ---------- */
  function resetFilter() {
    F.keyword = '';
    F.type = 'all';
    F.category = 'all';
    F.place = 'all';
    F.onlyActive = false;
  }

  /* ---------- 首页渲染 ---------- */
  function renderHome() {
    var places = distinctPlaces(Store.loadItems());
    var catChips = ['<button class="chip' + (F.category === 'all' ? ' active' : '') + '" data-cat="all">全部类别</button>'];
    Store.CATEGORIES.forEach(function (c) {
      catChips.push('<button class="chip' + (F.category === c ? ' active' : '') + '" data-cat="' + Utils.escapeHtml(c) + '">' + Utils.escapeHtml(c) + '</button>');
    });
    var placeOptions = ['<option value="all">全部地点</option>'];
    places.forEach(function (p) {
      var sel = F.place === p ? ' selected' : '';
      placeOptions.push('<option value="' + Utils.escapeHtml(p) + '"' + sel + '>' + Utils.escapeHtml(p) + '</option>');
    });

    view.innerHTML =
      '<section class="home-header">' +
        '<div class="brand">' +
          '<img class="brand-logo" src="assets/logo.svg" alt="logo">' +
          '<div class="brand-text">' +
            '<h1>校园失物招领</h1>' +
            '<p>信息集中 · 一键发布 · 帮你找回每一件小东西</p>' +
          '</div>' +
        '</div>' +
        '<div class="search-box">' +
          '<span class="s-icon">🔍</span>' +
          '<input id="search-input" type="text" placeholder="搜索物品名称、地点、类别…" value="' + Utils.escapeHtml(F.keyword) + '">' +
          '<button id="search-clear" class="search-clear">✕</button>' +
        '</div>' +
        '<div class="hot-words">' +
          '<span class="hw-label">热门：</span>' +
          ['校园卡', '钥匙', '耳机', '雨伞', '身份证', '水杯'].map(function (w) {
            return '<button class="hw" data-hot="' + w + '">' + w + '</button>';
          }).join('') +
        '</div>' +
      '</section>' +
      '<div class="type-tabs">' +
        '<button class="type-tab all' + (F.type === 'all' ? ' active' : '') + '" data-type="all">全部</button>' +
        '<button class="type-tab lost' + (F.type === 'lost' ? ' active' : '') + '" data-type="lost"><span class="dot lost"></span>寻物</button>' +
        '<button class="type-tab found' + (F.type === 'found' ? ' active' : '') + '" data-type="found"><span class="dot found"></span>招领</button>' +
      '</div>' +
      '<div class="filter-row">' +
        catChips.join('') +
        '<select id="place-select" class="filter-select">' + placeOptions.join('') + '</select>' +
        '<button class="chip' + (F.onlyActive ? ' active' : '') + '" id="only-active">只看进行中</button>' +
      '</div>' +
      '<div id="home-list"></div>';

    bindHomeEvents();
    renderHomeList();
  }

  function distinctPlaces(items) {
    var set = {};
    items.forEach(function (i) { set[i.place] = true; });
    return Object.keys(set);
  }

  function bindHomeEvents() {
    var input = document.getElementById('search-input');
    input.addEventListener('input', Utils.debounce(function () {
      F.keyword = input.value;
      renderHomeList();
    }, 300));

    document.getElementById('search-clear').addEventListener('click', function () {
      F.keyword = '';
      input.value = '';
      renderHomeList();
      input.focus();
    });

    document.querySelectorAll('.hot-words .hw').forEach(function (btn) {
      btn.addEventListener('click', function () {
        F.keyword = btn.dataset.hot;
        input.value = btn.dataset.hot;
        renderHomeList();
      });
    });

    document.querySelectorAll('.type-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        F.type = btn.dataset.type;
        renderHome();
      });
    });

    document.querySelectorAll('.filter-row .chip[data-cat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        F.category = btn.dataset.cat;
        renderHome();
      });
    });

    document.getElementById('place-select').addEventListener('change', function () {
      F.place = this.value;
      renderHomeList();
    });

    document.getElementById('only-active').addEventListener('click', function () {
      F.onlyActive = !F.onlyActive;
      this.classList.toggle('active', F.onlyActive);
      renderHomeList();
    });
  }

  function renderHomeList() {
    var list = document.getElementById('home-list');
    var result = Store.searchItems({
      keyword: F.keyword,
      type: F.type === 'all' ? '' : F.type,
      category: F.category === 'all' ? '' : F.category,
      place: F.place === 'all' ? '' : F.place,
      onlyActive: F.onlyActive
    });

    if (result.length === 0) {
      list.innerHTML =
        '<div class="empty">' +
          '<div class="empty-icon">🔍</div>' +
          '<h3>没有找到相关内容</h3>' +
          '<p>试试更换关键词，或直接发布一条信息等待同学看到</p>' +
          '<button class="btn btn-ghost" id="btn-clear-filter">清空筛选</button>' +
          '<button class="btn btn-primary" id="btn-go-publish">去发布</button>' +
        '</div>';
      var clearBtn = document.getElementById('btn-clear-filter');
      if (clearBtn) clearBtn.addEventListener('click', function () {
        resetFilter();
        renderHome();
      });
      document.getElementById('btn-go-publish').addEventListener('click', function () {
        location.hash = '#/publish';
      });
      return;
    }

    list.innerHTML =
      '<p class="list-count">共 ' + result.length + ' 条信息' +
      (F.keyword ? '（关键词：“' + Utils.escapeHtml(F.keyword) + '”）' : '') + '</p>' +
      '<div class="item-list">' + result.map(App.itemCardHTML).join('') + '</div>';

    list.querySelectorAll('.item-card').forEach(function (card) {
      card.addEventListener('click', function () {
        location.hash = '#/detail/' + card.dataset.id;
      });
    });
  }

  window.renderHome = renderHome;
  window.renderHomeList = renderHomeList;
})();

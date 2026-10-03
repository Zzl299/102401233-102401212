/* ==========================================================
 * view-publish.js —— 发布视图
 * 职责：寻物 / 招领切换、表单渲染、逐字段校验展示、发布成功页。
 * 依赖：Utils、Store、App（showToast 与发布类型状态）。
 * ========================================================== */
(function () {
  'use strict';

  var view = document.getElementById('view');
  var T = window.App.pubType; // 与 app.js 共享的发布类型（lost / found）

  /* ---------- 表单字段模板 ---------- */
  function formField(id, label, required, inner) {
    return (
      '<div class="form-group" id="group-' + id + '">' +
        '<label for="' + id + '">' + label + (required ? '<span class="req"> *</span>' : '') + '</label>' +
        inner +
        '<div class="field-error" id="err-' + id + '"></div>' +
      '</div>'
    );
  }

  /* ---------- 发布页渲染 ---------- */
  function renderPublish() {
    view.innerHTML =
      '<div class="sub-nav">' +
        '<h2>发布信息</h2>' +
      '</div>' +
      '<div class="type-seg" id="type-seg">' +
        '<button class="seg-btn active lost" data-type="lost">寻物<span class="seg-sub">我丢了东西</span></button>' +
        '<button class="seg-btn found" data-type="found">招领<span class="seg-sub">我捡到东西</span></button>' +
      '</div>' +
      '<form id="publish-form" class="form-card" novalidate>' +
        formField('f-name', '物品名称', true, '<input type="text" id="f-name" placeholder="如：校园卡 / 钥匙串 / 蓝牙耳机" maxlength="30">') +
        formField('f-category', '物品类别', true,
          '<select id="f-category">' +
            '<option value="">请选择类别</option>' +
            Store.CATEGORIES.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') +
          '</select>') +
        formField('f-place', '地点', true, '<input type="text" id="f-place" placeholder="丢失 / 拾取地点，如：图书馆二楼" maxlength="50">') +
        formField('f-time', '时间', true, '<input type="date" id="f-time" max="">') +
        formField('f-desc', '详细描述', false, '<textarea id="f-desc" maxlength="200" placeholder="颜色、品牌、特征等，方便失主/拾主确认"></textarea><div class="char-count"><span id="desc-count">0</span>/200</div>') +
        formField('f-contactName', '联系人', true, '<input type="text" id="f-contactName" placeholder="你的称呼，如：李同学" maxlength="20">') +
        formField('f-contact', '联系方式', true, '<input type="text" id="f-contact" placeholder="手机号 / 邮箱 / QQ / 微信号" maxlength="60">') +
      '</form>' +
      '<div class="contact-tips">📌 请务必留下真实可用的联系方式，物品找回或归还后，记得在「我的发布」中把信息标记为已找到 / 已归还。</div>' +
      '<div style="margin-top:14px;"><button id="btn-submit" class="btn btn-primary btn-block">立即发布</button></div>';

    var timeInput = document.getElementById('f-time');
    timeInput.max = Utils.toDateStr(new Date());

    // 类型切换
    document.querySelectorAll('#type-seg .seg-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        T = btn.dataset.type;
        document.querySelectorAll('#type-seg .seg-btn').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
      });
    });

    // 描述字数统计
    var descInput = document.getElementById('f-desc');
    descInput.addEventListener('input', function () {
      document.getElementById('desc-count').textContent = descInput.value.length;
    });

    // 提交
    document.getElementById('btn-submit').addEventListener('click', submitPublish);
    document.getElementById('publish-form').addEventListener('submit', function (e) { e.preventDefault(); });
  }

  /* ---------- 提交与校验 ---------- */
  function submitPublish() {
    var btn = document.getElementById('btn-submit');
    btn.disabled = true;

    var data = {
      type: T,
      name: document.getElementById('f-name').value,
      category: document.getElementById('f-category').value,
      place: document.getElementById('f-place').value,
      time: document.getElementById('f-time').value,
      desc: document.getElementById('f-desc').value,
      contactName: document.getElementById('f-contactName').value,
      contact: document.getElementById('f-contact').value
    };

    var check = Store.isValidPublishData(data);
    if (!check.ok) {
      // 展示错误
      document.querySelectorAll('.form-group').forEach(function (g) { g.classList.remove('has-error'); });
      Object.keys(check.errors).forEach(function (field) {
        var map = { name: 'f-name', category: 'f-category', place: 'f-place', time: 'f-time', desc: 'f-desc', contactName: 'f-contactName', contact: 'f-contact' };
        var group = document.getElementById('group-' + map[field]);
        document.getElementById('err-' + map[field]).textContent = check.errors[field];
        if (group) group.classList.add('has-error');
      });
      btn.disabled = false;
      return;
    }

    var result = Store.createItem(data);
    if (!result.ok) {
      App.showToast('发布失败，请检查填写内容');
      btn.disabled = false;
      return;
    }
    renderSuccess();
  }

  /* ---------- 发布成功页 ---------- */
  function renderSuccess() {
    view.innerHTML =
      '<div class="success-panel">' +
        '<div class="success-icon">✓</div>' +
        '<h2>发布成功！</h2>' +
        '<p>信息已展示在首页，同学可以通过搜索找到它。<br>物品找回 / 归还后，记得标记为已完成哦。</p>' +
        '<div class="btn-group">' +
          '<button class="btn btn-primary" id="btn-to-my">查看我的发布</button>' +
          '<button class="btn btn-ghost" id="btn-to-home">返回首页</button>' +
        '</div>' +
      '</div>';
    document.getElementById('btn-to-my').addEventListener('click', function () { location.hash = '#/my'; });
    document.getElementById('btn-to-home').addEventListener('click', function () { location.hash = '#/home'; });
  }

  window.renderPublish = renderPublish;
})();

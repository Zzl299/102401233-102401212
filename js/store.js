/* ==========================================================
 * store.js —— 数据层
 * 职责：localStorage 持久化、数据校验、增删改查、搜索、状态更新。
 * 说明：本文件不依赖 DOM（仅依赖 Utils），可被单元测试直接引用。
 *       存储不可用（如隐私模式）时自动降级为内存存储。
 * ========================================================== */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'lf_items_v1';   // 信息列表
  var OWNER_KEY   = 'lf_owner_v1';   // 本机发布者标识
  var SEED_KEY    = 'lf_seeded_v1';  // 模拟数据只播种一次

  var CATEGORIES = ['校园卡', '钥匙', '书籍文具', '电子设备', '衣物伞具', '其他'];

  /* ---------- 存储安全封装 ---------- */
  var memory = {};
  function lsGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return memory[key] || null; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, val); } catch (e) { memory[key] = val; }
  }
  function lsRemove(key) {
    try { localStorage.removeItem(key); } catch (e) { delete memory[key]; }
  }

  /* ---------- 基础读写 ---------- */
  function loadItems() {
    var raw = lsGet(STORAGE_KEY);
    if (!raw) return [];
    try {
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function saveItems(items) {
    lsSet(STORAGE_KEY, JSON.stringify(items));
  }

  /* ---------- 发布者标识 ---------- */
  function getOwner() {
    var o = lsGet(OWNER_KEY);
    if (!o) {
      o = 'u' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
      lsSet(OWNER_KEY, o);
    }
    return o;
  }
  function setOwner(o) { lsSet(OWNER_KEY, o); }

  /* ---------- 工具 ---------- */
  function daysAgo(n) {
    return Utils.toDateStr(new Date(Date.now() - n * 86400000));
  }

  /** 生成新 id：当前最大 id + 1，空表从 1 开始 */
  function generateId(items) {
    var max = 0;
    for (var i = 0; i < items.length; i++) {
      if (typeof items[i].id === 'number' && items[i].id > max) max = items[i].id;
    }
    return max + 1;
  }

  /* ---------- 校验 ---------- */
  function isValidContact(contact) {
    var c = String(contact).trim();
    if (/^1[3-9]\d{9}$/.test(c)) return true;                  // 手机号（11 位）
    if (/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(c)) return true;   // 邮箱
    if (/^\d{5,12}$/.test(c)) return true;                     // QQ 号（5-12 位数字）
    if (/^[A-Za-z][A-Za-z0-9_-]{5,19}$/.test(c)) return true;  // 微信号（字母开头，6-20 位）
    return false;
  }

  /** 发布表单校验，返回 { ok, errors }，errors 以字段名为键 */
  function isValidPublishData(data) {
    var errors = {};
    data = data || {};
    var type = String(data.type || '');
    var name = String(data.name || '').trim();
    var category = String(data.category || '');
    var place = String(data.place || '').trim();
    var time = String(data.time || '').trim();
    var contactName = String(data.contactName || '').trim();
    var contact = String(data.contact || '').trim();
    var desc = String(data.desc || '').trim();

    if (type !== 'lost' && type !== 'found') errors.type = '请选择信息类型（寻物 / 招领）';

    if (!name) errors.name = '请填写物品名称';
    else if (name.length > 30) errors.name = '物品名称不能超过 30 个字符';

    if (!category) errors.category = '请选择物品类别';
    else if (CATEGORIES.indexOf(category) < 0) errors.category = '物品类别不合法';

    if (!place) errors.place = '请填写地点';
    else if (place.length > 50) errors.place = '地点不能超过 50 个字符';

    if (!time) errors.time = '请选择时间';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(time)) errors.time = '时间格式不正确';
    else if (Utils.isFutureDate(time)) errors.time = '时间不能晚于今天';

    if (!contactName) errors.contactName = '请填写联系人称呼';
    else if (contactName.length > 20) errors.contactName = '联系人不能超过 20 个字符';

    if (!contact) errors.contact = '请填写联系方式';
    else if (!isValidContact(contact)) errors.contact = '联系方式需为 11 位手机号、含 @ 的邮箱、5-12 位 QQ 号或字母开头的微信号';

    if (desc.length > 200) errors.desc = '描述不能超过 200 个字符';

    return { ok: Object.keys(errors).length === 0, errors: errors };
  }

  /* ---------- 模拟数据 ---------- */
  /** 首次运行/空库时填充模拟数据；已有数据（无论是否播种过）一律不覆盖 */
  function seedIfEmpty() {
    var items = loadItems();
    if (items.length > 0) return false;
    if (lsGet(SEED_KEY)) return false;
    var seeds = [
      { id: 1,  type: 'found', name: '校园卡',            category: '校园卡',   place: '图书馆',   time: daysAgo(3), desc: '在图书馆二楼自习区捡到校园卡一张，卡号尾号 6138，背面贴有卡通贴纸，失主请速联系。',         contactName: '沈同学', contact: '13812340001', status: 'active', publisherKey: 'seed', views: 12, createdAt: Date.now() - 3 * 86400000 },
      { id: 2,  type: 'lost',  name: '钥匙串（蓝色挂件）', category: '钥匙',     place: '教学楼',   time: daysAgo(1), desc: '一串钥匙共 4 把，挂有一个蓝色小熊挂件，可能丢在第三教学楼 2 楼走廊，捡到的同学请联系我。',  contactName: '郑同学', contact: '15812340002', status: 'active', publisherKey: 'seed', views: 8,  createdAt: Date.now() - 1 * 86400000 },
      { id: 3,  type: 'found', name: '白色蓝牙耳机',      category: '电子设备', place: '操场',     time: daysAgo(2), desc: '操场跑道边捡到一副白色蓝牙耳机，充电仓外壳贴有紫色贴纸，请失主描述型号来认领。',           contactName: '李同学', contact: '18912340003', status: 'active', publisherKey: 'seed', views: 20, createdAt: Date.now() - 2 * 86400000 },
      { id: 4,  type: 'lost',  name: '高等数学（第七版）', category: '书籍文具', place: '食堂',     time: daysAgo(0), desc: '在食堂二楼靠窗座位遗失《高等数学（第七版）》上册，扉页写有名字，内有课堂笔记。',             contactName: '王同学', contact: 'wang2026',    status: 'active', publisherKey: 'seed', views: 5,  createdAt: Date.now() - 3600000 },
      { id: 5,  type: 'found', name: '黑色折叠伞',        category: '衣物伞具', place: '宿舍区',   time: daysAgo(5), desc: '在 6 号宿舍楼下捡到黑色折叠伞一把，伞柄刻有“林”字，请到宿管处或联系我领取。',           contactName: '陈同学', contact: '13712340004', status: 'active', publisherKey: 'seed', views: 15, createdAt: Date.now() - 5 * 86400000 },
      { id: 6,  type: 'lost',  name: '银色保温杯',        category: '其他',     place: '操场',     time: daysAgo(4), desc: '在操场看台附近遗失银色保温杯一个，杯身有轻微划痕，杯盖内侧刻有“ZY”字样，捡到的同学请联系我。', contactName: '刘同学', contact: '13612340005', status: 'active', publisherKey: 'seed', views: 10, createdAt: Date.now() - 4 * 86400000 },
      { id: 7,  type: 'found', name: '银色保温杯',        category: '其他',     place: '校门口',   time: daysAgo(6), desc: '校门口保安亭旁捡到银色保温杯一个，杯身有轻微划痕，杯盖内侧刻有“ZY”字样。',               contactName: '张同学', contact: '15912340006', status: 'active', publisherKey: 'seed', views: 7,  createdAt: Date.now() - 6 * 86400000 },
      { id: 8,  type: 'lost',  name: '宿舍钥匙',         category: '钥匙',     place: '图书馆',   time: daysAgo(2), desc: '遗失宿舍钥匙一串（共 3 把），带黄色门禁卡套，图书馆闭馆前还在座位上，之后就不见了。',       contactName: '吴同学', contact: '18612340007', status: 'active', publisherKey: 'seed', views: 18, createdAt: Date.now() - 2 * 86400000 },
      { id: 9,  type: 'found', name: '计算机网络教材',    category: '书籍文具', place: '教学楼',   time: daysAgo(8), desc: '《计算机网络（第八版）》教材一本，已被失主认领，感谢大家的转发。',                        contactName: '周同学', contact: '18812340008', status: 'done',   publisherKey: 'seed', views: 25, createdAt: Date.now() - 8 * 86400000 },
      { id: 10, type: 'lost',  name: '有线耳机',          category: '电子设备', place: '自习室',   time: daysAgo(6), desc: '白色有线耳机一副，已于昨日找回，谢谢帮忙扩散的同学。',                                  contactName: '孙同学', contact: '13512340009', status: 'done',   publisherKey: 'seed', views: 30, createdAt: Date.now() - 6 * 86400000 }
    ];
    saveItems(seeds);
    lsSet(SEED_KEY, '1');
    return true;
  }

  /** 演示模式：把本机标记为演示发布者，并补充“我的发布”演示数据（URL 带 ?demo=1 时调用） */
  function seedDemoOwner() {
    var owner = 'demo-owner';
    var items = loadItems();
    var has = items.some(function (i) { return i.publisherKey === owner; });
    if (!has) {
      var demo = [
        { id: 11, type: 'lost',  name: '蓝牙耳机（右耳）', category: '电子设备', place: '图书馆', time: daysAgo(0), desc: '黑色蓝牙耳机右耳一只（无充电盒），在图书馆三楼丢失，捡到的同学请联系我，谢谢！',     contactName: '郑志銮', contact: '13611112222', status: 'active', publisherKey: owner, views: 3,  createdAt: Date.now() - 1800000 },
        { id: 12, type: 'found', name: '校园卡',           category: '校园卡',   place: '食堂',   time: daysAgo(1), desc: '食堂一楼捡到校园卡一张，卡面贴有海绵宝宝贴纸，请失主携带学生证前来认领。',         contactName: '沈雷',   contact: '13733334444', status: 'active', publisherKey: owner, views: 9,  createdAt: Date.now() - 1 * 86400000 },
        { id: 13, type: 'found', name: '钥匙串（红绳）',   category: '钥匙',     place: '操场',   time: daysAgo(6), desc: '操场器材室旁捡到钥匙串，带红色挂绳，已交还失主。',                                 contactName: '沈雷',   contact: '13733334444', status: 'done',   publisherKey: owner, views: 6,  createdAt: Date.now() - 6 * 86400000 }
      ];
      items = items.concat(demo);
      saveItems(items);
    }
    setOwner(owner);
  }

  /* ---------- 增删改查 ---------- */
  /** 新增信息：先校验，通过后写入并返回 { ok, errors, item } */
  function createItem(data) {
    var check = isValidPublishData(data);
    if (!check.ok) return { ok: false, errors: check.errors, item: null };

    var items = loadItems();
    var item = {
      id: generateId(items),
      type: data.type,
      name: String(data.name).trim(),
      category: data.category,
      place: String(data.place).trim(),
      time: String(data.time).trim(),
      desc: String(data.desc || '').trim(),
      contactName: String(data.contactName).trim(),
      contact: String(data.contact).trim(),
      status: 'active',
      publisherKey: getOwner(),
      views: 0,
      createdAt: Date.now()
    };
    items.unshift(item);
    saveItems(items);
    return { ok: true, errors: {}, item: item };
  }

  /** 更新状态：done 表示已完成（已找到/已归还），active 表示恢复进行中 */
  function updateStatus(id, status) {
    var items = loadItems();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        if (status !== 'done' && status !== 'active') return null;
        items[i].status = status;
        items[i].updatedAt = Date.now();
        saveItems(items);
        return items[i];
      }
    }
    return null;
  }

  /** 删除信息，返回是否删除成功 */
  function deleteItem(id) {
    var items = loadItems();
    var next = items.filter(function (i) { return i.id !== id; });
    if (next.length === items.length) return false;
    saveItems(next);
    return true;
  }

  /** 按 id 查询 */
  function getItem(id) {
    var items = loadItems();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  /** 浏览数 +1，返回更新后的信息 */
  function incrementViews(id) {
    var items = loadItems();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        items[i].views = (items[i].views || 0) + 1;
        saveItems(items);
        return items[i];
      }
    }
    return null;
  }

  /** 我的发布：按发布者标识筛选 */
  function getMyItems(owner) {
    var items = loadItems();
    return items
      .filter(function (i) { return i.publisherKey === owner; })
      .sort(function (a, b) { return b.createdAt - a.createdAt; });
  }

  /* ---------- 搜索 ---------- */
  /**
   * 组合搜索：keyword（名称/描述/地点/类别模糊匹配，忽略大小写）
   *            type（lost/found）、category、place、onlyActive
   * 排序：进行中的信息在前，同状态按发布时间倒序
   */
  function searchItems(opts) {
    opts = opts || {};
    var kw = String(opts.keyword || '').trim().toLowerCase();
    var list = loadItems();

    if (opts.onlyActive) list = list.filter(function (i) { return i.status === 'active'; });
    if (opts.type) list = list.filter(function (i) { return i.type === opts.type; });
    if (opts.category) list = list.filter(function (i) { return i.category === opts.category; });
    if (opts.place) list = list.filter(function (i) { return i.place.indexOf(opts.place) >= 0; });

    if (kw) {
      list = list.filter(function (i) {
        var haystack = [i.name, i.desc, i.place, i.category].join(' ').toLowerCase();
        return haystack.indexOf(kw) >= 0;
      });
    }

    return list.slice().sort(function (a, b) {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
  }

  global.Store = {
    STORAGE_KEY: STORAGE_KEY,
    OWNER_KEY: OWNER_KEY,
    CATEGORIES: CATEGORIES,
    loadItems: loadItems,
    saveItems: saveItems,
    lsGet: lsGet,
    lsRemove: lsRemove,
    getOwner: getOwner,
    setOwner: setOwner,
    generateId: generateId,
    isValidPublishData: isValidPublishData,
    isValidContact: isValidContact,
    seedIfEmpty: seedIfEmpty,
    seedDemoOwner: seedDemoOwner,
    createItem: createItem,
    updateStatus: updateStatus,
    deleteItem: deleteItem,
    getItem: getItem,
    incrementViews: incrementViews,
    getMyItems: getMyItems,
    searchItems: searchItems
  };
})(window);

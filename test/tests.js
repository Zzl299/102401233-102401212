/* ==========================================================
 * tests.js —— 校园失物招领 单元测试用例（QUnit）
 * 说明：测试逻辑层 utils.js 与 store.js；
 *       用例设计以白盒方法为主，覆盖边界、异常与组合场景。
 * 运行方式：谷歌浏览器打开 test/test.html 即可。
 * ========================================================== */

/* 固定的测试数据（不依赖真实种子数据，保证用例确定性） */
function makeFixtures() {
  var now = Date.now();
  return [
    { id: 1, type: 'lost',  name: '校园卡',       category: '校园卡',   place: '图书馆', time: '2026-09-20', desc: '卡号尾号 6138',              contactName: '张三', contact: '13800000001', status: 'active', publisherKey: 'A', views: 5, createdAt: now - 300000 },
    { id: 2, type: 'found', name: '白色蓝牙耳机', category: '电子设备', place: '操场',   time: '2026-09-21', desc: 'AirPods 充电仓',             contactName: '李四', contact: '13800000002', status: 'active', publisherKey: 'B', views: 3, createdAt: now - 200000 },
    { id: 3, type: 'lost',  name: '高等数学教材', category: '书籍文具', place: '食堂',   time: '2026-09-22', desc: '上册',                        contactName: '王五', contact: 'wangwu@qq.com', status: 'done',   publisherKey: 'A', views: 8, createdAt: now - 100000 },
    { id: 4, type: 'found', name: '钥匙串',       category: '钥匙',     place: '图书馆', time: '2026-09-23', desc: '蓝色挂件',                    contactName: '赵六', contact: 'wxid_abc',      status: 'active', publisherKey: 'C', views: 2, createdAt: now - 400000 }
  ];
}

function validData() {
  return {
    type: 'lost',
    name: '校园卡',
    category: '校园卡',
    place: '图书馆',
    time: Utils.toDateStr(new Date()),
    desc: '卡号尾号 6138',
    contactName: '张三',
    contact: '13800000001'
  };
}

/* ==========================================================
 * 模块一：发布表单校验 isValidPublishData
 * ========================================================== */
QUnit.module('发布表单校验 isValidPublishData');

QUnit.test('合法数据（寻物）应通过校验', function (assert) {
  var r = Store.isValidPublishData(validData());
  assert.equal(r.ok, true, '合法数据 ok 应为 true');
  assert.deepEqual(r.errors, {}, '合法数据不应有任何错误');
});

QUnit.test('合法数据（招领 + 邮箱联系方式）应通过校验', function (assert) {
  var d = validData();
  d.type = 'found';
  d.contact = 'test@example.com';
  var r = Store.isValidPublishData(d);
  assert.equal(r.ok, true, '招领 + 邮箱联系方式应通过');
});

QUnit.test('信息类型非法时应报错', function (assert) {
  var d = validData();
  d.type = 'other';
  var r = Store.isValidPublishData(d);
  assert.equal(r.ok, false, '非法类型 ok 应为 false');
  assert.ok(r.errors.type, '应包含 type 错误信息');
});

QUnit.test('物品名称为空时应报错', function (assert) {
  var d = validData();
  d.name = '';
  var r = Store.isValidPublishData(d);
  assert.ok(r.errors.name, '空名称应有错误');
});

QUnit.test('物品名称为纯空格时应报错', function (assert) {
  var d = validData();
  d.name = '   ';
  var r = Store.isValidPublishData(d);
  assert.ok(r.errors.name, '纯空格名称应有错误（已 trim）');
});

QUnit.test('物品名称超过 30 个字符时应报错', function (assert) {
  var d = validData();
  d.name = new Array(32).join('字'); // 31 个字符
  var r = Store.isValidPublishData(d);
  assert.ok(r.errors.name, '超长名称应有错误');
});

QUnit.test('类别为空或不在预设列表时应报错', function (assert) {
  var d = validData();
  d.category = '';
  assert.ok(Store.isValidPublishData(d).errors.category, '空类别应有错误');
  d.category = '不存在的类别';
  assert.ok(Store.isValidPublishData(d).errors.category, '非预设类别应有错误');
});

QUnit.test('地点为空或超过 50 字符时应报错', function (assert) {
  var d = validData();
  d.place = '';
  assert.ok(Store.isValidPublishData(d).errors.place, '空地点应有错误');
  d.place = new Array(52).join('地');
  assert.ok(Store.isValidPublishData(d).errors.place, '超长地点应有错误');
});

QUnit.test('时间为空时应报错', function (assert) {
  var d = validData();
  d.time = '';
  assert.ok(Store.isValidPublishData(d).errors.time, '空时间应有错误');
});

QUnit.test('时间格式不正确时应报错', function (assert) {
  var d = validData();
  d.time = '2026/09/20';
  assert.ok(Store.isValidPublishData(d).errors.time, '非 YYYY-MM-DD 格式应有错误');
});

QUnit.test('时间晚于今天（未来日期）时应报错', function (assert) {
  var d = validData();
  d.time = Utils.toDateStr(new Date(Date.now() + 86400000)); // 明天
  assert.ok(Store.isValidPublishData(d).errors.time, '未来日期应有错误');
});

QUnit.test('联系方式为空时应报错', function (assert) {
  var d = validData();
  d.contact = '';
  assert.ok(Store.isValidPublishData(d).errors.contact, '空联系方式应有错误');
});

QUnit.test('联系方式为明显非法内容时应报错', function (assert) {
  var d = validData();
  d.contact = '12';
  assert.ok(Store.isValidPublishData(d).errors.contact, '过短的非法联系方式应有错误');
  d.contact = 'abc!@#';
  assert.ok(Store.isValidPublishData(d).errors.contact, '含特殊字符的联系方式应有错误');
});

QUnit.test('联系方式为 11 位手机号时应通过', function (assert) {
  var d = validData();
  d.contact = '13812345678';
  assert.equal(Store.isValidPublishData(d).ok, true, '合法手机号应通过');
});

QUnit.test('联系方式为 QQ/微信（4 位以上）时应通过', function (assert) {
  var d = validData();
  d.contact = 'abc123';
  assert.equal(Store.isValidPublishData(d).ok, true, '字母数字组合应通过');
  d.contact = '123456';
  assert.equal(Store.isValidPublishData(d).ok, true, '纯数字 QQ 应通过');
});

QUnit.test('详细描述超过 200 字符时应报错', function (assert) {
  var d = validData();
  d.desc = new Array(202).join('描');
  assert.ok(Store.isValidPublishData(d).errors.desc, '超长描述应有错误');
});

/* ==========================================================
 * 模块二：数据操作 createItem / updateStatus / deleteItem / 查询
 * ========================================================== */
QUnit.module('数据操作（createItem / updateStatus / deleteItem / 查询）', {
  beforeEach: function () { localStorage.clear(); },
  afterEach: function () { localStorage.clear(); }
});

QUnit.test('createItem 成功时应生成完整字段', function (assert) {
  var r = Store.createItem(validData());
  assert.equal(r.ok, true, '写入应成功');
  var item = r.item;
  assert.equal(item.id, 1, '空表第一条 id 应为 1');
  assert.equal(item.status, 'active', '新信息默认进行中');
  assert.equal(item.views, 0, '新信息浏览数应为 0');
  assert.equal(item.type, 'lost', '类型应保留');
  assert.ok(item.publisherKey, '应生成发布者标识');
  assert.equal(typeof item.createdAt, 'number', '发布时间戳应为数字');
});

QUnit.test('createItem 校验失败时不应写入数据', function (assert) {
  var d = validData();
  d.name = '';
  var r = Store.createItem(d);
  assert.equal(r.ok, false, '返回 ok 应为 false');
  assert.equal(r.item, null, '不应返回 item');
  assert.equal(Store.loadItems().length, 0, '存储中不应出现新数据');
});

QUnit.test('createItem 之后数据应持久化（写入后能读回）', function (assert) {
  Store.createItem(validData());
  var items = Store.loadItems();
  assert.equal(items.length, 1, '存储中应有一条');
  assert.equal(items[0].name, '校园卡', '名称应正确读回');
});

QUnit.test('updateStatus：寻物信息标记 done 后状态为「已找到」', function (assert) {
  Store.saveItems(makeFixtures());
  var updated = Store.updateStatus(1, 'done');
  assert.ok(updated, '应返回更新后的信息');
  assert.equal(updated.status, 'done', '状态应为 done');
  assert.equal(Utils.statusOf(updated), '已找到', '寻物 + done 文案为已找到');
});

QUnit.test('updateStatus：招领信息标记 done 后状态为「已归还」', function (assert) {
  Store.saveItems(makeFixtures());
  var updated = Store.updateStatus(2, 'done');
  assert.equal(Utils.statusOf(updated), '已归还', '招领 + done 文案为已归还');
});

QUnit.test('updateStatus：不存在的 id 应返回 null 且数据不变', function (assert) {
  Store.saveItems(makeFixtures());
  var before = Store.loadItems().length;
  var updated = Store.updateStatus(999, 'done');
  assert.equal(updated, null, '应返回 null');
  assert.equal(Store.loadItems().length, before, '数据不应变化');
});

QUnit.test('updateStatus：非法状态值应返回 null', function (assert) {
  Store.saveItems(makeFixtures());
  var updated = Store.updateStatus(1, 'xxx');
  assert.equal(updated, null, '非法状态应返回 null');
});

QUnit.test('updateStatus：已完成的可以恢复为进行中', function (assert) {
  Store.saveItems(makeFixtures());
  Store.updateStatus(1, 'done');
  var recovered = Store.updateStatus(1, 'active');
  assert.equal(Utils.statusOf(recovered), '寻找中', '恢复后文案为寻找中');
});

QUnit.test('deleteItem：删除存在的信息返回 true 且列表减少', function (assert) {
  Store.saveItems(makeFixtures());
  assert.equal(Store.deleteItem(2), true, '应返回 true');
  assert.equal(Store.loadItems().length, 3, '列表应减少为 3 条');
});

QUnit.test('deleteItem：删除不存在的信息返回 false', function (assert) {
  Store.saveItems(makeFixtures());
  assert.equal(Store.deleteItem(999), false, '应返回 false');
  assert.equal(Store.loadItems().length, 4, '列表不应变化');
});

QUnit.test('incrementViews：浏览数应 +1 并返回更新后信息', function (assert) {
  Store.saveItems(makeFixtures());
  var item = Store.incrementViews(1);
  assert.equal(item.views, 6, '浏览数应为 6');
  assert.equal(Store.getItem(1).views, 6, '存储中的浏览数也应更新');
});

QUnit.test('generateId：空表返回 1，有数据返回最大 id + 1', function (assert) {
  assert.equal(Store.generateId([]), 1, '空表应返回 1');
  Store.saveItems(makeFixtures());
  assert.equal(Store.generateId(Store.loadItems()), 5, '最大 id 4 → 5');
});

QUnit.test('getItem：不存在的 id 返回 null', function (assert) {
  Store.saveItems(makeFixtures());
  assert.equal(Store.getItem(999), null, '应返回 null');
});

QUnit.test('getMyItems：只返回指定发布者的信息，且按时间倒序', function (assert) {
  Store.saveItems(makeFixtures());
  var mine = Store.getMyItems('A');
  assert.equal(mine.length, 2, '发布者 A 应有 2 条');
  assert.ok(mine.every(function (i) { return i.publisherKey === 'A'; }), '全部属于 A');
  assert.equal(mine[0].id, 3, '最新的一条应排在最前（id 3）');
});

/* ==========================================================
 * 模块三：组合搜索 searchItems
 * ========================================================== */
QUnit.module('组合搜索 searchItems', {
  beforeEach: function () {
    localStorage.clear();
    Store.saveItems(makeFixtures());
  },
  afterEach: function () { localStorage.clear(); }
});

QUnit.test('关键词应匹配名称，且忽略首尾空格与大小写', function (assert) {
  var r1 = Store.searchItems({ keyword: '  校园卡  ' });
  assert.deepEqual(r1.map(function (i) { return i.id; }), [1], '名称匹配校园卡');
  var r2 = Store.searchItems({ keyword: 'airpods' });
  assert.deepEqual(r2.map(function (i) { return i.id; }), [2], '小写关键词应匹配 AirPods');
});

QUnit.test('关键词应匹配描述与地点', function (assert) {
  var r1 = Store.searchItems({ keyword: '尾号' });
  assert.deepEqual(r1.map(function (i) { return i.id; }), [1], '描述匹配');
  var r2 = Store.searchItems({ keyword: '图书馆' });
  assert.deepEqual(r2.map(function (i) { return i.id; }), [1, 4], '地点匹配（2 条）');
});

QUnit.test('按类型 type 筛选', function (assert) {
  var lost = Store.searchItems({ type: 'lost' });
  assert.deepEqual(lost.map(function (i) { return i.id; }), [1, 3], '寻物共 2 条');
  var found = Store.searchItems({ type: 'found' });
  assert.deepEqual(found.map(function (i) { return i.id; }), [2, 4], '招领共 2 条');
});

QUnit.test('按类别 category 筛选', function (assert) {
  var r = Store.searchItems({ category: '电子设备' });
  assert.deepEqual(r.map(function (i) { return i.id; }), [2], '类别筛选应只返回耳机');
});

QUnit.test('按地点 place 模糊筛选', function (assert) {
  var r = Store.searchItems({ place: '图书' });
  assert.deepEqual(r.map(function (i) { return i.id; }), [1, 4], '模糊地点匹配');
});

QUnit.test('组合筛选无结果时应返回空数组', function (assert) {
  var r = Store.searchItems({ keyword: '耳机', type: 'lost', category: '校园卡' });
  assert.deepEqual(r, [], '无匹配组合应返回 []');
});

QUnit.test('onlyActive 应过滤已完成信息', function (assert) {
  var r = Store.searchItems({ onlyActive: true });
  assert.ok(r.every(function (i) { return i.status === 'active'; }), '全部应为进行中');
  assert.equal(r.length, 3, '应有 3 条进行中');
});

QUnit.test('默认排序：进行中在前，同状态按发布时间倒序', function (assert) {
  var r = Store.searchItems({});
  assert.deepEqual(r.map(function (i) { return i.id; }), [2, 1, 4, 3], 'active 三条按时间倒序，done 最后');
});

QUnit.test('空关键词应返回全部信息（按默认排序）', function (assert) {
  var r = Store.searchItems({ keyword: '' });
  assert.equal(r.length, 4, '空关键词返回全部');
});

/* ==========================================================
 * 模块四：工具函数 Utils
 * ========================================================== */
QUnit.module('工具函数 Utils');

QUnit.test('escapeHtml 应转义特殊字符，防止 XSS 注入', function (assert) {
  assert.equal(
    Utils.escapeHtml('<script>alert("x")</script>'),
    '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    '尖括号与引号应被转义'
  );
  assert.equal(Utils.escapeHtml("it's & ok"), 'it&#39;s &amp; ok', '单引号与 & 应被转义');
  assert.equal(Utils.escapeHtml(null), '', 'null 应返回空串');
});

QUnit.test('statusOf：四种类型 × 状态组合的文案正确', function (assert) {
  assert.equal(Utils.statusOf({ type: 'lost', status: 'active' }), '寻找中');
  assert.equal(Utils.statusOf({ type: 'lost', status: 'done' }), '已找到');
  assert.equal(Utils.statusOf({ type: 'found', status: 'active' }), '待认领');
  assert.equal(Utils.statusOf({ type: 'found', status: 'done' }), '已归还');
});

QUnit.test('isFutureDate：今天为 false，明天为 true，非法格式为 false', function (assert) {
  assert.equal(Utils.isFutureDate(Utils.toDateStr(new Date())), false, '今天不是未来日期');
  assert.equal(Utils.isFutureDate(Utils.toDateStr(new Date(Date.now() + 86400000))), true, '明天是未来日期');
  assert.equal(Utils.isFutureDate('2026/09/20'), false, '非法格式不触发');
});

QUnit.test('timeAgo：相对时间文案正确', function (assert) {
  assert.equal(Utils.timeAgo(Date.now() - 1000), '刚刚');
  assert.equal(Utils.timeAgo(Date.now() - 5 * 60000), '5 分钟前');
  assert.equal(Utils.timeAgo(Date.now() - 3 * 3600000), '3 小时前');
  assert.equal(Utils.timeAgo(Date.now() - 2 * 86400000), '2 天前');
});

QUnit.test('friendlyDate：今天/昨天显示为友好文案', function (assert) {
  assert.equal(Utils.friendlyDate(Utils.toDateStr(new Date())), '今天');
  assert.equal(Utils.friendlyDate(Utils.toDateStr(new Date(Date.now() - 86400000))), '昨天');
});

/* ==========================================================
 * 模块五：模拟数据 seedIfEmpty / seedDemoOwner
 * ========================================================== */
QUnit.module('模拟数据 seedIfEmpty / seedDemoOwner', {
  beforeEach: function () { localStorage.clear(); },
  afterEach: function () { localStorage.clear(); }
});

QUnit.test('seedIfEmpty：首次返回 true 且填充 10 条，再次调用返回 false', function (assert) {
  assert.equal(Store.seedIfEmpty(), true, '首次应播种');
  assert.equal(Store.loadItems().length, 10, '应填充 10 条模拟数据');
  assert.equal(Store.seedIfEmpty(), false, '第二次不应重复播种');
  assert.equal(Store.loadItems().length, 10, '数量应保持不变');
});

QUnit.test('seedIfEmpty：已有数据时不覆盖用户数据', function (assert) {
  Store.saveItems([{ id: 1, name: '用户自己的信息' }]);
  Store.seedIfEmpty();
  assert.equal(Store.loadItems().length, 1, '不应覆盖已有数据');
});

QUnit.test('seedDemoOwner：将本机标识为演示发布者并补充 3 条我的信息，重复调用不重复', function (assert) {
  Store.seedIfEmpty();
  Store.seedDemoOwner();
  assert.equal(Store.getOwner(), 'demo-owner', '发布者标识应为 demo-owner');
  assert.equal(Store.getMyItems('demo-owner').length, 3, '应有 3 条我的信息');
  var total = Store.loadItems().length;
  Store.seedDemoOwner();
  assert.equal(Store.loadItems().length, total, '重复调用不应重复添加');
});

/* ============================================================
   韩男养成中心 · 共享逻辑（所有页面都会引入本文件）
   职责：
   1. 注入顶部导航栏 + 高亮当前页面
   2. 提供共享工具：日期、存储、成就计算、皮肤数据
   ============================================================ */

/* ---------- ① 顶部导航 ---------- */
const NAV_ITEMS = [
  { key: "index",        label: "首页", href: "index.html" },
  { key: "checkin",      label: "打卡", href: "checkin.html" },
  { key: "wiki",         label: "百科", href: "wiki.html" },
  { key: "diary",        label: "日记", href: "diary.html" },
  { key: "achievements", label: "成就", href: "achievements.html" },
  { key: "quotes",       label: "金句", href: "quotes.html" },
];

/** 注入导航栏到页面顶部 */
function injectNav(currentKey) {
  const links = NAV_ITEMS.map(
    (n) =>
      `<a href="${n.href}" class="nav-link ${n.key === currentKey ? "active" : ""}">${n.label}</a>`
  ).join("");
  const nav = document.createElement("header");
  nav.className = "topnav";
  nav.innerHTML = `
    <div class="topnav-inner">
      <a class="brand" href="index.html">💪 韩男养成中心</a>
      <nav class="nav-links">${links}</nav>
    </div>`;
  document.body.prepend(nav);
}

/* ---------- ② 日期工具 ---------- */
function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function todayStr() {
  return fmtDate(new Date());
}

/* ---------- ③ 存储层 ---------- */
const LS_META = "sc_meta";
function loadMeta() {
  try { return JSON.parse(localStorage.getItem(LS_META)) || {}; }
  catch { return {}; }
}
function saveMeta(m) { localStorage.setItem(LS_META, JSON.stringify(m)); }
function loadDay(dateStr) {
  try { return JSON.parse(localStorage.getItem("sc_" + dateStr)) || { tasks: {}, skin: 0 }; }
  catch { return { tasks: {}, skin: 0 }; }
}
function saveDay(dateStr, data) { localStorage.setItem("sc_" + dateStr, JSON.stringify(data)); }

/* ---------- ④ 任务与统计（和打卡页共用同一套数据） ---------- */
function acidDay(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  return day === 2 || day === 5;
}
const TASKS = [
  { id: "sunscreen", icon: "☀️", name: "涂防晒出门" },
  { id: "moisture",  icon: "🧴", name: "保湿（大宝）" },
  { id: "resun",     icon: "🔁", name: "补涂防晒" },
  { id: "cleanse",   icon: "🧼", name: "认真洗脸卸防晒" },
  { id: "sleep",     icon: "😴", name: "23:00 前睡觉" },
  { id: "nosugar",   icon: "🚫", name: "没碰奶茶甜饮" },
  { id: "acid",      icon: "💧", name: "刷酸（水杨酸棉片）", onlyOn: acidDay },
];
function tasksFor(dateStr) {
  return TASKS.filter((t) => !t.onlyOn || t.onlyOn(dateStr));
}
function progressOf(dateStr, dayData) {
  const list = tasksFor(dateStr);
  const done = list.filter((t) => dayData.tasks[t.id]).length;
  return list.length ? done / list.length : 0;
}
function isPerfect(dateStr, dayData) { return progressOf(dateStr, dayData) >= 0.8; }

/* 等级系统 */
const LEVEL_TITLES = [
  "初来乍到", "开始注意形象", "精致男孩预备役", "防晒忠诚用户", "半个韩男",
  "水光肌见习生", "清爽欧巴", "行走的荷尔蒙", "韩系天花板", "水光肌大师",
];
const XP_PER_LEVEL = 150, XP_PER_TASK = 5, XP_PERFECT_BONUS = 20;

function calcHistory() {
  let xp = 0, perfect = 0, sum = 0, count = 0, checked = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith("sc_") || key === LS_META) continue;
    const dateStr = key.slice(3);
    const data = loadDay(dateStr);
    if (!data.tasks || !Object.keys(data.tasks).length) continue;
    const done = Object.values(data.tasks).filter(Boolean).length;
    checked += done;
    xp += done * XP_PER_TASK;
    sum += progressOf(dateStr, data);
    count++;
    if (isPerfect(dateStr, data)) { perfect++; xp += XP_PERFECT_BONUS; }
  }
  return { xp, perfect, checked, avgRate: count ? sum / count : null, days: count };
}
function levelOf(xp) { return Math.min(Math.floor(xp / XP_PER_LEVEL) + 1, LEVEL_TITLES.length); }

function calcStreak() {
  let streak = 0;
  const cur = new Date(todayStr() + "T00:00:00");
  if (isPerfect(todayStr(), loadDay(todayStr()))) streak++;
  for (let i = 1; i <= 365; i++) {
    const d = new Date(cur);
    d.setDate(d.getDate() - i);
    const ds = fmtDate(d);
    const data = loadDay(ds);
    if (data.tasks && Object.keys(data.tasks).length && isPerfect(ds, data)) streak++;
    else break;
  }
  return streak;
}

/* ---------- ⑤ 成就定义 ---------- */
const ACHIEVEMENTS = [
  { id: "first",  icon: "🌱", name: "第一步",      desc: "完成第一次打卡",   check: (h) => h.checked >= 1 },
  { id: "day3",   icon: "🔥", name: "三天打鱼",    desc: "累计 3 个完美日",  check: (h) => h.perfect >= 3 },
  { id: "day7",   icon: "🥉", name: "一周之约",    desc: "累计 7 个完美日",  check: (h) => h.perfect >= 7 },
  { id: "day14",  icon: "🥈", name: "半月坚持",    desc: "累计 14 个完美日", check: (h) => h.perfect >= 14 },
  { id: "day30",  icon: "🥇", name: "满月封神",    desc: "累计 30 个完美日", check: (h) => h.perfect >= 30 },
  { id: "streak3",icon: "⚡", name: "连击三连",    desc: "连续 3 天完美",    check: () => calcStreak() >= 3 },
  { id: "streak7",icon: "🌟", name: "七日连击",    desc: "连续 7 天完美",    check: () => calcStreak() >= 7 },
  { id: "lv5",    icon: "💎", name: "半个韩男",    desc: "等级达到 Lv5",     check: (h) => levelOf(h.xp) >= 5 },
  { id: "lv10",   icon: "👑", name: "水光肌大师",  desc: "等级达到 Lv10",    check: (h) => levelOf(h.xp) >= 10 },
  { id: "skin7",  icon: "📝", name: "自我观察者",  desc: "累计记录 7 次皮肤状态", check: (h) => h.skinCount >= 7 },
  { id: "total100",icon:"💯", name: "百勾达人",    desc: "累计勾选 100 项任务", check: (h) => h.checked >= 100 },
];

/** 计算皮肤评分次数（补充进历史统计） */
function enrichHistory(h) {
  let skinCount = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith("sc_") || key === LS_META) continue;
    if (loadDay(key.slice(3)).skin) skinCount++;
  }
  return { ...h, skinCount };
}

/* ---------- ⑥ 每日贴士（各页面共用） ---------- */
const TIPS = [
  "防晒霜用量不足 = 白涂，标准是一整根手指的量",
  "SPF 防 UVB（晒伤），PA 加号防 UVA（晒黑晒老），两个都要看",
  "烟酰胺和维 C 建议早晚分开用，白天维 C 反而能加强光防护",
  "刷酸后 24 小时内皮肤屏障偏弱，防晒必须更严",
  "洗脸水的理想温度是 32~34°C，过热会破坏皮脂膜",
  "糖化反应（AGEs）会让胶原蛋白变黄变脆",
  "睡够 7 小时，皮肤夜间修复效率能翻倍",
  "运动后的脸红是血液循环加速，长期坚持气色会真的变好",
  "枕套每周换洗一次，脸上的细菌主要来源之一",
  "水杨酸亲脂能钻进毛孔，黑头选水杨酸",
  "补涂防晒用喷雾最方便，但喷雾要喷到反光才算够量",
  "唇部没有皮脂腺，不会自己出油保湿",
  "皮肤细胞更新周期约 28 天，护肤坚持一个月才见效",
  "维 C 精华氧化变黄属正常，深褐色就是失效了",
  "熬夜后脸黄的主因是皮质醇升高 + 微循环变差",
  "氨基酸表活（XX酰X氨酸XX）是最温和的洁面成分",
  "物理防晒更温和，化学防晒肤感更清爽",
  "刷酸期间需要的是神经酰胺和 B5，不是猛药美白",
  "每天喝够 1.5L 水，皮肤含水量才有基础保障",
  "口罩闷痘的元凶是局部湿热环境",
  "防晒霜要用洁面洗两遍才干净，残留会闷痘",
  "干皮补水后要锁水，否则水分蒸发反而更干",
  "维 A 醇是抗老金标准，从低浓度建立耐受",
  "眼周皮肤只有脸部 1/3 厚，别拉扯",
  "泡脚能改善面部气色，促进全身微循环",
  "蓝光也会损伤皮肤，长时间盯屏幕后记得护肤",
  "去角质健康频率：油皮一周 1~2 次",
  "烟酰胺不耐受可以先从低浓度隔天用开始",
  "剃须后要用温和保湿，不是含酒精须后水",
  "30 天养成的不只是皮肤，是让好状态可复制的生活系统",
];

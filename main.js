// === Supabase Init ===
var SUPABASE_URL = 'https://vryixoqjzlyjkwktzylt.supabase.co';
var SUPABASE_KEY = 'sb_publishable_7FHu9MGZ_nQdDs3V2NNCLw_aHhNyCLD';
var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// === Copy CA ===
function copyCA() {
  var ca = document.querySelector('.ca-value').textContent.trim();
  navigator.clipboard.writeText(ca).then(function() {
    var btn = document.querySelector('.copy-btn');
    var txt = btn.querySelector('.copy-text');
    txt.textContent = 'Copied! Stay chill.';
    btn.classList.add('copied');
    setTimeout(function() {
      txt.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 2000);
  });
}

// === Format number with commas ===
function fmt(n) {
  return Number(n).toLocaleString('en-US');
}

// === Load all counters on page load ===
async function loadCounters() {
  var liked = JSON.parse(localStorage.getItem('chill_liked') || '{}');
  var { data, error } = await db.from('counters').select('*');
  if (error || !data) return;

  var counters = {};
  data.forEach(function(row) { counters[row.key] = row.count; });

  // Meme likes
  for (var i = 1; i <= 6; i++) {
    var key = 'meme_' + i;
    var el = document.querySelector('[data-meme="' + key + '"] .like-count');
    if (el) el.textContent = fmt(counters[key] || 0);
    if (liked[key]) {
      var btn = document.querySelector('[data-meme="' + key + '"] .like-btn');
      if (btn) btn.classList.add('liked');
    }
  }

  // Chill button
  var chillCount = counters['chill_button'] || 0;
  document.getElementById('chillCount').textContent = fmt(chillCount) + ' banana' + (chillCount !== 1 ? 's' : '') + ' chose to chill';
  if (localStorage.getItem('chill_clicked')) {
    document.getElementById('chillLabel').textContent = 'Now You Are Chill Banana.';
    document.getElementById('chillBtn').classList.add('clicked');
  }

  // Page views
  var today = new Date().toISOString().slice(0, 10);
  var todayKey = 'pv_' + today;
  var todayCount = counters[todayKey] || 0;
  var totalCount = counters['page_views_total'] || 0;
  document.getElementById('todayVisits').textContent = fmt(todayCount);
  document.getElementById('totalVisits').textContent = fmt(totalCount);
}

// === Like Meme ===
var likeLock = {};
async function likeMeme(key, btnEl) {
  if (likeLock[key]) return;
  var liked = JSON.parse(localStorage.getItem('chill_liked') || '{}');
  if (liked[key]) return;

  likeLock[key] = true;
  liked[key] = true;
  localStorage.setItem('chill_liked', JSON.stringify(liked));

  btnEl.classList.add('liked');

  var { data } = await db.from('counters').select('count').eq('key', key).single();
  var newCount = (data ? data.count : 0) + 1;
  await db.from('counters').update({ count: newCount }).eq('key', key);

  btnEl.querySelector('.like-count').textContent = fmt(newCount);
  likeLock[key] = false;
}

// === Chill Button Click ===
var chillLock = false;
async function chillClick() {
  if (chillLock) return;
  chillLock = true;

  var btn = document.getElementById('chillBtn');
  var label = document.getElementById('chillLabel');

  // Visual feedback first
  btn.classList.add('active');
  spawnFloat();

  // Update DB
  var { data } = await db.from('counters').select('count').eq('key', 'chill_button').single();
  var newCount = (data ? data.count : 0) + 1;
  await db.from('counters').update({ count: newCount }).eq('key', 'chill_button');

  document.getElementById('chillCount').textContent = fmt(newCount) + ' banana' + (newCount !== 1 ? 's' : '') + ' chose to chill';
  label.textContent = 'Now You Are Chill Banana.';
  btn.classList.add('clicked');
  localStorage.setItem('chill_clicked', '1');

  setTimeout(function() {
    btn.classList.remove('active');
  }, 300);

  chillLock = false;
}

// === Floating +1 effect ===
function spawnFloat() {
  var btn = document.getElementById('chillBtn');
  var rect = btn.getBoundingClientRect();
  var el = document.createElement('div');
  el.className = 'chill-float';
  el.textContent = '+1';
  el.style.left = (rect.left + rect.width / 2 - 10) + 'px';
  el.style.top = (rect.top - 10) + 'px';
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 1000);
}

// === Track Page View ===
async function trackView() {
  var lastVisit = localStorage.getItem('chill_last_visit');
  var now = Date.now();
  // Throttle: only count once per 30 minutes per browser
  if (lastVisit && (now - Number(lastVisit)) < 1800000) return;
  localStorage.setItem('chill_last_visit', String(now));

  var today = new Date().toISOString().slice(0, 10);
  var todayKey = 'pv_' + today;

  // Increment total
  var { data: totalData } = await db.from('counters').select('count').eq('key', 'page_views_total').single();
  var newTotal = (totalData ? totalData.count : 0) + 1;
  await db.from('counters').update({ count: newTotal }).eq('key', 'page_views_total');

  // Increment today
  var { data: todayData } = await db.from('counters').select('count').eq('key', todayKey).single();
  if (todayData) {
    var newToday = todayData.count + 1;
    await db.from('counters').update({ count: newToday }).eq('key', todayKey);
  } else {
    await db.from('counters').insert({ key: todayKey, count: 1 });
  }

  document.getElementById('todayVisits').textContent = fmt(todayData ? todayData.count + 1 : 1);
  document.getElementById('totalVisits').textContent = fmt(newTotal);
}

// === Boot ===
loadCounters();
trackView();

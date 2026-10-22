// tasks-view.js v3 — 공개 화면 업무 체크리스트 (D-day 카드형, 읽기 전용)
(function(){
  const slug = new URLSearchParams(location.search).get('c');
  if(!slug || typeof sb === 'undefined') return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const WEEK = ['일','월','화','수','목','금','토'];
  const today = new Date(); today.setHours(0,0,0,0);
  const dayDiff = d => Math.round((new Date(d + 'T00:00:00') - today) / 86400000);
  const fmtDate = d => { const t = new Date(d + 'T00:00:00'); return (t.getMonth()+1) + '/' + t.getDate() + '(' + WEEK[t.getDay()] + ')'; };

  const css = document.createElement('style');
  css.textContent = `
    .tv-sum{border-radius:14px;padding:13px 16px;margin-bottom:10px;background:rgba(255,255,255,.85);border:1px solid rgba(0,0,0,.07);font-size:14.5px;}
    .tv-bar{height:7px;background:rgba(0,0,0,.08);border-radius:10px;overflow:hidden;margin-top:9px;}
    .tv-fill{height:100%;background:#5e8a68;transition:width .6s;}
    .tv-warn{color:#c53030;font-weight:800;}
    .tv-chips{display:flex;gap:6px;margin:0 0 12px;flex-wrap:wrap;}
    .tv-chip{border:1px solid rgba(0,0,0,.1);background:rgba(255,255,255,.85);border-radius:20px;padding:6px 13px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;color:inherit;}
    .tv-chip.on{background:#5e8a68;color:#fff;border-color:#5e8a68;}

    .tc{display:flex;align-items:stretch;gap:24px;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:16px 22px 16px 16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.04);}
    .tc-d{flex:none;width:92px;min-height:76px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 6px;text-align:center;}
    .tc-dnum{font-size:22px;font-weight:900;line-height:1.1;letter-spacing:-.5px;}
    .tc-dsub{font-size:11.5px;font-weight:700;margin-top:3px;opacity:.85;}
    .tc-body{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;}
    .tc-title{font-size:17px;font-weight:800;line-height:1.35;}
    .tc-no{font-size:13px;font-weight:800;opacity:.35;margin-right:6px;}
    .tc-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px;}
    .tc-pill{font-size:12.5px;font-weight:600;padding:3px 9px;border-radius:20px;background:rgba(0,0,0,.05);}
    .tc-note{font-size:13px;margin-top:9px;opacity:.75;}

    .tc.over  .tc-d{background:#fde8e8;color:#c53030;}
    .tc.over  {border-color:#f5c2c2;}
    .tc.soon  .tc-d{background:#fff1db;color:#c05621;}
    .tc.mid   .tc-d{background:#e6effa;color:#2b5797;}
    .tc.far   .tc-d{background:#eef0f3;color:#5c6270;}
    .tc.nodate .tc-d{background:#f3f4f6;color:#9aa0aa;}
    .tc.done  .tc-d{background:#e3f0e5;color:#3f7a4c;}
    .tc.done  .tc-title{text-decoration:line-through;opacity:.5;}
    .tc.done  {opacity:.75;}
    .tv-empty{text-align:center;padding:24px;opacity:.6;font-size:13.5px;}

    @media(max-width:600px){
      .tc{gap:16px;padding:13px 16px 13px 13px;}
      .tc-d{width:78px;min-height:68px;}
      .tc-dnum{font-size:19px;}
      .tc-title{font-size:15.5px;}
    }
    body[data-theme="dark"] .tc, body[data-theme="dark"] .tv-sum, body[data-theme="dark"] .tv-chip{background:#1a212a;border-color:#2a3340;}
    body[data-theme="dark"] .tc-pill{background:rgba(255,255,255,.08);}
    body[data-theme="dark"] .tv-bar{background:rgba(255,255,255,.1);}
    body[data-theme="dark"] .tv-chip.on{background:#5e8a68;color:#fff;}
  `;
  document.head.appendChild(css);

  let TASKS = [], FILTER = 'all';

  function dInfo(t){
    if(t.done) return { cls:'done', num:'✔', sub:'완료' };
    if(!t.due_date) return { cls:'nodate', num:'미정', sub:'기한 없음' };
    const n = dayDiff(t.due_date), date = fmtDate(t.due_date);
    if(n < 0)   return { cls:'over', num:'D+' + (-n), sub:(-n) + '일 지남' };
    if(n === 0) return { cls:'over', num:'D-DAY', sub:'오늘 마감' };
    if(n <= 7)  return { cls:'soon', num:'D-' + n, sub:date };
    if(n <= 30) return { cls:'mid',  num:'D-' + n, sub:date };
    return { cls:'far', num:'D-' + n, sub:date };
  }

  function render(){
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.date === '__tasks__'));
    const list = TASKS.map((t, i) => Object.assign({}, t, { no: i + 1 }));
    const done = list.filter(t => t.done).length;
    const todo = list.length - done;
    const total = list.reduce((a, t) => a + (t.budget || 0), 0);
    const pct = list.length ? Math.round(done / list.length * 100) : 0;
    const overdue = list.filter(t => !t.done && t.due_date && dayDiff(t.due_date) < 0).length;
    const urgent = list.filter(t => !t.done && t.due_date && dayDiff(t.due_date) >= 0 && dayDiff(t.due_date) <= 7).length;
    const key = t => t.due_date || '9999-12-31';
    const shown = list
      .filter(t => FILTER === 'all' || (FILTER === 'todo' ? !t.done : t.done))
      .sort((a, b) => (a.done - b.done) || (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0) || (a.no - b.no));

    let html = `<div class="tv-sum">진행 <b>${done} / ${list.length}</b> 완료 (${pct}%)` +
      (total ? ` · 예산 <b>₩${total.toLocaleString()}</b>` : '') +
      (overdue ? ` · <span class="tv-warn">⛔ 기한 지남 ${overdue}건</span>` : '') +
      (urgent ? ` · <span class="tv-warn">⚠ 7일 이내 마감 ${urgent}건</span>` : '') +
      `<div class="tv-bar"><div class="tv-fill" style="width:${pct}%"></div></div></div>`;

    html += `<div class="tv-chips">
      <button class="tv-chip ${FILTER==='all'?'on':''}" data-f="all">전체 ${list.length}</button>
      <button class="tv-chip ${FILTER==='todo'?'on':''}" data-f="todo">진행중 ${todo}</button>
      <button class="tv-chip ${FILTER==='done'?'on':''}" data-f="done">완료 ${done}</button>
    </div>`;

    if(!shown.length) html += '<div class="tv-empty">해당하는 업무가 없습니다.</div>';
    shown.forEach(t => {
      const d = dInfo(t);
      const pills = [];
      if(t.assignee) pills.push('👤 ' + esc(t.assignee));
      if(t.budget)   pills.push('💰 ₩' + Number(t.budget).toLocaleString());
      if(t.done && t.due_date) pills.push('📅 ' + fmtDate(t.due_date));
      html += `<div class="tc ${d.cls}">
        <div class="tc-d"><div class="tc-dnum">${d.num}</div><div class="tc-dsub">${d.sub}</div></div>
        <div class="tc-body">
          <div class="tc-title"><span class="tc-no">${t.no}</span>${esc(t.title)}</div>
          ${pills.length ? `<div class="tc-meta">${pills.map(p => `<span class="tc-pill">${p}</span>`).join('')}</div>` : ''}
          ${t.note ? `<div class="tc-note">📝 ${esc(t.note)}</div>` : ''}
        </div>
      </div>`;
    });

    const content = document.getElementById('content');
    content.innerHTML = html;
    content.querySelectorAll('.tv-chip').forEach(c => c.onclick = () => { FILTER = c.dataset.f; render(); });
  }

  async function start(){
    const { data: camp } = await sb.from('camps').select('id').eq('slug', slug).single();
    if(!camp) return;
    const { data } = await sb.from('tasks').select('*').eq('camp_id', camp.id).order('sort_order').order('id');
    TASKS = data || [];
    if(!TASKS.length) return;
    const wait = setInterval(() => {
      const c = document.getElementById('content');
      if(!c || c.textContent.includes('불러오는 중')) return;
      clearInterval(wait);
      const tabs = document.getElementById('tabs');
      if(tabs.querySelector('.tab')){ const dv = document.createElement('span'); dv.className = 'tab-divider'; tabs.appendChild(dv); }
      const b = document.createElement('button');
      b.className = 'tab'; b.dataset.date = '__tasks__'; b.textContent = '✅ 업무 체크리스트';
      b.onclick = render;
      tabs.appendChild(b);
      if(!document.querySelector('.tab.active')) render();
    }, 300);
  }
  start();
})();

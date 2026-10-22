// tasks-view.js v6 — 공개 화면 업무 체크리스트 (D-day 카드형 + 담당별 보기, 읽기 전용)
(function(){
  const slug = new URLSearchParams(location.search).get('c');
  if(!slug || typeof sb === 'undefined') return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const WEEK = ['일','월','화','수','목','금','토'];
  const today = new Date(); today.setHours(0,0,0,0);
  const dayDiff = d => Math.round((new Date(d + 'T00:00:00') - today) / 86400000);
  const fmtDate = d => { const t = new Date(d + 'T00:00:00'); return (t.getMonth()+1) + '/' + t.getDate() + '(' + WEEK[t.getDay()] + ')'; };
  const NONE = '담당 미정';
  const ownerKey = a => String(a || '').replace(/[?？]/g, '').trim() || NONE;

  const css = document.createElement('style');
  css.textContent = `
    .tv-sum{border-radius:14px;padding:15px 18px;margin-bottom:12px;background:rgba(255,255,255,.85);border:1px solid rgba(0,0,0,.07);font-size:15.5px;}
    .tv-bar{height:8px;background:rgba(0,0,0,.08);border-radius:10px;overflow:hidden;margin-top:10px;}
    .tv-fill{height:100%;background:#5e8a68;transition:width .6s;}
    .tv-warn{color:#c53030;font-weight:800;}
    .tv-chips{display:flex;gap:8px;margin:0 0 16px;flex-wrap:wrap;align-items:center;}
    .tv-chip{border:1px solid rgba(0,0,0,.12);background:rgba(255,255,255,.9);border-radius:22px;padding:9px 16px;font-size:14.5px;font-weight:700;cursor:pointer;font-family:inherit;color:inherit;}
    .tv-chip.on{background:#5e8a68;color:#fff;border-color:#5e8a68;}
    .tv-sep{width:1px;height:24px;background:rgba(0,0,0,.12);margin:0 4px;}
    .tv-chip.grp.on{background:#4a5b7c;border-color:#4a5b7c;}

    .tg-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:26px 4px 12px;padding-bottom:9px;border-bottom:2px solid rgba(0,0,0,.1);}
    .tg-head:first-of-type{margin-top:6px;}
    .tg-name{font-size:19px;font-weight:900;}
    .tg-cnt{font-size:14px;font-weight:700;opacity:.65;}

    .tc{display:flex;align-items:stretch;gap:24px;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:16px 22px 16px 16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.04);}
    .tc-d{flex:none;width:96px;min-height:80px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 6px;text-align:center;}
    .tc-dnum{font-size:24px;font-weight:900;line-height:1.1;letter-spacing:-.5px;}
    .tc-dsub{font-size:12.5px;font-weight:700;margin-top:4px;opacity:.85;}
    .tc-body{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;}
    .tc-title{font-size:18px;font-weight:800;line-height:1.4;}
    .tc-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px;}
    .tc-pill{font-size:13.5px;font-weight:600;padding:4px 11px;border-radius:20px;background:rgba(0,0,0,.05);}
    .tc-note{font-size:14px;margin-top:9px;opacity:.75;line-height:1.5;}

    .tc.over  .tc-d{background:#fde8e8;color:#c53030;}
    .tc.over  {border-color:#f5c2c2;}
    .tc.soon  .tc-d{background:#fff1db;color:#c05621;}
    .tc.mid   .tc-d{background:#e6effa;color:#2b5797;}
    .tc.far   .tc-d{background:#eef0f3;color:#5c6270;}
    .tc.nodate .tc-d{background:#f3f4f6;color:#9aa0aa;}
    .tc.done  .tc-d{background:#e3f0e5;color:#3f7a4c;}
    .tc.done  .tc-title{text-decoration:line-through;opacity:.5;}
    .tc.done  {opacity:.75;}
    .tv-empty{text-align:center;padding:28px;opacity:.6;font-size:15px;}

    @media(max-width:600px){
      .tc{gap:16px;padding:13px 16px 13px 13px;}
      .tc-d{width:80px;min-height:70px;}
      .tc-dnum{font-size:21px;}
      .tc-title{font-size:16.5px;}
      .tg-name{font-size:17.5px;}
      .tv-chip{padding:8px 13px;font-size:14px;}
    }
    body[data-theme="dark"] .tc, body[data-theme="dark"] .tv-sum, body[data-theme="dark"] .tv-chip{background:#1a212a;border-color:#2a3340;}
    body[data-theme="dark"] .tc-pill{background:rgba(255,255,255,.08);}
    body[data-theme="dark"] .tv-bar{background:rgba(255,255,255,.1);}
    body[data-theme="dark"] .tv-chip.on{background:#5e8a68;color:#fff;}
    body[data-theme="dark"] .tv-chip.grp.on{background:#7fb0e0;color:#12161c;}
    body[data-theme="dark"] .tg-head{border-bottom-color:#2a3340;}
    body[data-theme="dark"] .tv-sep{background:#2a3340;}
  `;
  document.head.appendChild(css);

  let TASKS = [], FILTER = 'all', GROUP = false;

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

  function card(t, groupName){
    const d = dInfo(t);
    const pills = [];
    // 담당별 보기에서는 묶음 이름과 같으면 담당 배지 생략 (초등부? 처럼 다르면 표시)
    if(t.assignee && (!groupName || t.assignee.trim() !== groupName)) pills.push('👤 ' + esc(t.assignee));
    if(t.budget)   pills.push('💰 ₩' + Number(t.budget).toLocaleString());
    if(t.done && t.due_date) pills.push('📅 ' + fmtDate(t.due_date));
    return `<div class="tc ${d.cls}">
      <div class="tc-d"><div class="tc-dnum">${d.num}</div><div class="tc-dsub">${d.sub}</div></div>
      <div class="tc-body">
        <div class="tc-title">${esc(t.title)}</div>
        ${pills.length ? `<div class="tc-meta">${pills.map(p => `<span class="tc-pill">${p}</span>`).join('')}</div>` : ''}
        ${t.note ? `<div class="tc-note">📝 ${esc(t.note)}</div>` : ''}
      </div>
    </div>`;
  }

  function render(){
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.date === '__tasks__'));
    const list = TASKS.slice();
    const done = list.filter(t => t.done).length;
    const todo = list.length - done;
    const total = list.reduce((a, t) => a + (t.budget || 0), 0);
    const pct = list.length ? Math.round(done / list.length * 100) : 0;
    const overdue = list.filter(t => !t.done && t.due_date && dayDiff(t.due_date) < 0).length;
    const urgent = list.filter(t => !t.done && t.due_date && dayDiff(t.due_date) >= 0 && dayDiff(t.due_date) <= 7).length;
    const key = t => t.due_date || '9999-12-31';
    const shown = list
      .filter(t => FILTER === 'all' || (FILTER === 'todo' ? !t.done : t.done))
      .sort((a, b) => (a.done - b.done) || (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0) || ((a.sort_order||0) - (b.sort_order||0)));

    let html = `<div class="tv-sum">진행 <b>${done} / ${list.length}</b> 완료 (${pct}%)` +
      (total ? ` · 예산 <b>₩${total.toLocaleString()}</b>` : '') +
      (overdue ? ` · <span class="tv-warn">⛔ 기한 지남 ${overdue}건</span>` : '') +
      (urgent ? ` · <span class="tv-warn">⚠ 7일 이내 마감 ${urgent}건</span>` : '') +
      `<div class="tv-bar"><div class="tv-fill" style="width:${pct}%"></div></div></div>`;

    html += `<div class="tv-chips">
      <button class="tv-chip ${FILTER==='all'?'on':''}" data-f="all">전체 ${list.length}</button>
      <button class="tv-chip ${FILTER==='todo'?'on':''}" data-f="todo">진행중 ${todo}</button>
      <button class="tv-chip ${FILTER==='done'?'on':''}" data-f="done">완료 ${done}</button>
      <span class="tv-sep"></span>
      <button class="tv-chip grp ${GROUP?'on':''}" data-g="1">👥 담당별 보기</button>
    </div>`;

    if(!shown.length){
      html += '<div class="tv-empty">해당하는 업무가 없습니다.</div>';
    } else if(!GROUP){
      shown.forEach(t => { html += card(t); });
    } else {
      // 급한 업무가 있는 담당이 위로 (shown이 이미 급한 순), 담당 미정은 맨 아래
      const groups = {}, order = [];
      shown.forEach(t => {
        const k = ownerKey(t.assignee);
        if(!groups[k]){ groups[k] = []; order.push(k); }
        groups[k].push(t);
      });
      const names = order.filter(n => n !== NONE).concat(order.includes(NONE) ? [NONE] : []);
      names.forEach(name => {
        const g = groups[name];
        // 묶음별 개수는 필터와 상관없이 전체 기준
        const all = list.filter(t => ownerKey(t.assignee) === name);
        const gd = all.filter(t => t.done).length, gt = all.length - gd;
        html += `<div class="tg-head"><span class="tg-name">👤 ${esc(name)}</span><span class="tg-cnt">진행 ${gt}건 · 완료 ${gd}건</span></div>`;
        g.forEach(t => { html += card(t, name); });
      });
    }

    const content = document.getElementById('content');
    content.innerHTML = html;
    content.querySelectorAll('.tv-chip[data-f]').forEach(c => c.onclick = () => { FILTER = c.dataset.f; render(); });
    content.querySelectorAll('.tv-chip[data-g]').forEach(c => c.onclick = () => { GROUP = !GROUP; render(); });
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

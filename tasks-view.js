// tasks-view.js — 공개 화면(camp.html)에 업무 체크리스트 탭 표시 (읽기 전용)
(function(){
  const slug = new URLSearchParams(location.search).get('c');
  if(!slug || typeof sb === 'undefined') return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const WEEK = ['일','월','화','수','목','금','토'];
  const fmtDate = d => { if(!d) return ''; const t = new Date(d + 'T00:00:00'); return (t.getMonth()+1) + '/' + t.getDate() + '(' + WEEK[t.getDay()] + ')'; };

  const css = document.createElement('style');
  css.textContent = `
    .tv-sum{border-radius:14px;padding:14px 16px;margin-bottom:12px;background:rgba(255,255,255,.75);border:1px solid rgba(0,0,0,.07);font-size:14.5px;}
    .tv-bar{height:8px;background:rgba(0,0,0,.08);border-radius:10px;overflow:hidden;margin-top:9px;}
    .tv-fill{height:100%;background:#5e8a68;transition:width .6s;}
    .tv-item{border-radius:12px;padding:12px 14px;margin-bottom:9px;background:rgba(255,255,255,.75);border:1px solid rgba(0,0,0,.07);border-left:4px solid #f0b75e;}
    .tv-item.done{border-left-color:#5e8a68;}
    .tv-head{display:flex;align-items:center;gap:8px;}
    .tv-no{font-weight:800;opacity:.45;width:20px;text-align:center;flex:none;}
    .tv-title{flex:1;font-weight:800;font-size:15px;}
    .tv-item.done .tv-title{text-decoration:line-through;opacity:.55;}
    .tv-badge{flex:none;font-size:12px;font-weight:800;padding:3px 10px;border-radius:20px;white-space:nowrap;}
    .tv-badge.ok{background:#5e8a68;color:#fff;}
    .tv-badge.wait{background:#fff4e0;color:#b7791f;}
    .tv-meta{font-size:13px;margin-top:6px;padding-left:28px;opacity:.8;display:flex;flex-wrap:wrap;gap:4px 14px;}
    body[data-theme="dark"] .tv-item, body[data-theme="dark"] .tv-sum{background:#1a212a;border-color:#2a3340;}
    body[data-theme="dark"] .tv-bar{background:rgba(255,255,255,.1);}
  `;
  document.head.appendChild(css);

  let TASKS = [];

  function render(){
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.date === '__tasks__'));
    const done = TASKS.filter(t => t.done).length;
    const total = TASKS.reduce((a, t) => a + (t.budget || 0), 0);
    const pct = TASKS.length ? Math.round(done / TASKS.length * 100) : 0;
    let html = `<div class="tv-sum">진행 <b>${done} / ${TASKS.length}</b> 완료 (${pct}%)` +
      (total ? ` &nbsp;·&nbsp; 예산 총계 <b>₩${total.toLocaleString()}</b>` : '') +
      `<div class="tv-bar"><div class="tv-fill" style="width:${pct}%"></div></div></div>`;
    TASKS.forEach((t, i) => {
      const meta = [];
      if(t.assignee) meta.push('👤 ' + esc(t.assignee));
      if(t.due_date) meta.push('📅 ' + fmtDate(t.due_date) + '까지');
      if(t.budget)   meta.push('💰 ₩' + Number(t.budget).toLocaleString());
      if(t.note)     meta.push('📝 ' + esc(t.note));
      html += `<div class="tv-item ${t.done ? 'done' : ''}">
        <div class="tv-head">
          <span class="tv-no">${i + 1}</span>
          <span class="tv-title">${esc(t.title)}</span>
          ${t.done ? '<span class="tv-badge ok">✔ 완료</span>' : '<span class="tv-badge wait">진행중</span>'}
        </div>
        ${meta.length ? `<div class="tv-meta">${meta.map(m => `<span>${m}</span>`).join('')}</div>` : ''}
      </div>`;
    });
    document.getElementById('content').innerHTML = html;
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

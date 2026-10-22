// date-label.js — 날짜 탭에 이름 붙이기 (admin.html, camp.html 공용)
(function(){
  const slug = new URLSearchParams(location.search).get('c');
  if(!slug || typeof sb === 'undefined') return;
  const isAdmin = /admin\.html/.test(location.pathname);
  let LABELS = {};

  // "12/27(일)" → "12/27"
  const keyOf = txt => {
    const m = String(txt || '').match(/^\s*(\d{1,2})\/(\d{1,2})/);
    return m ? (+m[1]) + '/' + (+m[2]) : null;
  };

  const css = document.createElement('style');
  css.textContent = '.dl-name{margin-left:6px;font-weight:800;}';
  document.head.appendChild(css);

  // 날짜 탭에 이름 표시
  function paint(){
    document.querySelectorAll('.tab').forEach(t => {
      if(t.dataset.date === '__tasks__') return;
      const k = keyOf(t.textContent);
      if(!k) return;
      const want = LABELS[k] || '';
      let s = t.querySelector('.dl-name');
      if(want){
        if(!s){ s = document.createElement('span'); s.className = 'dl-name'; t.appendChild(s); }
        if(s.textContent !== want) s.textContent = want;
      } else if(s){ s.remove(); }
    });
  }

  // 관리자 화면: "날짜 변경" 옆에 버튼 추가
  function addBtn(){
    if(!isAdmin || document.getElementById('dlBtn')) return;
    const ref = [...document.querySelectorAll('button')].find(b => b.textContent.includes('날짜 변경'));
    if(!ref) return;
    const b = document.createElement('button');
    b.id = 'dlBtn'; b.type = 'button';
    b.className = ref.className;
    b.textContent = '✏ 이름 붙이기';
    b.onclick = rename;
    ref.after(b);
  }

  async function rename(){
    const active = document.querySelector('.tab.active');
    const k = active ? keyOf(active.textContent) : null;
    if(!k){ alert('먼저 날짜 탭을 선택해주세요.'); return; }
    const name = prompt(k + ' 날짜 탭에 붙일 이름을 입력하세요.\n(비우고 확인하면 이름이 지워집니다)', LABELS[k] || '');
    if(name === null) return;
    const next = Object.assign({}, LABELS);
    if(name.trim()) next[k] = name.trim(); else delete next[k];
    const { data, error } = await sb.from('camps').update({ date_labels: next }).eq('slug', slug).select('id');
    if(error){ alert('저장 실패: ' + error.message); return; }
    if(!data || !data.length){ alert('저장 권한이 없어요. 담당 계정으로 로그인했는지 확인해주세요.'); return; }
    LABELS = next;
    paint();
  }

  async function start(){
    const { data } = await sb.from('camps').select('date_labels').eq('slug', slug).single();
    LABELS = (data && data.date_labels) || {};
    setInterval(() => { paint(); addBtn(); }, 700);
  }
  start();
})();

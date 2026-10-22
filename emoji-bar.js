// emoji-bar.js — 정보 탭(회의록 등) 카드에 이모지 버튼 줄 추가
(function(){
  const EMOJIS = ['📋','📌','📢','✅','⚠️','❗','💡','🔔','📅','⏰','📍','👤','👥','🎤','🎹','🎻','🥁','🎵','🎬','📷','🎄','⭐','🎁','🙏','✝️','❤️','👉','✔️','❌','➡️'];
  let last = null;
  document.addEventListener('focusin', e => {
    const t = e.target;
    if(t && /^(pt|pc)-/.test(t.id || '')) last = t;
  });

  const css = document.createElement('style');
  css.textContent = `
    .eb-bar{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0 4px;align-items:center;}
    .eb-bar .eb-lb{font-size:12.5px;font-weight:700;color:#6b7280;margin-right:4px;}
    .eb-bar button{border:1px solid #e3e6ec;background:#fff;border-radius:8px;width:34px;height:32px;font-size:17px;cursor:pointer;padding:0;}
    .eb-bar button:hover{background:#eef3ee;border-color:#9bb89b;}`;
  document.head.appendChild(css);

  function insert(el, emo){
    const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? s;
    el.value = el.value.slice(0, s) + emo + el.value.slice(e);
    el.focus();
    el.selectionStart = el.selectionEnd = s + emo.length;
    el.dispatchEvent(new Event('input', { bubbles: true }));  // 자동 저장
  }

  function attach(){
    document.querySelectorAll('textarea[id^="pc-"]').forEach(ta => {
      if(ta.dataset.eb) return;
      ta.dataset.eb = '1';
      const id = ta.id.slice(3);
      const bar = document.createElement('div');
      bar.className = 'eb-bar';
      bar.innerHTML = '<span class="eb-lb">이모지 넣기</span>';
      EMOJIS.forEach(emo => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = emo;
        b.onmousedown = ev => ev.preventDefault();  // 커서 위치 유지
        b.onclick = () => {
          const same = last && (last.id === 'pt-' + id || last.id === 'pc-' + id);
          insert(same ? last : ta, emo);
        };
        bar.appendChild(b);
      });
      ta.after(bar);
    });
  }
  setInterval(attach, 700);
})();

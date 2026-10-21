// og-admin.js — 카카오톡 공유 썸네일 관리 (admin.html 전용)
(function(){
  const slug = new URLSearchParams(location.search).get('c');
  if(!slug || typeof sb === 'undefined') return;

  const SITE = 'https://covenant.chatbotai.co.kr';
  const PATH = 'og/' + slug + '.jpg';
  const shareUrl = SITE + '/s/' + slug + '.html';
  const imgUrl = sb.storage.from('uploads').getPublicUrl(PATH).data.publicUrl;
  const BTN = 'border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block;font-family:inherit;';
  let rendered = false;

  function toOg(f){
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const W = 1200, H = 630, c = document.createElement('canvas');
        c.width = W; c.height = H;
        const x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
        const s = Math.max(W / img.width, H / img.height);
        const w = img.width * s, h = img.height * s;
        x.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
        URL.revokeObjectURL(img.src);
        c.toBlob(b => b ? res(b) : rej(new Error('변환 실패')), 'image/jpeg', 0.85);
      };
      img.onerror = () => rej(new Error('이미지를 읽을 수 없습니다'));
      img.src = URL.createObjectURL(f);
    });
  }

  function render(){
    if(rendered) return; rendered = true;
    const box = document.createElement('div');
    box.id = 'ogBox';
    box.style.cssText = 'margin:0 0 16px;padding:18px 20px;background:#fff;border:1px solid #e3e6ec;border-radius:14px;';
    box.innerHTML = `
      <div style="font-size:16px;font-weight:800;margin-bottom:4px">💬 카카오톡 공유 썸네일</div>
      <div style="font-size:12.5px;color:#8a909c;margin-bottom:12px">이미지를 올리면 1200×630 JPG로 자동 변환해서 저장합니다.</div>
      <img id="ogPrev" alt="" style="width:100%;max-width:420px;aspect-ratio:1200/630;object-fit:cover;border-radius:10px;background:#f1f3f6;display:block;margin-bottom:10px">
      <div id="ogNone" style="display:none;font-size:13px;color:#b23b3b;margin-bottom:10px">아직 등록된 썸네일이 없습니다.</div>
      <input type="file" id="ogFile" accept="image/*" style="display:none">
      <button type="button" id="ogPick" style="${BTN}background:#4a5b7c;color:#fff">📷 썸네일 이미지 선택/변경</button>
      <div style="margin-top:14px;font-size:12.5px;color:#8a909c;font-weight:700">카톡에 보낼 링크</div>
      <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">
        <input id="ogLink" readonly value="${shareUrl}" onclick="this.select()" style="flex:1;min-width:220px;padding:7px 10px;border:1px solid #dde1e8;border-radius:8px;background:#f7f8fa;color:#5c6270;font-family:inherit;font-size:13px">
        <button type="button" id="ogCopy" style="${BTN}background:#eef1f6;color:#4a5b7c">🔗 복사</button>
        <a href="https://developers.kakao.com/tool/debugger/sharing" target="_blank" style="${BTN}background:#fee500;color:#3c1e1e">🔄 카톡 캐시 초기화</a>
      </div>
      <div id="ogMsg" style="font-size:13px;margin-top:8px"></div>`;

    const anchor = document.getElementById('campEdit');
    if(anchor) anchor.after(box); else document.body.appendChild(box);

    const $ = s => box.querySelector(s);
    const prev = $('#ogPrev'), file = $('#ogFile');
    const msg = (t, bad) => { $('#ogMsg').textContent = t; $('#ogMsg').style.color = bad ? '#b23b3b' : '#5e8a68'; };
    const show = () => { prev.style.display = 'block'; $('#ogNone').style.display = 'none'; prev.src = imgUrl + '?t=' + Date.now(); };

    prev.onerror = () => { prev.style.display = 'none'; $('#ogNone').style.display = 'block'; };
    show();

    $('#ogPick').onclick = () => file.click();
    $('#ogCopy').onclick = () => navigator.clipboard.writeText(shareUrl).then(() => msg('링크 복사 완료!'));

    file.onchange = async () => {
      const f = file.files[0]; if(!f) return;
      try{
        msg('⏳ 변환 중...');
        const blob = await toOg(f);
        msg('⏳ 업로드 중... (' + Math.round(blob.size / 1024) + 'KB)');
        const { error } = await sb.storage.from('uploads')
          .upload(PATH, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '60' });
        if(error) throw error;
        show();
        msg('✅ 저장 완료! 이미 카톡에 공유했던 링크라면 "카톡 캐시 초기화"에 링크를 넣어주세요.');
      }catch(e){ msg('❌ 실패: ' + (e.message || e), true); }
      file.value = '';
    };
  }

  sb.auth.getSession().then(({ data }) => { if(data.session) render(); });
  sb.auth.onAuthStateChange((ev, session) => { if(session) render(); });
})();

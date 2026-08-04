// ===== Supabase 접속 설정 (모든 페이지 공통) =====
const SB_URL = 'https://gaigimhrlyvosgbwauxi.supabase.co';
const SB_KEY = 'sb_publishable_XdNI8L7FS52uhLvt2xSW1Q_OGtxfn9S';
const sb = supabase.createClient(SB_URL, SB_KEY);

// ===== 관리자 페이지 비밀번호 =====
const ADMIN_PW = '111111';

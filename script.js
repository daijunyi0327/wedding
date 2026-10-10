// 1. 开场按钮 → 播放音乐 → 显示主内容
const cover = document.getElementById('cover');
const main = document.getElementById('main');
const bgm = document.getElementById('bgm');
const openBtn = document.getElementById('openBtn');

openBtn.addEventListener('click', () => {
  cover.style.transition = 'opacity .6s';
  cover.style.opacity = '0';
  setTimeout(() => {
    cover.classList.add('hidden');
    main.classList.remove('hidden');
    // 微信里必须用户点击后才能播放，这里正好
    bgm.play().catch(() => {});
  }, 600);
});

// 2. 倒计时
const target = new Date('2026-10-10T12:00:00+08:00').getTime();

function updateCountdown() {
  const now = Date.now();
  let diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff % 86400000 / 3600000);
  const m = Math.floor(diff % 3600000 / 60000);
  const s = Math.floor(diff % 60000 / 1000);
  document.getElementById('d').textContent = d;
  document.getElementById('h').textContent = String(h).padStart(2, '0');
  document.getElementById('m').textContent = String(m).padStart(2, '0');
  document.getElementById('s').textContent = String(s).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

// 3. 滚动淡入（可选，用 IntersectionObserver 做轻量动画）
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.transition = 'opacity .8s, transform .8s';
      e.target.style.opacity = 1;
      e.target.style.transform = 'translateY(0)';
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.section').forEach(sec => {
  sec.style.opacity = 0;
  sec.style.transform = 'translateY(30px)';
  io.observe(sec);
});
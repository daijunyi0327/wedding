// 1. 开场按钮：音乐播放必须直接处于用户点击事件中，不能放进定时器。
const cover = document.getElementById('cover');
const main = document.getElementById('main');
const bgm = document.getElementById('bgm');
const openBtn = document.getElementById('openBtn');
const musicToggle = document.getElementById('musicToggle');
const musicStatus = document.getElementById('musicStatus');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function showMusicUnavailable() {
  musicToggle.classList.add('hidden');
  musicStatus.textContent = '背景音乐暂不可用，不影响查看邀请函。';
  musicStatus.classList.remove('hidden');
}

function playMusic() {
  bgm.play().catch(error => {
    if (error.name === 'NotAllowedError') {
      musicToggle.classList.remove('hidden');
      musicStatus.textContent = '浏览器阻止了音乐播放，可点击右上角“播放音乐”重试。';
      musicStatus.classList.remove('hidden');
    } else {
      showMusicUnavailable();
    }
  });
}

bgm.addEventListener('error', showMusicUnavailable);
bgm.addEventListener('playing', () => {
  musicToggle.textContent = '暂停音乐';
  musicToggle.setAttribute('aria-pressed', 'true');
  musicToggle.classList.remove('hidden');
  musicStatus.classList.add('hidden');
});
bgm.addEventListener('pause', () => {
  musicToggle.textContent = '播放音乐';
  musicToggle.setAttribute('aria-pressed', 'false');
});
musicToggle.addEventListener('click', () => {
  if (bgm.paused) {
    playMusic();
  } else {
    bgm.pause();
  }
});

openBtn.addEventListener('click', () => {
  openBtn.disabled = true;
  // 渐隐期间也立即停止拦截点击；结束后彻底隐藏遮罩。
  cover.style.pointerEvents = 'none';
  cover.style.opacity = '0';
  playMusic();
  setTimeout(() => {
    cover.classList.add('hidden');
    main.classList.remove('hidden');
    main.focus({ preventScroll: true });
  }, reduceMotion ? 0 : 600);
});

// 2. 从页面时间读取倒计时目标，统一使用北京时间，避免展示日期和计时日期不同。
const target = Date.parse(document.getElementById('weddingTime').dateTime);
const countdownStatus = document.getElementById('countdownStatus');

function updateCountdown() {
  if (!Number.isFinite(target)) {
    countdownStatus.textContent = '婚礼时间待确认';
    return false;
  }
  const diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff % 86400000 / 3600000);
  const m = Math.floor(diff % 3600000 / 60000);
  const s = Math.floor(diff % 60000 / 1000);
  document.getElementById('d').textContent = d;
  document.getElementById('h').textContent = String(h).padStart(2, '0');
  document.getElementById('m').textContent = String(m).padStart(2, '0');
  document.getElementById('s').textContent = String(s).padStart(2, '0');
  if (diff === 0) {
    countdownStatus.textContent = '婚礼时间已到，感谢您的祝福！';
  }
  return diff > 0;
}
if (updateCountdown()) {
  const countdownTimer = setInterval(() => {
    if (!updateCountdown()) clearInterval(countdownTimer);
  }, 1000);
}

// 3. 不支持动画 API 或用户要求减少动态效果时，内容仍保持可见。
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('reveal-pending');
    io.observe(section);
  });
}

// 4. 微信等环境无法写入剪贴板时，提示用户手动复制，不阻止地图链接跳转。
document.getElementById('copyAddressBtn').addEventListener('click', async () => {
  const address = document.getElementById('weddingAddress').textContent.trim();
  const status = document.getElementById('navigationStatus');
  try {
    await navigator.clipboard.writeText(address);
    status.textContent = '地址已复制，可粘贴到高德、百度或腾讯地图搜索。';
  } catch {
    status.textContent = '当前浏览器不支持自动复制，请长按上方地址手动复制。';
  }
});

// 5. 缺少照片时显示占位提示，而不是破损图片。
document.querySelectorAll('.gallery img').forEach(img => {
  function showPlaceholder() {
    img.classList.add('hidden');
    img.nextElementSibling.classList.remove('hidden');
  }
  img.addEventListener('error', showPlaceholder);
  if (img.complete && img.naturalWidth === 0) showPlaceholder();
});
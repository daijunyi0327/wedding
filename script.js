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

// 4. 地图坐标配置：经纬度保持命名明确，腾讯/百度 URI 的组合坐标是纬度在前。
const weddingLocation = {
  name: document.getElementById('weddingAddress').textContent.trim(),
  gcj02: { lng: 121.658516, lat: 29.023338 },
  bd09: { lng: 121.664964, lat: 29.029492 }
};
const userAgent = navigator.userAgent;
const isWeChat = /MicroMessenger/i.test(userAgent);
const isIOS = /iPad|iPhone|iPod/i.test(userAgent) ||
  (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);
const isMobile = isIOS || /Android|HarmonyOS/i.test(userAgent);
const tencentMapKey = document.querySelector('meta[name="tencent-map-key"]').content.trim();
const mapSource = 'wedding-invitation';

function mapUrl(base, params) {
  return `${base}?${new URLSearchParams(params).toString()}`;
}

function buildMapLinks() {
  const { name, gcj02, bd09 } = weddingLocation;
  const tencentParams = {
    marker: `coord:${gcj02.lat},${gcj02.lng};title:${name};addr:${name}`,
    referer: tencentMapKey || mapSource
  };
  return {
    amap: {
      name: '高德地图',
      app: mapUrl(`${isIOS ? 'iosamap' : 'androidamap'}://viewMap`, {
        sourceApplication: mapSource, poiname: name,
        lat: gcj02.lat, lon: gcj02.lng, dev: 0
      }),
      web: mapUrl('https://uri.amap.com/marker', {
        position: `${gcj02.lng},${gcj02.lat}`, name,
        coordinate: 'gaode', src: mapSource, callnative: 0
      })
    },
    tencent: {
      name: '腾讯地图',
      // 官方 App URI 要求开发者 Key，不以应用名或示例 Key 冒充。
      app: tencentMapKey ? mapUrl('qqmap://map/marker', tencentParams) : null,
      // Web URI 允许应用名作为 referer；只展示地点，不请求起点或规划路线。
      web: mapUrl('https://apis.map.qq.com/uri/v1/marker', {
        ...tencentParams, coord_type: 2
      })
    },
    baidu: {
      name: '百度地图',
      app: mapUrl('baidumap://map/marker', {
        location: `${bd09.lat},${bd09.lng}`, title: name, content: name,
        coord_type: 'bd09ll', src: mapSource
      }),
      web: mapUrl('https://api.map.baidu.com/marker', {
        location: `${bd09.lat},${bd09.lng}`, title: name, content: name,
        coord_type: 'bd09ll',
        output: 'html', src: mapSource
      })
    }
  };
}

const mapPicker = document.getElementById('mapPicker');
const navigationLink = document.getElementById('navigationLink');
const closeMapPicker = document.getElementById('closeMapPicker');
const mapLaunchStatus = document.getElementById('mapLaunchStatus');
const maps = buildMapLinks();

Object.entries(maps).forEach(([id, map]) => {
  const appLink = document.getElementById(`${id}AppLink`);
  const webLink = document.getElementById(`${id}WebLink`);
  const appAvailable = isMobile && Boolean(map.app);
  const canAttemptApp = appAvailable && !isWeChat;
  const actionLabel = isWeChat && appAvailable ? '如何打开 App' : canAttemptApp ? '打开 App' : '查看地点';
  appLink.href = canAttemptApp ? map.app : map.web;
  appLink.textContent = actionLabel;
  appLink.setAttribute('aria-label', `${map.name}${actionLabel}`);
  webLink.href = map.web;
  webLink.setAttribute('aria-label', `${map.name}网页地图`);
  appLink.addEventListener('click', event => {
    if (isWeChat && appAvailable) {
      event.preventDefault();
      const help = document.getElementById('wechatMapHelp');
      help.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
      help.focus({ preventScroll: true });
      mapLaunchStatus.textContent = `微信内不能保证打开${map.name}。请点右上角“···”→“在浏览器中打开”，再点“一键导航”选择${map.name}；也可使用“网页地图”查看地点。`;
      return;
    }
    // 保持原生链接在用户点击中直接跳转；不轮询安装情况，也不定时自动跳走。
    mapLaunchStatus.textContent = canAttemptApp
      ? `已尝试在${map.name}中展示目的地，不会自动开始导航。若未打开，请确认已安装该 App，或点击对应“网页地图”。`
      : `正在打开${map.name}网页地点。`;
  });
});
if (!tencentMapKey) {
  document.getElementById('tencentMapNote').textContent = '网页地点 · App 入口需配置 Key';
}
if (isWeChat) document.getElementById('wechatMapHelp').classList.remove('hidden');

function hideMapPicker() {
  mapPicker.classList.add('hidden');
  main.removeAttribute('inert');
  main.removeAttribute('aria-hidden');
  document.body.classList.remove('map-picker-open');
  navigationLink.setAttribute('aria-expanded', 'false');
  navigationLink.focus({ preventScroll: true });
}

navigationLink.addEventListener('click', event => {
  event.preventDefault();
  mapLaunchStatus.textContent = '';
  mapPicker.classList.remove('hidden');
  document.body.classList.add('map-picker-open');
  navigationLink.setAttribute('aria-expanded', 'true');
  closeMapPicker.focus({ preventScroll: true });
  main.setAttribute('inert', '');
  main.setAttribute('aria-hidden', 'true');
});
closeMapPicker.addEventListener('click', hideMapPicker);
mapPicker.addEventListener('click', event => {
  if (event.target === mapPicker) hideMapPicker();
});
mapPicker.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    hideMapPicker();
  } else if (event.key === 'Tab') {
    const focusable = [...mapPicker.querySelectorAll('button, a[href]')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

// 5. 地址复制：剪贴板不可用时保留可长按选择的文本。
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

document.getElementById('copyMapLocationBtn').addEventListener('click', async () => {
  const address = document.getElementById('weddingAddress').textContent.trim();
  const { gcj02, bd09 } = weddingLocation;
  const text = `${address}\n高德/腾讯 GCJ-02：${gcj02.lng}, ${gcj02.lat}\n百度 BD-09：${bd09.lng}, ${bd09.lat}\n位置：${maps.amap.web}`;
  try {
    await navigator.clipboard.writeText(text);
    mapLaunchStatus.textContent = '地址、两种坐标和地图链接已复制。';
  } catch {
    mapLaunchStatus.textContent = '无法自动复制，请长按面板中的地址或坐标手动复制。';
  }
});

document.getElementById('copyInvitationLinkBtn').addEventListener('click', async () => {
  const link = window.location.href;
  if (!/^https?:/.test(link)) {
    mapLaunchStatus.textContent = '当前是本地预览，请部署后在微信中使用实际 HTTPS 邀请函链接。';
    return;
  }
  try {
    await navigator.clipboard.writeText(link);
    mapLaunchStatus.textContent = '邀请函链接已复制，可粘贴到 Safari 或手机浏览器打开，再选择地图 App。';
  } catch {
    mapLaunchStatus.textContent = '无法自动复制，请使用微信右上角“···”中的复制链接或在浏览器中打开。';
  }
});

// 6. 缺少照片时显示占位提示，而不是破损图片。
document.querySelectorAll('.gallery img').forEach(img => {
  function showPlaceholder() {
    img.classList.add('hidden');
    img.nextElementSibling.classList.remove('hidden');
  }
  img.addEventListener('error', showPlaceholder);
  if (img.complete && img.naturalWidth === 0) showPlaceholder();
});
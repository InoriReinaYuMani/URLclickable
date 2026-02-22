const imageInput = document.querySelector('#imageInput');
const preview = document.querySelector('#preview');
const status = document.querySelector('#status');
const urlList = document.querySelector('#urlList');
const itemTemplate = document.querySelector('#urlItemTemplate');

const suspiciousTlds = new Set(['zip', 'mov', 'country', 'gq', 'tk']);
const suspiciousWords = ['login', 'verify', 'bank', 'secure', 'update', 'wallet', 'free'];

imageInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    status.textContent = '画像が選択されていません。';
    return;
  }

  const imageUrl = URL.createObjectURL(file);
  preview.src = imageUrl;
  preview.hidden = false;

  status.textContent = 'OCRで画像を解析中です...';
  urlList.replaceChildren();

  try {
    const {
      data: { text },
    } = await Tesseract.recognize(file, 'eng+jpn');

    const urls = extractUrls(text);

    if (urls.length === 0) {
      status.textContent = 'URLを検出できませんでした。画像の解像度を上げると改善する場合があります。';
      return;
    }

    urls.forEach((rawUrl) => {
      const row = createUrlRow(rawUrl);
      urlList.appendChild(row);
    });

    status.textContent = `${urls.length}件のURLを検出しました。必要なら「編集」から修正してください。`;
  } catch (error) {
    console.error(error);
    status.textContent = 'OCRに失敗しました。時間を置いて再度お試しください。';
  }
});

function extractUrls(text) {
  const normalized = text.replace(/\s+/g, ' ');
  const matches = normalized.match(/(?:https?:\/\/|www\.)[^\s<>"']+/gi) ?? [];

  return [...new Set(matches.map((value) => sanitizeUrl(value)).filter(Boolean))];
}

function sanitizeUrl(value) {
  return value.replace(/[),.;!?]+$/g, '');
}

function normalizeUrl(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function createUrlRow(rawUrl) {
  const node = itemTemplate.content.firstElementChild.cloneNode(true);
  const link = node.querySelector('.url-link');
  const input = node.querySelector('.url-input');
  const editBtn = node.querySelector('.edit-btn');
  const saveBtn = node.querySelector('.save-btn');
  const safety = node.querySelector('.safety');

  let currentUrl = normalizeUrl(rawUrl);

  const updateView = () => {
    link.textContent = currentUrl;
    link.href = currentUrl;
    input.value = currentUrl;

    const assessment = assessSafety(currentUrl);
    safety.textContent = `安全性: ${assessment.label}（${assessment.reasons.join(' / ')}）`;
    safety.className = `safety ${assessment.level}`;
  };

  editBtn.addEventListener('click', () => {
    link.hidden = true;
    input.hidden = false;
    editBtn.hidden = true;
    saveBtn.hidden = false;
    input.focus();
  });

  saveBtn.addEventListener('click', () => {
    currentUrl = normalizeUrl(input.value.trim());
    link.hidden = false;
    input.hidden = true;
    editBtn.hidden = false;
    saveBtn.hidden = true;
    updateView();
  });

  updateView();
  return node;
}

function assessSafety(urlString) {
  const reasons = [];
  let score = 0;

  try {
    const url = new URL(urlString);
    const host = url.hostname;
    const parts = host.split('.');
    const tld = parts[parts.length - 1]?.toLowerCase();

    if (url.protocol === 'https:') {
      score += 2;
      reasons.push('HTTPS通信');
    } else {
      score -= 2;
      reasons.push('HTTP通信（暗号化なし）');
    }

    if (host.includes('xn--')) {
      score -= 2;
      reasons.push('Punycodeドメイン');
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      score -= 2;
      reasons.push('IPアドレスURL');
    }

    if (suspiciousTlds.has(tld)) {
      score -= 1;
      reasons.push(`注意TLD(.${tld})`);
    }

    const lowered = `${host}${url.pathname}`.toLowerCase();
    if (suspiciousWords.some((word) => lowered.includes(word))) {
      score -= 1;
      reasons.push('フィッシングで使われやすい語句を含む');
    }

    if (reasons.length === 1 && reasons[0] === 'HTTPS通信') {
      reasons.push('目立つ危険シグナルなし');
    }
  } catch {
    return {
      label: '要確認',
      level: 'risky',
      reasons: ['URL形式が不正です'],
    };
  }

  if (score >= 2) {
    return { label: '比較的安全', level: 'safe', reasons };
  }
  if (score >= 0) {
    return { label: '注意', level: 'caution', reasons };
  }
  return { label: '危険の可能性あり', level: 'risky', reasons };
}

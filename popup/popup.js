/**
 * Amazon プライバシーガード - Popup Script v1.4
 */

document.addEventListener('DOMContentLoaded', () => {
  const cbEnabled = document.getElementById('cb-enabled');
  const cbHoverReveal = document.getElementById('cb-hover-reveal');
  const cbBlurEmail = document.getElementById('cb-blur-email');
  const cbBlurPhone = document.getElementById('cb-blur-phone');
  const cbBlurPayment = document.getElementById('cb-blur-payment');
  const cbWhiteHouse = document.getElementById('cb-white-house');
  const blurSlider = document.getElementById('blur-slider');
  const blurValue = document.getElementById('blur-value');
  const statusText = document.getElementById('status-text');

  // 設定を読み込み
  chrome.storage.sync.get(
    {
      enabled: true,
      blurLevel: 5,
      hoverReveal: true,
      blurEmail: true,
      blurPhone: true,
      blurPayment: true,
      whiteHouseMode: false,
    },
    (settings) => {
      cbEnabled.checked = settings.enabled;
      cbHoverReveal.checked = settings.hoverReveal;
      cbBlurEmail.checked = settings.blurEmail;
      cbBlurPhone.checked = settings.blurPhone;
      cbBlurPayment.checked = settings.blurPayment;
      cbWhiteHouse.checked = settings.whiteHouseMode;
      blurSlider.value = settings.blurLevel;
      blurValue.textContent = `${settings.blurLevel}px`;
      updateStatusText(settings.enabled, settings.whiteHouseMode);
    }
  );

  // ON/OFF トグル
  cbEnabled.addEventListener('change', () => {
    const enabled = cbEnabled.checked;
    chrome.storage.sync.set({ enabled });
    updateStatusText(enabled, cbWhiteHouse.checked);
  });

  // ホバー解除トグル
  cbHoverReveal.addEventListener('change', () => {
    chrome.storage.sync.set({ hoverReveal: cbHoverReveal.checked });
  });

  // メールアドレスぼかしトグル
  cbBlurEmail.addEventListener('change', () => {
    chrome.storage.sync.set({ blurEmail: cbBlurEmail.checked });
  });

  // 電話番号ぼかしトグル
  cbBlurPhone.addEventListener('change', () => {
    chrome.storage.sync.set({ blurPhone: cbBlurPhone.checked });
  });

  // カード情報ぼかしトグル
  cbBlurPayment.addEventListener('change', () => {
    chrome.storage.sync.set({ blurPayment: cbBlurPayment.checked });
  });

  // ぼかし強度スライダー
  blurSlider.addEventListener('input', () => {
    const level = parseInt(blurSlider.value, 10);
    blurValue.textContent = `${level}px`;
    chrome.storage.sync.set({ blurLevel: level });
  });

  // ホワイトハウスモードトグル
  cbWhiteHouse.addEventListener('change', () => {
    const whMode = cbWhiteHouse.checked;
    chrome.storage.sync.set({ whiteHouseMode: whMode });
    updateStatusText(cbEnabled.checked, whMode);
  });

  /**
   * ステータスのテキストを更新
   */
  function updateStatusText(enabled, whMode) {
    if (whMode) {
      statusText.textContent = '🏠 ホワイトハウスモード';
      statusText.classList.remove('disabled');
      statusText.classList.add('neta-active');
    } else if (enabled) {
      statusText.textContent = '🛡️ 保護中';
      statusText.classList.remove('disabled', 'neta-active');
    } else {
      statusText.textContent = '⚠️ 無効';
      statusText.classList.add('disabled');
      statusText.classList.remove('neta-active');
    }
  }
});

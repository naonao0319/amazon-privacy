/**
 * Amazon プライバシーガード - Content Script v1.2
 * 住所・名前・メールアドレス・電話番号・カード情報などの個人情報にモザイク（ぼかし）をかける
 * 
 * アプローチ:
 * 1. IDベースのセレクターで既知の要素をぼかす
 * 2. テキストマッチで「お届け先」を含む要素を動的に検出してぼかす
 * 3. 正規表現パターンでメール・電話番号・カード番号を検出
 * 4. MutationObserverで動的に追加される要素にも対応
 */

(function () {
  'use strict';

  // ========================================
  // モザイク対象のセレクター一覧（IDベース）
  // ========================================
  const BLUR_SELECTORS = [
    // ヘッダー: お届け先
    '#glow-ingress-line1',
    '#glow-ingress-line2',
    '#glow-ingress-block',
    '#nav-global-location-popover-link span',
    // ヘッダー: ユーザー名
    '#nav-link-accountList-nav-line-1',
    // サイドメニュー（すべて）: ユーザー名
    '#hmenu-customer-profile',
    '#hmenu-customer-profile-link',
    '#hmenu-customer-profile-right',
    '#hmenu-customer-name',
    // 商品ページ: 右パネルのお届け先
    '#contextualIngressPt',
    '#contextualIngressPtLabel',
    '#contextualIngressPtLabel_deliveryShortLine',
    '#contextualIngressPtLink',
    // お届け先ポップアップ
    '#GLUXAddressList',
    '.GLUX_AddressBlock',
    '#GLUXZipUpdateInput_0',
    '#GLUXZipUpdateInput_1',
    // 住所入力フォーム
    '#address-ui-widgets-AddressLine1',
    '#address-ui-widgets-AddressLine2',
    '#address-ui-widgets-enterAddressCity',
    '#address-ui-widgets-enterAddressStateOrRegion',
    '#address-ui-widgets-enterAddressPostalCode',
    '#address-ui-widgets-enterAddressPhoneNumber',
    '#address-ui-widgets-enterAddressFullName',
    // アカウント設定 / アドレス帳
    '#ya-myab-display-address-block',
    '#ya-myab-address-display-container',
    '#address-ui-widgets-FullAddressDisplay',
    '.ya-card .a-box',
    '[data-action="ya-addr-display"]',
    '.address-column-container',
    '.ya-myab-address-column',
    '#ya-myab-address-list',
    // チェックアウト / カート
    '.ship-to-this-address',
    '.address-book-entry',
    '.checkout-address',
    '#address-book-entry-0',
    '.ship-to-this-address-item',
    '#shipping-address-display',
    '.checkout-addr-display',
    '#addressBookEntry',
    '.address-display-container',
  ];

  // メールアドレス関連のセレクター
  const EMAIL_SELECTORS = [
    '#ya-myab-display-email',
    '.ya-card [data-action="ya-email-display"]',
    '#auth-email-display',
    '.cvf-account-switcher-email',
    '#ap_email',
    '.a-spacing-small .a-size-base[data-email]',
  ];

  // 電話番号関連のセレクター
  const PHONE_SELECTORS = [
    '#address-ui-widgets-enterAddressPhoneNumber',
    '.phone-number-display',
    '#ya-myab-display-phone',
  ];

  // 支払い方法関連のセレクター
  const PAYMENT_SELECTORS = [
    '.pmts-account-number',
    '.pmts-instrument-description',
    '.payment-method-display',
    '.a-fixed-left-grid-col img[src*="card"]',
    '.pmts-instrument-box',
    '#payment-information .a-section',
    '.a-expander-content .pmts-instrument-description',
  ];

  const BLUR_CLASS = 'privacy-guard-blur';

  // デフォルト設定
  let isEnabled = true;
  let blurLevel = 5;
  let blurEmail = true;
  let blurPhone = true;
  let blurPayment = true;

  // テキスト検出パターン
  const PATTERNS = {
    email: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
    phone: /(?:0\d{1,4}[\-\s]?\d{1,4}[\-\s]?\d{3,4})|(?:\+81[\-\s]?\d{1,4}[\-\s]?\d{1,4}[\-\s]?\d{3,4})|(?:0[789]0[\-\s]?\d{4}[\-\s]?\d{4})/,
    postalCode: /\d{3}-?\d{4}/,
    creditCard: /(?:\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4})|(?:\*{4,}[\s\-]?\d{4})|(?:末尾\d{4})/,
    address: /[都道府県市区町村郡]/,
  };

  // ========================================
  // 設定管理
  // ========================================
  function loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(
        {
          enabled: true,
          blurLevel: 5,
          hoverReveal: true,
          blurEmail: true,
          blurPhone: true,
          blurPayment: true,
        },
        (settings) => {
          isEnabled = settings.enabled;
          blurLevel = settings.blurLevel;
          blurEmail = settings.blurEmail;
          blurPhone = settings.blurPhone;
          blurPayment = settings.blurPayment;
          applyAll();
        }
      );
    }
  }

  function listenForChanges() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync') {
          if (changes.enabled !== undefined) isEnabled = changes.enabled.newValue;
          if (changes.blurLevel !== undefined) blurLevel = changes.blurLevel.newValue;
          if (changes.blurEmail !== undefined) blurEmail = changes.blurEmail.newValue;
          if (changes.blurPhone !== undefined) blurPhone = changes.blurPhone.newValue;
          if (changes.blurPayment !== undefined) blurPayment = changes.blurPayment.newValue;
          applyAll();
        }
      });
    }
  }

  // ========================================
  // ぼかし適用
  // ========================================

  /**
   * 要素にぼかしを適用する（CSSクラスのみ）
   */
  function blurElement(el) {
    if (!el || el.classList.contains(BLUR_CLASS)) return;
    el.classList.add(BLUR_CLASS);
  }

  /**
   * 要素のぼかしを解除する
   */
  function unblurElement(el) {
    if (!el) return;
    el.classList.remove(BLUR_CLASS);
  }

  /**
   * IDベースのセレクターで既知要素をぼかす
   */
  function blurKnownElements() {
    BLUR_SELECTORS.forEach((selector) => {
      try {
        document.querySelectorAll(selector).forEach((el) => blurElement(el));
      } catch (e) { /* ignore */ }
    });

    // メールアドレス
    if (blurEmail) {
      EMAIL_SELECTORS.forEach((selector) => {
        try {
          document.querySelectorAll(selector).forEach((el) => blurElement(el));
        } catch (e) { /* ignore */ }
      });
    }

    // 電話番号
    if (blurPhone) {
      PHONE_SELECTORS.forEach((selector) => {
        try {
          document.querySelectorAll(selector).forEach((el) => blurElement(el));
        } catch (e) { /* ignore */ }
      });
    }

    // 支払い方法
    if (blurPayment) {
      PAYMENT_SELECTORS.forEach((selector) => {
        try {
          document.querySelectorAll(selector).forEach((el) => blurElement(el));
        } catch (e) { /* ignore */ }
      });
    }
  }

  /**
   * テキストベースで個人情報を含む要素を検出してぼかす
   */
  function blurAddressTextElements() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      const text = textNode.textContent.trim();
      if (!text || text.length > 500) continue;

      const parentEl = textNode.parentElement;
      if (!parentEl) continue;

      // スクリプトやスタイル要素はスキップ
      const tagName = parentEl.tagName.toUpperCase();
      if (tagName === 'SCRIPT' || tagName === 'STYLE' || tagName === 'NOSCRIPT') continue;

      // 「お届け先」ラベルのすぐ隣にある住所値をぼかす
      if (text === 'お届け先') {
        let addressEl = parentEl.nextElementSibling;
        if (addressEl) blurElement(addressEl);

        if (parentEl.parentElement) {
          addressEl = parentEl.parentElement.nextElementSibling;
          if (addressEl) blurElement(addressEl);
        }

        const parentRow = parentEl.closest('.a-row, .a-fixed-right-grid-col, tr, .yohtmlc-order-level-connections');
        if (parentRow) {
          parentRow.querySelectorAll('span, a, div').forEach((child) => {
            const childText = child.textContent.trim();
            if (childText !== 'お届け先' && childText.length > 0 && childText.length < 200) {
              if (
                PATTERNS.postalCode.test(childText) ||
                PATTERNS.address.test(childText) ||
                child !== parentEl
              ) {
                blurElement(child);
              }
            }
          });
        }
      }

      // 「お届け先:」のパターン
      if (/お届け先[：:]?\s*.+/.test(text) && text.length < 100) {
        blurElement(parentEl);
      }

      // メールアドレスの検出
      if (blurEmail && PATTERNS.email.test(text) && text.length < 200) {
        blurElement(parentEl);
      }

      // 電話番号の検出
      if (blurPhone && PATTERNS.phone.test(text) && text.length < 50) {
        // 電話番号のみのテキストか、短い要素の場合のみ
        if (/^\+?[\d\-\s()]+$/.test(text.replace(/電話|TEL|tel|Phone/gi, '').trim())) {
          blurElement(parentEl);
        }
      }

      // クレジットカード番号の検出
      if (blurPayment && PATTERNS.creditCard.test(text) && text.length < 100) {
        blurElement(parentEl);
      }
    }

    // 注文履歴の住所表示要素
    const orderAddressSelectors = [
      '.displayAddressDiv',
      '.displayAddressUL',
      '.shipping-address',
      '.recipient',
      '.ship-to-name',
      '.ship-to-address',
      '.od-shipping-address-container',
      '[data-component="shipToAddress"]',
      '.order-address',
    ];

    orderAddressSelectors.forEach((selector) => {
      try {
        document.querySelectorAll(selector).forEach((el) => blurElement(el));
      } catch (e) { /* ignore */ }
    });

    // ポップオーバー内の住所
    document.querySelectorAll('.a-popover-content').forEach((popover) => {
      popover.querySelectorAll(
        '.displayAddressDiv, .displayAddressUL, .recipient, .ship-to-address, .od-shipping-address-container, li, .a-row'
      ).forEach((el) => {
        if (
          PATTERNS.postalCode.test(el.textContent) ||
          PATTERNS.address.test(el.textContent)
        ) {
          blurElement(el);
        }
      });
    });

    // アドレス帳ページの住所カード
    blurAddressBookPage();
  }

  /**
   * アドレス帳ページ専用のぼかし処理
   * /a/addresses や /gp/css/account/address/ ページの住所カードを網羅
   */
  function blurAddressBookPage() {
    const path = window.location.pathname;
    const isAddressPage = 
      path.includes('/a/addresses') ||
      path.includes('/address/') ||
      path.includes('/gp/css/account/address') ||
      path.includes('/gp/your-account/address');

    // アドレス帳ページの場合、住所カード内の全情報をぼかす
    if (isAddressPage) {
      // 住所カードのボックスを全てぼかす
      document.querySelectorAll('.a-box').forEach((box) => {
        const text = box.textContent;
        if (
          PATTERNS.postalCode.test(text) ||
          PATTERNS.address.test(text) ||
          PATTERNS.phone.test(text)
        ) {
          blurElement(box);
        }
      });

      // ya-myab 系の要素
      document.querySelectorAll('[id^="ya-myab"]').forEach((el) => {
        blurElement(el);
      });

      // address-ui-widgets 系
      document.querySelectorAll('[id^="address-ui-widgets"]').forEach((el) => {
        blurElement(el);
      });
    }

    // ページ問わず、住所が含まれるul > liリストをぼかす
    document.querySelectorAll('ul').forEach((ul) => {
      const text = ul.textContent;
      // 住所パターン（郵便番号 + 都道府県等）を含むか確認
      if (PATTERNS.postalCode.test(text) && PATTERNS.address.test(text) && text.length < 500) {
        // 親がスクリプトやナビでないことを確認
        const parent = ul.closest('.a-box, .a-section, .ya-card, .address-column, [data-action]');
        if (parent) {
          blurElement(ul);
        }
      }
    });
  }

  /**
   * 全てのぼかし処理をまとめて実行
   */
  function applyAll() {
    updateDynamicStyle();

    if (isEnabled) {
      document.body.classList.remove('privacy-guard-disabled');
      blurKnownElements();
      blurAddressTextElements();
    } else {
      document.body.classList.add('privacy-guard-disabled');
    }
  }

  /**
   * 動的スタイルシートを更新
   */
  function updateDynamicStyle() {
    let dynamicStyle = document.getElementById('privacy-guard-dynamic-style');
    if (!dynamicStyle) {
      dynamicStyle = document.createElement('style');
      dynamicStyle.id = 'privacy-guard-dynamic-style';
      document.head.appendChild(dynamicStyle);
    }

    const idSelectors = BLUR_SELECTORS.join(',\n        ');
    const idHoverSelectors = BLUR_SELECTORS.map(s => s + ':hover').join(',\n        ');

    if (isEnabled) {
      dynamicStyle.textContent = `
        .${BLUR_CLASS},
        ${idSelectors} {
          filter: blur(${blurLevel}px) !important;
          transition: filter 0.3s ease !important;
          cursor: pointer !important;
        }
        .${BLUR_CLASS}:hover,
        ${idHoverSelectors} {
          filter: blur(0) !important;
        }
      `;
    } else {
      dynamicStyle.textContent = `
        .${BLUR_CLASS},
        ${idSelectors} {
          filter: none !important;
        }
      `;
    }
  }

  // ========================================
  // DOM監視（動的要素対応）
  // ========================================
  function observeDOM() {
    let debounceTimer = null;
    const observer = new MutationObserver((mutations) => {
      if (!isEnabled) return;
      let shouldCheck = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldCheck = true;
          break;
        }
      }
      if (shouldCheck) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          blurKnownElements();
          blurAddressTextElements();
        }, 150);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  // ========================================
  // 初期化
  // ========================================
  function init() {
    loadSettings();
    listenForChanges();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        applyAll();
        observeDOM();
      });
    } else {
      applyAll();
      observeDOM();
    }

    // ページ内遷移対応
    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(() => applyAll(), 500);
      }
    }, 1000);
  }

  init();
})();

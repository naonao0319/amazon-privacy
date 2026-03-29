# Amazon プライバシーガード 🛡️

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://github.com/naonao0319/amazon-privacy)

Amazonサイト上の個人情報（住所・名前・メールアドレス・電話番号・カード情報）に自動でモザイク（ぼかし）をかけるChrome拡張機能です。

## 機能

- 📍 **住所・名前のぼかし** — ヘッダー、商品ページ、注文履歴、アドレス帳、チェックアウト
- 📧 **メールアドレスのぼかし** — アカウント設定、ログイン画面（ON/OFF可）
- 📞 **電話番号のぼかし** — アカウント設定、住所登録（ON/OFF可）
- 💳 **カード情報のぼかし** — 支払い方法、注文確認（ON/OFF可）
- 🎛️ **ぼかし強度調整** — 1px～15pxのスライダーでリアルタイム調整
- 👆 **ホバーで一時解除** — マウスを乗せると一時的にぼかしを解除

## インストール方法

### 方法1: GitHubからダウンロード（推奨）

1. [リポジトリページ](https://github.com/naonao0319/amazon-privacy) にアクセス
2. 緑色の「**Code**」ボタン → 「**Download ZIP**」をクリック
3. ZIPファイルを任意のフォルダに展開
4. Chromeで `chrome://extensions/` を開く
5. 右上の「**デベロッパーモード**」をONにする
6. 「**パッケージ化されていない拡張機能を読み込む**」をクリック
7. 展開したフォルダを選択

### 方法2: git cloneから

```bash
git clone https://github.com/naonao0319/amazon-privacy.git
```

1. Chromeで `chrome://extensions/` を開く
2. 右上の「**デベロッパーモード**」をONにする
3. 「**パッケージ化されていない拡張機能を読み込む**」をクリック
4. クローンしたフォルダを選択

## 使い方

1. インストール後、Amazonのページを開くと自動的にモザイクが適用されます
2. ツールバーの🛡️アイコンをクリックすると設定パネルが開きます
3. モザイクを一時的に解除したい場合は、対象要素にマウスを乗せてください

## 設定項目

| 設定 | 説明 |
|------|------|
| モザイク保護 | 拡張機能全体のON/OFF |
| ぼかし強度 | ぼかしの強さ（1px～15px） |
| メールアドレス | メールアドレスのぼかしON/OFF |
| 電話番号 | 電話番号のぼかしON/OFF |
| カード情報 | クレジットカード情報のぼかしON/OFF |
| ホバーで一時解除 | マウスホバーでぼかし一時解除ON/OFF |

## 対応サイト

- 🇯🇵 Amazon.co.jp
- 🇺🇸 Amazon.com
- 🇬🇧 Amazon.co.uk
- 🇩🇪 Amazon.de
- 🇫🇷 Amazon.fr
- 🇮🇹 Amazon.it
- 🇪🇸 Amazon.es
- 🇨🇦 Amazon.ca
- 🇦🇺 Amazon.com.au
- 🇮🇳 Amazon.in
- 🇧🇷 Amazon.com.br
- 🇸🇬 Amazon.sg

## プライバシーについて

この拡張機能は：
- ✅ データを外部に送信しません
- ✅ 個人情報を収集しません
- ✅ 設定はブラウザのローカルストレージにのみ保存されます
- ✅ Amazonのページ上でのみ動作します

## ライセンス

[MIT License](LICENSE)

## バージョン

- **v1.2.0** — メール・電話番号・カード情報の保護、ぼかし強度リアルタイム調整、アドレス帳対応

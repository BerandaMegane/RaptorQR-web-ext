# RaptorQR Web Extension

[English](#english) | [日本語](#japanese)

---

<a id="english"></a>

## English

RaptorQR Web Extension packages the [RaptorQR](https://github.com/infrost/RaptorQR)
web application as an offline-capable browser extension. It opens the RaptorQR
interface in an extension tab for QR-based text and file transfer.

This repository is an independent packaging project and is not affiliated with
or endorsed by the RaptorQR project or its contributors.

### Supported browsers

- Google Chrome and Microsoft Edge: load `dist/chromium` as an unpacked
	extension during development. A CRX may be produced for controlled
	environments where the browser policy allows it.
- Mozilla Firefox: use `dist/firefox` as a temporary add-on during development.
	Regular Firefox installations require an AMO-signed XPI for permanent use.

### Build

```powershell
git submodule update --init --recursive
pnpm install --frozen-lockfile
pnpm build
```

The build applies the managed extension-build patch to the RaptorQR submodule,
builds its web application without its PWA service worker, generates extension
icons, creates `dist/chromium` and `dist/firefox`, and verifies the outputs.
Both output directories contain the extension license and third-party notices.

See [docs/packaging.md](docs/packaging.md) for browser loading, XPI packaging,
signing, and release instructions.

### Privacy and permissions

The extension does not request host or content-script permissions. It packages
its runtime assets locally and is designed to work without network access after
installation. Camera reception requires the browser's normal camera permission.

Do not encode private or sensitive data unless the receiving environment is
trusted. QR payloads are visible to anyone who can observe the displayed codes.

### License and notices

The extension wrapper, build scripts, documentation, and original assets are
licensed under the [MIT License](LICENSE). RaptorQR and bundled dependencies
remain under their own terms. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
and the `LICENSES/` directory included in each extension package.

### Security

See [SECURITY.md](SECURITY.md) for responsible vulnerability reporting.

---

<a id="japanese"></a>

## 日本語

RaptorQR Web Extension は、[RaptorQR](https://github.com/infrost/RaptorQR) をオフライン対応のブラウザ拡張機能としてパッケージ化したものです。拡張機能タブ内で RaptorQR インターフェースを開き、QR コードを使ったテキストやファイルの転送を行えます。

本リポジトリは独立したパッケージングプロジェクトであり、RaptorQR プロジェクトまたはその貢献者と提携・推奨関係にあるものではありません。

### 対応ブラウザ

- Google Chrome および Microsoft Edge: 開発時は `dist/chromium` をパッケージ化されていない拡張機能（unpacked extension）として読み込みます。ブラウザポリシーで許可されている制御環境向けに CRX を作成することも可能です。
- Mozilla Firefox: 開発時は `dist/firefox` を一時的なアドオン（temporary add-on）として使用します。通常版 Firefox で恒久的に使用するには、AMO 署名済み XPI が必要です。

### ビルド

```powershell
git submodule update --init --recursive
pnpm install --frozen-lockfile
pnpm build
```

ビルドプロセスでは、RaptorQR submodule に管理された拡張機能ビルド用パッチを適用し、PWA サービスワーカーを除外した状態で Web アプリケーションをビルドします。さらに拡張機能用アイコンを生成し、`dist/chromium` と `dist/firefox` を作成して出力を検証します。両方の出力ディレクトリには、拡張機能のライセンスとサードパーティ告知が含まれます。

ブラウザへの読み込み、XPI パッケージング、署名、リリース手順については [docs/packaging.md](docs/packaging.md) を参照してください。

### プライバシーと権限

本拡張機能はホスト権限やコンテンツスクリプト権限を要求しません。実行時アセットをローカルにパッケージ化しており、インストール後はネットワーク接続なしで動作するよう設計されています。カメラによる受信には、ブラウザの通常のカメラ権限が必要です。

受信環境が信頼できない限り、非公開データや機密データをエンコードしないでください。QR ペイロードは表示されたコードを視認できる誰にでも読み取られます。

### ライセンスと告知

拡張機能ラッパー、ビルドスクリプト、ドキュメント、独自アセットは [MIT License](LICENSE) の下でライセンスされています。RaptorQR および同梱される依存関係はそれぞれのライセンス条件に従います。[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) および各拡張機能パッケージに含まれる `LICENSES/` ディレクトリを参照してください。

### セキュリティ

脆弱性の責任ある報告については [SECURITY.md](SECURITY.md) を参照してください。

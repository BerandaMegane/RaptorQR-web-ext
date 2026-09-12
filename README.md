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

This extension was developed using generative AI. The implementation plan is
documented in [docs/plan.md](docs/plan.md).

### Supported browsers

- Google Chrome and Microsoft Edge: load [dist/chromium](dist/chromium) as an unpacked
	extension during development. A CRX may be produced for controlled
	environments where the browser policy allows it.
- Mozilla Firefox: use [dist/firefox](dist/firefox) as a temporary add-on during development.
	Regular Firefox installations require an AMO-signed XPI for permanent use.

### Installation (GitHub Releases)

Download the release ZIP asset for your target browser from GitHub Releases.

#### Google Chrome / Microsoft Edge / Brave (Chromium-based)

1. Download the Chromium ZIP archive and extract it to a permanent local directory (do not delete or move this folder after installation, as the browser loads directly from it).
2. Open the extensions page in your browser:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Turn on **Developer mode** using the toggle switch (upper-right corner on Chrome/Brave, or left sidebar on Edge).
4. Click **Load unpacked** and select the extracted directory containing [dist/chromium/manifest.json](dist/chromium/manifest.json).
5. The RaptorQR icon will appear in the toolbar (pin it from the extensions menu if needed). Click the icon to launch RaptorQR in a new tab.

#### Mozilla Firefox

> **Note**: Due to Firefox's extension signing policy, unsigned add-ons loaded into standard Firefox releases are treated as temporary add-ons and will be unloaded when the browser restarts. For permanent installation without AMO signing, use Firefox Developer Edition, Nightly, or Firefox ESR with signature enforcement disabled.

- **Temporary Installation (Standard Firefox)**:
  1. Navigate to `about:debugging#/runtime/this-firefox` in the address bar.
  2. Click **Load Temporary Add-on...**.
  3. Select the downloaded Firefox ZIP archive (or extract it and select [dist/firefox/manifest.json](dist/firefox/manifest.json)).
  4. Click the RaptorQR icon in the toolbar to launch.
- **Permanent Installation (Firefox Developer Edition / Nightly / ESR)**:
  1. Open `about:config` and set `xpinstall.signatures.required` to `false`.
  2. Open `about:addons` (Add-ons Manager).
  3. Click the gear icon at the top of the page and select **Install Add-on From File...**.
  4. Select the downloaded Firefox ZIP archive (or change its file extension to `.xpi`).

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

---

<a id="japanese"></a>

## 日本語

RaptorQR Web Extension は、[RaptorQR](https://github.com/infrost/RaptorQR) をオフライン対応のブラウザ拡張機能としてパッケージ化したものです。拡張機能タブ内で RaptorQR インターフェースを開き、QR コードを使ったテキストやファイルの転送を行えます。

本リポジトリは独立したパッケージングプロジェクトであり、RaptorQR プロジェクトまたはその貢献者と提携・推奨関係にあるものではありません。

本拡張機能は生成AIを活用して開発されました。実装計画は [docs/plan.md](docs/plan.md) に記載されています。

### 対応ブラウザ

- Google Chrome および Microsoft Edge: 開発時は [dist/chromium](dist/chromium) をパッケージ化されていない拡張機能（unpacked extension）として読み込みます。ブラウザポリシーで許可されている制御環境向けに CRX を作成することも可能です。
- Mozilla Firefox: 開発時は [dist/firefox](dist/firefox) を一時的なアドオン（temporary add-on）として使用します。通常版 Firefox で恒久的に使用するには、AMO 署名済み XPI が必要です。

### インストール方法（GitHub Releases からの導入）

[GitHub Releases](https://github.com/BerandaMegane/RaptorQR-web-ext/releases) から、利用するブラウザに応じた ZIP ファイルをダウンロードします。

#### Google Chrome / Microsoft Edge / Brave（Chromium 系ブラウザ）

1. Chromium 向けの ZIP アーカイブをダウンロードし、任意のローカルフォルダーに解凍します（ブラウザがこのフォルダーから直接読み込むため、インストール後もフォルダーを移動・削除しないでください）。
2. 各ブラウザの拡張機能管理画面を開きます。
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. 画面内の **「デベロッパー モード」**（Developer mode）をオンにします（Chrome / Brave は右上、Edge は左側メニュー）。
4. **「パッケージ化されていない拡張機能を読み込む」**（Load unpacked）をクリックし、解凍したフォルダー（[dist/chromium/manifest.json](dist/chromium/manifest.json) が含まれるフォルダー）を選択します。
5. ツールバーに RaptorQR アイコンが表示されます（必要に応じて拡張機能メニューからピン留めしてください）。アイコンをクリックすると新しいタブで RaptorQR が起動します。

#### Mozilla Firefox

> **注意**: 通常版 Firefox では拡張機能の署名が必須化されているため、未署名パッケージは「一時的なアドオン」として読み込まれ、ブラウザ再起動時にアンロードされます。未署名のまま恒久的にインストールしたい場合は、Firefox Developer Edition、Nightly、または ESR 版を使用し、署名検証を無効化してください。

- **一時的なアドオンとして読み込む場合（通常版 Firefox）**:
  1. アドレスバーに `about:debugging#/runtime/this-firefox` を入力して開きます。
  2. **「一時的なアドオンを読み込む...」** をクリックします。
  3. ダウンロードした Firefox 向けの ZIP アーカイブ（または解凍したフォルダー内の [dist/firefox/manifest.json](dist/firefox/manifest.json)）を選択します。
  4. ツールバーに追加された RaptorQR アイコンをクリックして起動します。
- **恒久的にインストールする場合（Firefox Developer Edition / Nightly / ESR）**:
  1. `about:config` を開き、`xpinstall.signatures.required` を `false` に変更します。
  2. `about:addons`（アドオンマネージャー）を開きます。
  3. 歯車アイコンをクリックし、**「ファイルからアドオンをインストール...」** を選択します。
  4. ダウンロードした Firefox 向けの ZIP アーカイブ（または拡張子を `.xpi` に変更したもの）を選択してインストールします。

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

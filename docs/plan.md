# プラン

## 1 拡張機能化計画

オフライン環境からデータを持ち出すため、RaptorQR をブラウザ拡張機能で動かしたい。

- 対応させたいブラウザ
  - Google Chrome
    - `.crx` ファイルをインポート
  - Microsoft Edge
    - `.crx` ファイルをインポート
  - Mozilla Firefox
    - `.xpi` ファイルをインポート

拡張機能から開けるタブで、通常のウェブサイトと同様に動作させつつ、Live demo で動作しているサイトと同等機能をブラウザ拡張機能でも実現したい。  

RaptorQR リポジトリ: https://github.com/infrost/RaptorQR
RaptorQR Live demo: https://qr.linkto.host/

RaptorQR リポジトリをビルドし、生成されたファイルをブラウザ拡張機能に組み込むイメージで作りたい。
ソースコードはなるべくそのまま・分離させて利用したい。

## 2 拡張機能化 設計

### 2.1 全体構成

RaptorQR 本体はこのリポジトリへコピーせず、`git submodule` で外部リポジトリとして取り込む。
RaptorQR のソースコード、UI、RaptorQ の処理、QR の描画・読み取り、WASM 資産は、upstream リポジトリの構成を維持したまま利用する。
submodule は検証済みのコミットへ固定し、upstream 更新時だけ意図的に更新する。

```text
RaptorQR-web-ext/
├── docs/
│   ├── plan.md
│   └── packaging.md
├── extension/
│   ├── manifest.base.json
│   └── background.js
├── assets/
│   └── icons/                     # Manifest 用に生成する PNG アイコン
├── scripts/
│   ├── build-extension.mjs
│   ├── build-manifest.mjs
│   └── package-xpi.mjs
├── vendor/
│   └── RaptorQR/                 # infrost/RaptorQR の git submodule
├── package.json
├── pnpm-workspace.yaml
└── .gitmodules
```

RaptorQR の Web アプリは `vendor/RaptorQR` の workspace ルートでビルドする。生成された `apps/web/dist` を拡張機能の `app` ディレクトリへ配置し、拡張機能独自の処理は起動処理、PWA 無効化、アイコン生成、パッケージングに限定する。

### 2.2 起動方式

拡張機能のアイコンを押すと、`background.js` が拡張機能内の RaptorQR ページを新しいタブで開く。
ポップアップ UI や通常の Web ページへのコンテンツスクリプト注入は使用しない。

```text
ユーザーが拡張機能アイコンを押す
  ↓
background.js
  ↓ runtime.getURL("app/index.html")
新しいタブで RaptorQR を起動
  ↓
RaptorQR の既存 UI が WASM と worker を読み込む
```

新しいタブを使用することで、Live demo と同様の画面領域を確保し、ファイル選択、QR の表示、カメラ映像の表示を行えるようにする。

### 2.3 RaptorQR のビルド

RaptorQR は Preact と Vite を使用しているため、拡張機能側で UI を再実装しない。upstream の workspace を pnpm でインストールし、`@raptorqr/web` のビルド成果物を利用する。

```text
git submodule update --init --recursive
cd vendor/RaptorQR
pnpm install --frozen-lockfile
pnpm build
```

`pnpm build` は `@raptorqr/web` より先に Fast QR WASM、RaptorQ WASM、core を検証するため、Web アプリ単独のビルドは使用しない。upstream の Vite 設定にある `base: "./"` を利用し、拡張機能 URL（`chrome-extension://` または `moz-extension://`）からも JavaScript、CSS、WASM、worker を相対パスで読み込めるようにする。

### 2.4 拡張機能のファイル配置

ビルド時に、upstream の `vendor/RaptorQR/apps/web/dist` を次の場所へコピーする。

```text
dist/
├── chromium/
│   ├── manifest.json
│   ├── background.js
│   ├── icons/
│   └── app/
│       ├── index.html
│       ├── assets/
│       └── *.wasm
└── firefox/
    ├── manifest.json
    ├── background.js
    ├── icons/
    └── app/
        ├── index.html
        ├── assets/
        └── *.wasm
```

RaptorQR のビルド成果物は `scripts/build-extension.mjs` で拡張機能用ディレクトリへ組み立てる。Manifest で参照する PNG アイコンもこの処理で生成・コピーする。生成物は Git へ登録せず、必要に応じて CRX または XPI へパッケージ化する。

### 2.5 Manifest の設計

Manifest は Manifest V3 を基本とし、Chrome と Edge では共通の Chromium 用 Manifest を利用する。Firefox は署名と Gecko 固有設定のため、別の Manifest を生成する。

共通設定には以下を含める。

- `manifest_version: 3`
- 拡張機能名、バージョン、説明
- `action.default_title`
- `background.service_worker`
- `content_security_policy.extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"`
- 拡張機能アイコン

RaptorQR は拡張機能ページ自身で動作するため、`activeTab`、`tabs`、`scripting`、`<all_urls>`、content scripts などの権限は原則として要求しない。実際に必要な権限が判明した場合だけ、最小限の権限を追加する。

RaptorQR の WASM は拡張機能ページ内でコンパイルするため、CSP には `wasm-unsafe-eval` を追加する。任意の JavaScript 文字列評価を許可する `unsafe-eval` は使用しない。

Firefox 用 Manifest には、署名済み Manifest V3 拡張機能に必要な Gecko 固有設定を追加する。

- `browser_specific_settings.gecko.id`
- `browser_specific_settings.gecko.strict_min_version: "142.0"`
- `browser_specific_settings.gecko.data_collection_permissions.required: ["none"]`

Firefox 用成果物では、未対応の `background.service_worker` を出力せず、`background.scripts: ["background.js"]` を使用する。`data_collection_permissions` をデスクトップと Android の両方で利用するため、Firefox の最低バージョンはこのキーをサポートする 142.0 とする。

Chrome/Edge 用と Firefox 用の差分は `scripts/build-manifest.mjs` で生成し、共通部分を二重管理しない。

### 2.6 Service Worker と PWA Service Worker

拡張機能の `background.js` は、アイコン押下時のタブ起動だけを担当する。RaptorQR 本体のエンコード、デコード、QR 描画、カメラ処理を background 側へ移植しない。

RaptorQR の Web アプリには PWA 用の `sw.js`、Service Worker 登録処理、Cache Storage を使う資産プリロード処理が含まれるが、拡張機能では全資産をパッケージに同梱するため、PWA キャッシュとの二重管理は行わない。拡張機能向けの明示的な build flag を upstream に追加し、この flag が有効な場合は Service Worker の登録、PWA キャッシュ、`sw.js`、`manifest.webmanifest` をまとめて除外する。ハッシュ付きのビルド済み JavaScript を後処理して登録呼び出しだけを削除する方法は使用しない。

なお、実際に WASM や worker の読み込みで拡張機能の制約に遭遇した場合は、必要な資産だけを `web_accessible_resources` に追加する。Web ページへ公開する資産は最小限にし、不要なワイルドカード公開は避ける。

### 2.7 パッケージング

#### Chrome / Edge

Chrome と Edge では同じ `dist/chromium` を使用する。開発時は unpacked extension の読み込みを基本とし、配布用 CRX は秘密鍵をリポジトリへ保存せずに生成する。

CRX の生成には Chrome/Chromium の拡張機能パッケージ機能を使用する。

```text
chrome.exe --pack-extension=<path-to-dist/chromium> --pack-extension-key=<path-to-private-key.pem>
```

秘密鍵は拡張機能 ID と更新に必要なため、安全な場所で管理する。Chrome や Edge での CRX の直接インポート可否は、OS、ブラウザの種類、管理ポリシーによって異なるため、成果物の生成とインストール方法を分けて記載する。

#### Firefox

`dist/firefox` を ZIP 化して開発用の `.xpi` を作成する。未署名の XPI は通常版 Firefox ではインストールできないため、開発中は Firefox Developer Edition、Nightly、または temporary add-on を利用する。

通常版 Firefox で配布する場合は、`web-ext sign` または AMO の Developer Hub/API で署名する。AMO の資格情報は環境変数または CI の secret で管理し、リポジトリや成果物へ含めない。

### 2.8 オフライン動作

「オフライン動作」は、インストール後にインターネットへ接続しなくても、拡張機能に同梱された HTML、JavaScript、CSS、WASM、worker、画像などだけで RaptorQR を起動できることを指す。

- 初回起動時から外部 CDN や Live demo へ実通信しない。ライブラリ内部に含まれる未使用の CDN フォールバック文字列だけでは失敗扱いにせず、RaptorQR が同梱 WASM を明示的に選択していることと、オフライン実行時の通信がないことを確認する
- RaptorQ と QR 処理に必要な WASM をすべて同梱する
- 外部フォント、外部スクリプト、外部 API に依存しない
- ファイル送信とテキスト送信をローカルで実行する
- 受信時のカメラ利用はブラウザのユーザー許可を必要とする

### 2.9 検証方針

#### ビルド・静的検証

- submodule を初期化した状態で RaptorQR の Web build が成功する
- Chromium 用と Firefox 用の Manifest が JSON として正しく解釈できる
- `manifest.json` が各パッケージのルートに存在する
- HTML から参照される JS、CSS、WASM、worker のファイルがすべて存在する
- Manifest で参照する PNG アイコンがすべて存在する
- 秘密鍵、AMO 資格情報、外部 URL を直接参照する設定が成果物へ混入していない
- 拡張機能ページの実行時に外部通信が発生しない

#### ブラウザ検証

- Chrome で unpacked extension を読み込み、アイコンから新しいタブを開ける
- Edge で Chromium 用成果物を読み込み、同じ操作ができる
- Firefox で temporary add-on または Developer Edition 用 XPI を読み込める
- 署名済み Firefox XPI を通常版 Firefox へインストールできる
- ネットワークを遮断してもアプリが起動する
- テキスト送信、ファイル送信、QR の表示、カメラ受信を確認する
- WASM、worker、カメラ権限でエラーが発生しない

upstream 更新時は、固定コミットを更新した後に、upstream のテスト、拡張機能の Manifest 検証、両 Chromium 系ブラウザ、Firefox の smoke test、オフライン送受信を再実行する。

## 3 実装手順

plan.md の 3.X に基づいて実装して。実装中に問題や疑問が発生した場合は、適宜この計画を見直し、必要に応じて upstream の変更やパッチの修正を行う。適宜 git commit すること。

### 3.1 リポジトリと依存関係を準備する

1. `.gitignore` を作成し、`node_modules`、`dist`、CRX、XPI、秘密鍵を除外する。
2. ルートの `package.json` と `pnpm-workspace.yaml` を作成し、拡張機能の build、検証、Firefox パッケージング用スクリプトを定義する。
3. `vendor/RaptorQR` に `https://github.com/infrost/RaptorQR` を Git submodule として追加する。
4. 検証済みの upstream コミットへ submodule を固定し、`.gitmodules` と submodule の参照を記録する。

完了条件: clone 後に `git submodule update --init --recursive` が成功し、`pnpm` でルートスクリプトを実行できる。

### 3.2 upstream の拡張機能ビルドモードを追加する

1. upstream の Web アプリに拡張機能向け build flag を追加する。
2. flag が有効なときは、PWA Service Worker の登録と Cache Storage による資産プリロードを実行しない。
3. 同じ flag で `sw.js` と `manifest.webmanifest` を build 出力から除外する。
4. upstream へ変更を提案できない場合は、変更内容を管理済みパッチとしてこのリポジトリに保持し、submodule 初期化後かつ build 前に適用する。

完了条件: 拡張機能モードの build 成果物に PWA Service Worker、Web Manifest、Service Worker の登録コード、PWA キャッシュ処理が含まれない。

### 3.3 RaptorQR の成果物をビルドして確認する

1. `vendor/RaptorQR` で `pnpm install --frozen-lockfile` を実行する。
2. 拡張機能用 build flag を指定して `pnpm build` を実行する。
3. `apps/web/dist` に HTML、JavaScript、worker、Fast QR、RaptorQ、ZXing reader、ZXing writer の WASM が配置されていることを確認する。CSS は upstream が独立した CSS を生成する場合にのみ確認する（現行 UI は主にインラインスタイルを使用する）。
4. RaptorQR が同梱 WASM を選択し、外部 CDN へ実通信しないことを確認する。

完了条件: upstream build が成功し、PWA を除外した Web アプリの全実行時資産がローカルに揃う。

### 3.4 最小の拡張機能を実装する

1. `extension/background.js` を作成し、`action.onClicked` で `runtime.getURL('app/index.html')` を新しいタブとして開く。
2. `extension/manifest.base.json` を作成し、Manifest V3、action、background service worker、アイコンだけを共通設定として定義する。
3. 必要サイズの PNG アイコンを生成する処理を追加する。
4. `manifest.base.json`、background、空の `app/index.html`、PNG アイコンを静的に検証する。`dist/chromium` を組み立てる 3.5 の完了後に、生成済みの Chromium 用 Manifest を Chrome で unpacked extension として読み込む。

完了条件: 共通 Manifest、background、空の `app/index.html`、PNG アイコンが揃い、background のアイコン押下処理が拡張機能内の `app/index.html` を開く。不要な権限を要求しない。Chrome への unpacked extension 読み込みは 3.5 の完了条件とする。

### 3.5 拡張機能の成果物を組み立てる

1. `scripts/build-extension.mjs` を作成し、既存の `dist` を削除してから `dist/chromium` と `dist/firefox` を作成する。
2. upstream の `apps/web/dist` を各ターゲットの `app` ディレクトリへコピーする。
3. `background.js` と生成した PNG アイコンを各ターゲットへコピーする。
4. `scripts/build-manifest.mjs` を作成し、共通 Manifest から Chromium 用と Firefox 用の `manifest.json` を生成する。
5. Firefox 用に Gecko 固有設定だけを追加する。

完了条件: 両ターゲットのルートに `manifest.json` があり、その Manifest が参照する background、アイコン、アプリ資産がすべて存在する。

### 3.6 ビルド時の静的検証を追加する

1. Manifest を JSON として読み込み、必須フィールドと参照ファイルを検証する。
2. `app/index.html` から参照される JavaScript、CSS、WASM、worker の存在を検証する。
3. PWA 用の `sw.js`、`manifest.webmanifest`、Service Worker 登録コードが拡張機能成果物に残っていないことを検証する。
4. 秘密鍵、AMO 資格情報、外部 URL を直接参照する設定が混入していないことを検証する。

完了条件: ルートの build コマンドが成果物の組み立てと静的検証までを完了し、問題があれば失敗する。

### 3.7 Chromium 系ブラウザで検証する

1. Chrome で `dist/chromium` を unpacked extension として読み込む。
2. アイコンから RaptorQR タブを開き、画面表示、WASM、worker の読み込みを確認する。
3. テキスト送信、ファイル送信、QR 表示、カメラ受信を確認し、カメラ権限の動作を記録する。
4. ネットワークを遮断して同じ操作を実行し、外部通信なしで動作することを確認する。
5. Edge で同じ Chromium 用成果物に対して 1〜4 を再実行する。

stable 版の Chrome/Edge は、バージョンや組織設定によって command-line の `--load-extension` を受け付けないことがある。`pnpm verify:chromium` は、unpacked 拡張機能を読み込める開発用 Chromium を `CHROME_PATH` と `EDGE_PATH` で指定して、画面表示、worker/WASM、テキスト送信、ファイル送信、fake camera によるカメラ権限、オフライン送信、外部 HTTP(S) 通信なしを自動検証する。stable 版では `chrome://extensions` または `edge://extensions` の開発者モードから `dist/chromium` を手動で読み込み、同じ操作を確認する。

完了条件: Chrome と Edge の両方で、RaptorQR の主要機能がオフラインで動作する。

### 3.8 Firefox 用成果物を検証・パッケージ化する

1. Firefox 用 Manifest を `web-ext lint` で検証する。
2. `dist/firefox` を Firefox の temporary add-on として読み込み、Chromium 系と同じ機能とオフライン動作を確認する。
3. `scripts/package-xpi.mjs` で開発用 XPI を作成する。
4. 配布が必要になった時点で、AMO の Secret を利用して `web-ext sign` による署名済み XPI を作成する。

`pnpm lint:firefox` で Firefox 用成果物を検証し、`pnpm package:firefox` で `dist/firefox-artifacts/raptorqr-web-ext-dev.xpi` を生成する。temporary add-on は `pnpm run:firefox` で起動でき、`FIREFOX_PATH` に実行ファイルを指定して別環境にも対応する。Microsoft Store 版 Firefox 154.0.1 では、既定の `C:/Program Files/WindowsApps/Mozilla.Firefox_154.0.1.0_x64__n80bbvh6b1yt2/VFS/ProgramFiles/Firefox Package Root/firefox.exe` を利用して temporary add-on のインストールを確認した。現時点の `web-ext lint` 警告は、upstream の minify 済み UI bundle における `innerHTML` 使用だけである。

完了条件: Firefox の temporary add-on として動作し、開発用 XPI が生成できる。通常版 Firefox 向け配布物は署名済み XPI とする。

### 3.9 配布手順と継続検証を整備する

1. `docs/packaging.md` に Chrome／Edge の unpacked extension、CRX、Firefox の temporary add-on、署名済み XPI の導入手順を記載する。
2. CRX の秘密鍵と AMO 資格情報を、リポジトリ外の安全な保管場所または CI Secret で管理する。
3. upstream 更新時は、固定コミット更新、管理済みパッチ適用、build、静的検証、Chrome、Edge、Firefox、オフライン送受信を一連で再実行する。

配布と継続検証の具体的な手順は `docs/packaging.md` に記載する。CRX の PEM と AMO の資格情報は `.gitignore` で除外されるファイルまたは CI Secret に限定し、成果物・ログ・リポジトリへ保存しない。

完了条件: 開発者が資格情報をリポジトリへ含めずに、各ブラウザ向けの検証済み成果物を再現可能に生成できる。

# 配布と検証

## 共通の準備

リポジトリを clone した後、submodule と依存関係を初期化する。

```powershell
git submodule update --init --recursive
pnpm install --frozen-lockfile
pnpm build
```

`pnpm build` は、RaptorQR の拡張機能モード build、PNG アイコン生成、Chromium/Firefox 用ディレクトリの組み立て、静的検証を実行する。成功後の成果物は `dist/chromium` と `dist/firefox` にある。

追加の検証コマンドは次のとおり。

```powershell
pnpm verify
pnpm lint:firefox
pnpm package:firefox
```

`pnpm lint:firefox` は `web-ext lint` を実行する。upstream の minify 済み UI bundle にある `innerHTML` 使用について、現在 1 件の警告が出ることがある。Manifest、資産参照、XPI 作成を妨げるエラーではないが、upstream 更新時には内容を再確認する。

## Chrome と Edge

開発時は `dist/chromium` を unpacked extension として読み込む。

1. `chrome://extensions` または `edge://extensions` を開く。
2. 開発者モードを有効にする。
3. 「パッケージ化されていない拡張機能を読み込む」を選び、リポジトリの `dist/chromium` を選択する。
4. RaptorQR のツールバーアイコンを選び、新しい RaptorQR タブが開くことを確認する。
5. テキスト送信、ファイル送信、QR 表示、カメラ受信を確認する。ネットワークを遮断した状態でも同じ操作を確認する。

配布用の CRX はブラウザ付属のパッケージ機能で作る。

```powershell
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --pack-extension="$PWD\dist\chromium" --pack-extension-key='D:\secure\raptorqr-extension.pem'
```

Edge を使う場合は `chrome.exe` を `msedge.exe` のパスへ読み替える。CRX の直接インポート可否はブラウザの種類、OS、組織ポリシーに左右されるため、配布前に対象環境で確認する。

CRX 用の PEM は拡張機能 ID と更新継続に必要である。リポジトリ、配布物、ログへ保存せず、暗号化されたローカル保管場所または CI の Secret にのみ保存する。新規の秘密鍵を作ると拡張機能 ID が変わる。

## Firefox

Firefox 向けの開発用 XPI は以下で生成する。

```powershell
pnpm package:firefox
```

出力先は `dist/firefox-artifacts/raptorqr-web-ext-dev.xpi`。これは署名なしの開発用 XPI であり、通常版 Firefox へ恒久的にはインストールできない。

temporary add-on として起動するには以下を実行する。

```powershell
pnpm run:firefox
```

既定では Microsoft Store 版 Firefox のパスを使用する。別の Firefox を使う場合は環境変数で指定する。

```powershell
$env:FIREFOX_PATH = 'C:\Program Files\Mozilla Firefox\firefox.exe'
pnpm run:firefox
```

temporary add-on では、RaptorQR タブを開き、テキスト送信、ファイル送信、QR 表示、カメラ受信、オフライン動作を確認する。通常版 Firefox に配布する XPI は AMO 署名済みのものだけを使用する。

署名はリリースまたは CI で `web-ext sign` を使って行う。AMO API の issuer、secret、JWT、アカウント情報はリポジトリ、`.xpi`、ビルドログに入れず、CI Secret または安全な資格情報ストアから環境変数として注入する。

## Upstream 更新時

`vendor/RaptorQR` の固定コミットを更新する場合は、次の順序で互換性を確認する。

1. submodule を目的のコミットへ更新する。
2. `patches/raptorqr-extension-build.patch` を clean worktree に適用できることを確認し、必要なら upstream 差分から再生成する。
3. `pnpm build` と `pnpm verify` を実行する。
4. `pnpm lint:firefox` と `pnpm package:firefox` を実行する。
5. Chrome、Edge、Firefox で各成果物を読み込み、テキスト送信、ファイル送信、QR 表示、カメラ受信を確認する。
6. 各ブラウザでネットワークを遮断し、外部通信なしで同じ機能が動作することを確認する。

更新後に新しい権限、外部 URL、PWA Service Worker、秘密情報が成果物へ混入していないことは、`pnpm verify` の結果と生成 Manifest を確認する。
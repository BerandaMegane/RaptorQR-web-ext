# RaptorQR Web Extension

RaptorQR Web Extension packages the [RaptorQR](https://github.com/infrost/RaptorQR)
web application as an offline-capable browser extension. It opens the RaptorQR
interface in an extension tab for QR-based text and file transfer.

This repository is an independent packaging project and is not affiliated with
or endorsed by the RaptorQR project or its contributors.

## Supported browsers

- Google Chrome and Microsoft Edge: load `dist/chromium` as an unpacked
	extension during development. A CRX may be produced for controlled
	environments where the browser policy allows it.
- Mozilla Firefox: use `dist/firefox` as a temporary add-on during development.
	Regular Firefox installations require an AMO-signed XPI for permanent use.

## Build

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

## Privacy and permissions

The extension does not request host or content-script permissions. It packages
its runtime assets locally and is designed to work without network access after
installation. Camera reception requires the browser's normal camera permission.

Do not encode private or sensitive data unless the receiving environment is
trusted. QR payloads are visible to anyone who can observe the displayed codes.

## License and notices

The extension wrapper, build scripts, documentation, and original assets are
licensed under the [MIT License](LICENSE). RaptorQR and bundled dependencies
remain under their own terms. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
and the `LICENSES/` directory included in each extension package.

## Security

See [SECURITY.md](SECURITY.md) for responsible vulnerability reporting.

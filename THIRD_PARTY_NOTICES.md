# Third-Party Notices

RaptorQR Web Extension packages the RaptorQR web application as a browser
extension. RaptorQR is an independent project and is not affiliated with this
repository's maintainer.

The `vendor/RaptorQR` git submodule is licensed under the MIT License. Its
license text is copied to extension distributions as `LICENSES/RaptorQR-MIT.txt`.

The RaptorQR application bundle also includes third-party dependencies. The
following source projects are included by the pinned upstream build. Their
license texts are included under `LICENSES/` where available in the pinned
source package.

| Component | Purpose | Upstream source |
| --- | --- | --- |
| RaptorQ 2.0.1 | Forward error correction WASM | Apache-2.0; `LICENSES/Apache-2.0.txt` |
| fast_qr 0.13 | QR rendering WASM | MIT; `LICENSES/fast_qr-MIT.txt` |
| zxing-wasm / zxing-cpp | QR scanning and writing WASM | https://github.com/Sec-ant/zxing-wasm |
| zint | Barcode writer dependency | https://github.com/zint/zint |
| Preact 10.29.4 | User interface runtime | MIT; `LICENSES/MIT-DEPENDENCIES.txt` |
| fflate 0.8.3 | Compression support | MIT; `LICENSES/MIT-DEPENDENCIES.txt` |
| gifenc 1.0.3 | GIF encoding | MIT; `LICENSES/MIT-DEPENDENCIES.txt` |

Before publishing a CRX or XPI release, check the exact zxing-wasm 3.1.0 build
provenance and any transitive zxing-cpp or zint notices for the bundled reader
and writer WASM files. Preserve all required license and NOTICE texts from
those pinned sources in `LICENSES/`. Do the same whenever either WASM module is
rebuilt or its source version changes.

Build-only tools such as `sharp`, `web-ext`, and Playwright are not shipped in
the extension packages. Their licenses are therefore not copied into release
artifacts.
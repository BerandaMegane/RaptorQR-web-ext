# Third-Party Notices

RaptorQR Web Extension packages the RaptorQR web application as a browser
extension. RaptorQR is an independent project and is not affiliated with this
repository's maintainer.

The `vendor/RaptorQR` git submodule is licensed under the MIT License. Its
license text is copied to extension distributions as `LICENSES/RaptorQR-MIT.txt`.

The RaptorQR application bundle also includes third-party dependencies. The
following source projects are included by the pinned upstream build. Their
license texts and required notices are included under `LICENSES/`.

| Component | Purpose | Upstream source |
| --- | --- | --- |
| RaptorQ 2.0.1 | Forward error correction WASM | Apache-2.0; `LICENSES/Apache-2.0.txt` |
| fast_qr 0.13 | QR rendering WASM | MIT; `LICENSES/fast_qr-MIT.txt` |
| zxing-wasm 3.1.0 | QR scanning and writing WASM | MIT; `LICENSES/MIT-DEPENDENCIES.txt` |
| ZXing-C++ `f5adf68706afd54e8e20ade3406d832e7ce72413` | QR scanning and writing WASM | Apache-2.0; `LICENSES/Apache-2.0.txt` |
| Zint 2.16.0 `55541e139e62b9209b71cd9b0ba9010cec28b1d9` | Barcode writer dependency | BSD-3-Clause; `LICENSES/Zint-BSD-3-Clause.txt` |
| Preact 10.29.4 | User interface runtime | MIT; `LICENSES/MIT-DEPENDENCIES.txt` |
| fflate 0.8.3 | Compression support | MIT; `LICENSES/MIT-DEPENDENCIES.txt` |
| gifenc 1.0.3 | GIF encoding | MIT; `LICENSES/MIT-DEPENDENCIES.txt` |

`LICENSES/ZXing-WASM-NOTICE.txt` records the zxing-wasm package integrity and
the fixed ZXing-C++ and Zint source revisions used to build the bundled reader
and writer WASM files. Review and update these notices whenever zxing-wasm or
either WASM module is updated.

Build-only tools such as `sharp`, `web-ext`, and Playwright are not shipped in
the extension packages. Their licenses are therefore not copied into release
artifacts.
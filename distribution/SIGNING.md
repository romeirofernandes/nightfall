# macOS signing

The existing 0.3.1 release is ad-hoc signed. A Gatekeeper “Not Opened” alert
is handled through System Settings → Privacy & Security → Open Anyway.
Do not disable Gatekeeper or strip quarantine in the installer.

To publish an approved build, an Apple Developer Program account needs a
Developer ID Application certificate. Export the certificate and private key
as a password-protected P12. Add these GitHub Actions secrets privately:

- APPLE_CERTIFICATE: base64 P12
- APPLE_CERTIFICATE_PASSWORD
- APPLE_SIGNING_IDENTITY: exact Developer ID Application identity
- APPLE_API_ISSUER and APPLE_API_KEY: App Store Connect API identifiers
- APPLE_API_PRIVATE_KEY_BASE64: base64 API .p8 private key

Run the macOS release workflow with `notarize` enabled. It fails early for
missing secrets, signs and notarizes through Tauri, verifies the stapled ticket
and Gatekeeper assessment, and removes temporary signing material. It never
replaces the resulting Developer ID signature with an ad-hoc signature.
Publish only verified artifacts and update both cask checksums.

This credential-dependent path has not been run. The unsigned distribution
path and the current Homebrew installation were tested on both architectures.
See https://v2.tauri.app/distribute/sign/macos/ for the credential setup.

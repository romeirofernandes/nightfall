# Binary distribution

Source, installers, releases, and the Homebrew cask now live in this public
repository. `Casks/nightfall.rb` is the canonical cask; the copy here is kept
in sync for distribution tooling. The former homebrew-nightfall repository
is a compatibility archive.

Release 0.3.1 contains Apple Silicon and Intel macOS applications and a Linux
x64 archive. SHA256SUMS records the distributed bytes. Run the macOS release
workflow for future builds, publish their checksummed archives here, update
the casks, and run the Homebrew installation workflow on both architectures.

Current downloads are ad-hoc signed and require the supported Open Anyway
approval on first launch. Notarized releases require the owner's Developer ID
certificate and Apple notarization credentials. Never disable Gatekeeper.

# Binary distribution

The application source repository remains private. Public prebuilt downloads,
Homebrew casks, and installation checks live in
https://github.com/romeirofernandes/homebrew-nightfall.

Release 0.2.1 was built from source commit b9ee4d5. The macOS workflow creates
Apple Silicon and Intel .app bundles and checks their ad-hoc signatures before
archiving them. The Linux x64 archive was built in the development VM.
SHA256SUMS records the exact distributed archives.

The cask in this directory mirrors the published tap. To make a future release:
update versions, build both macOS architectures with release-macos.yml, inspect
the workflow results, download its artifacts, calculate checksums, publish a new
binary release in the public tap, and update its cask and this mirror together.
Run the public tap's "Verify Homebrew installation" workflow after publication.

These are ad-hoc signed development releases. Developer ID signing and Apple
notarization require the owner's Apple developer credentials and are not
configured. Never claim they are notarized and never disable Gatekeeper in a
cask hook.

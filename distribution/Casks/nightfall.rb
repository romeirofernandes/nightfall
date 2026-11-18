cask "nightfall" do
  arch arm: "arm64", intel: "x64"

  version "0.4.6"
  sha256 arm:   "b554e306fa3530b2c3e74980ba1b401440e72c93cebcd5736ac48b900f5be562",
         intel: "b4b1a184b8b5654063347977e758836915d3355af8615a529f991644be182d63"

  url "https://github.com/romeirofernandes/nightfall/releases/download/v#{version}/Nightfall-#{version}-#{arch}.zip"
  name "Nightfall"
  desc "Falling snow over your desktop windows"
  homepage "https://github.com/romeirofernandes/nightfall"

  depends_on macos: :big_sur

  app "Nightfall.app"
  binary "#{appdir}/Nightfall.app/Contents/MacOS/nightfall", target: "nightfall"

  uninstall quit: "app.nightfall.desktop"

  caveats <<~EOS
    Nightfall is ad-hoc signed and is not notarized by Apple.
    If macOS blocks the first launch, try opening the app, then allow
    Nightfall in System Settings > Privacy & Security if that option appears.
  EOS
end

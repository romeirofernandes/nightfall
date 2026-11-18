cask "nightfall" do
  arch arm: "arm64", intel: "x64"

  version "0.4.3"
  sha256 arm:   "bd751f5002c886fef021b5d8e0f8f2ce8fb9e65fcd0c688f85105f7f42db0e85",
         intel: "57805fff3f4755fd5d15e5316e969c31ec8d2029b19ba72371da32a0e86baf37"

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

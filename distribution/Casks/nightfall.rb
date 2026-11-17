cask "nightfall" do
  arch arm: "arm64", intel: "x64"

  version "0.4.0"
  sha256 arm:   "0c050cee09ccf701640f83cc81d98d288dcd7454d3436cf7541e8366ceec06da",
         intel: "4225e6968ca7e2c7b3e1d9cba7c313cec2979bcdefd0fc6359cde2b70f7be9d3"

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

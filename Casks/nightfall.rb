cask "nightfall" do
  arch arm: "arm64", intel: "x64"

  version "0.4.7"
  sha256 arm:   "7f131b936d66b3d7f47736bed8dbba5302a1dd49ba37d1b26d56bd5d5dcfa800",
         intel: "f8cfaf1d25dd9fc1a483df7c41d709732b9a88236c280b284fc835f859b25378"

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

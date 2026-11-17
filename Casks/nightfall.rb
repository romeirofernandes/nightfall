cask "nightfall" do
  arch arm: "arm64", intel: "x64"

  version "0.3.0"
  sha256 arm:   "53b6ea1d4ddce116456a68e64577277593377ecbab650c35c28dfb8ea6d460ff",
         intel: "9f9b9b53ae6a9fb9f0825d625b837f258e513c50de24e8e3c5429ffaae3efb8f"

  url "https://github.com/romeirofernandes/nightfall/releases/download/v#{version}/Nightfall-#{version}-#{arch}.zip"
  name "Nightfall"
  desc "Falling snow over your desktop windows"
  homepage "https://github.com/romeirofernandes/nightfall"

  depends_on macos: :big_sur

  app "Nightfall.app"

  uninstall quit: "app.nightfall.desktop"

  caveats <<~EOS
    Nightfall is ad-hoc signed and is not notarized by Apple.
    If macOS blocks the first launch, try opening the app, then allow
    Nightfall in System Settings > Privacy & Security if that option appears.
  EOS
end

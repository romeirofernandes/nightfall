cask "nightfall" do
  arch arm: "arm64", intel: "x64"

  version "0.3.1"
  sha256 arm:   "23f7b1737430bfc50ce97190197a9d750398920fc45928b7b350179e95ca8723",
         intel: "99e22f86317c50f11ef47d59599fa8eb24004687a634810be0a642efa7568361"

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

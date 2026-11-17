cask "nightfall" do
  arch arm: "arm64", intel: "x64"

  version "0.2.1"
  sha256 arm:   "480a54542f11a5884208d74bddedcbde057064feb1a21b55d9613507c07ec19b",
         intel: "c8bbcacc3b246d97814d84ed3d02173b2b18891abba532956d7829080596480b"

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

cask "nightfall" do
  arch arm: "arm64", intel: "x64"

  version "0.4.4"
  sha256 arm:   "dd4cb94ec212581749ec2e1d696a0c67cd2ec64893b8a828b0556d0eca36ed21",
         intel: "6a311c2fe9cfe254e82481788fa1e0789093c7b42c430e970ff0b9bcc40a0a74"

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

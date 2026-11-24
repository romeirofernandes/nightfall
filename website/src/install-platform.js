export function detectInstallPlatform(browser) {
  const {userAgent = '', platform = '', maxTouchPoints = 0, userAgentData} = browser;
  // iPadOS can present itself as a Mac when requesting a desktop website.
  if (userAgentData?.mobile || /Android|iPhone|iPad|iPod|CrOS/i.test(userAgent) ||
      (/^Mac/i.test(platform) && maxTouchPoints > 1)) return null;

  const reportedPlatform = userAgentData?.platform || platform;
  if (/^Win/i.test(reportedPlatform) || /Windows NT/i.test(userAgent)) return 'windows';
  if (/^Mac/i.test(reportedPlatform) || /Macintosh/i.test(userAgent)) return 'mac';
  if (/^Linux/i.test(reportedPlatform) || /X11.*Linux/i.test(userAgent)) return 'linux';
  return null;
}

export function getWindowsDownloads(release, latestReleaseUrl) {
  const {tag_name: tag, assets} = release;
  if (!/^v\d+\.\d+\.\d+$/.test(tag) || !Array.isArray(assets)) {
    throw new Error('Unexpected GitHub release metadata');
  }

  const base = latestReleaseUrl.replace(/\/latest$/, `/download/${tag}`);
  const prefix = `Nightfall-${tag.slice(1)}-windows-x64`;
  const download = name => assets.some(asset => asset.name === name && asset.state === 'uploaded')
    ? `${base}/${name}`
    : null;

  return {
    installer: download(`${prefix}-setup.exe`),
    portable: download(`${prefix}.zip`),
  };
}

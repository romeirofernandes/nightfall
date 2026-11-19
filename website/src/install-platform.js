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

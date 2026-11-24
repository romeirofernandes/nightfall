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

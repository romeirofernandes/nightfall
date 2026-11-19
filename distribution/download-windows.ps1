[CmdletBinding()]
param(
    [string] $Tag,
    [string] $OutputDirectory = (Join-Path $HOME 'Downloads')
)

$ErrorActionPreference = 'Stop'
$repository = 'romeirofernandes/nightfall'
$releases = "https://api.github.com/repos/$repository/releases"
if ($Tag -and $Tag -cnotmatch '^v[0-9]+\.[0-9]+\.[0-9]+$') {
    throw 'Use a release tag such as v0.4.7.'
}

if ($Tag) {
    $release = Invoke-RestMethod -Uri "$releases/tags/$Tag"
} else {
    $release = Invoke-RestMethod -Uri "$releases/latest"
    $Tag = $release.tag_name
}
if ($Tag -cnotmatch '^v[0-9]+\.[0-9]+\.[0-9]+$') {
    throw 'GitHub returned an unexpected release tag.'
}

$name = "Nightfall-$($Tag.Substring(1))-windows-x64"
$asset = "$name.zip"
if ($release.assets.name -cnotcontains $asset -or $release.assets.name -cnotcontains 'SHA256SUMS') {
    throw "Release $Tag has no verified Windows x64 download."
}

$parent = [IO.Directory]::CreateDirectory(
    $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputDirectory)
).FullName
$destination = Join-Path $parent $name
$work = Join-Path $parent ".nightfall-$([guid]::NewGuid())"
$null = [IO.Directory]::CreateDirectory($work)

try {
    $base = "https://github.com/$repository/releases/download/$Tag"
    $archive = Join-Path $work $asset
    $checksums = Join-Path $work 'SHA256SUMS'
    Invoke-WebRequest -UseBasicParsing -Uri "$base/SHA256SUMS" -OutFile $checksums
    $pattern = '^([a-fA-F0-9]{64})\s+\*?' + [regex]::Escape($asset) + '$'
    $matchesForAsset = @(Select-String -LiteralPath $checksums -Pattern $pattern -CaseSensitive)
    if ($matchesForAsset.Count -ne 1) {
        throw "Missing or ambiguous SHA256 checksum for $asset."
    }

    Invoke-WebRequest -UseBasicParsing -Uri "$base/$asset" -OutFile $archive
    if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $matchesForAsset[0].Matches[0].Groups[1].Value) {
        throw "SHA256 checksum mismatch for $asset."
    }

    $extracted = Join-Path $work 'extracted'
    Expand-Archive -LiteralPath $archive -DestinationPath $extracted
    $executables = @('nightfall-renderer.exe', 'nightfall.exe')
    foreach ($file in $executables) {
        if (-not (Test-Path -LiteralPath (Join-Path $extracted $file) -PathType Leaf)) {
            throw "The Windows ZIP is missing $file."
        }
    }

    if (-not (Test-Path -LiteralPath $destination)) {
        [IO.Directory]::Move($extracted, $destination)
    } else {
        foreach ($file in $executables) {
            $existing = Join-Path $destination $file
            if (-not (Test-Path -LiteralPath $existing -PathType Leaf) -or
                (Get-FileHash -LiteralPath $existing).Hash -ne (Get-FileHash -LiteralPath (Join-Path $extracted $file)).Hash) {
                throw "Existing files in '$destination' differ from the release. Choose another output directory."
            }
        }
    }

    Write-Output ('Open "' + (Join-Path $destination 'nightfall-renderer.exe') + '" to start Nightfall.')
} finally {
    Remove-Item -LiteralPath $work -Recurse -Force
}

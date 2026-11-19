[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $Cli,
    [Parameter(Mandatory)] [string] $OutputDirectory
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$desktop = Join-Path $root 'desktop'
$target = Join-Path $desktop 'src-tauri/target/release'
$bundledCli = [IO.Path]::GetFullPath((Join-Path $target 'nightfall.exe'))
$cliPath = (Resolve-Path -LiteralPath $Cli).Path
if ($cliPath -ne $bundledCli) {
    Copy-Item -LiteralPath $cliPath -Destination $bundledCli
}
$version = (Get-Content -Raw (Join-Path $desktop 'package.json') | ConvertFrom-Json).version
$null = New-Item -ItemType Directory -Force -Path $OutputDirectory

Push-Location $desktop
try {
    npm exec -- tauri bundle --bundles nsis --config src-tauri/nsis.conf.json
    if ($LASTEXITCODE -ne 0) { throw "Tauri installer build failed with exit code $LASTEXITCODE." }
} finally {
    Pop-Location
}

$installer = Join-Path $target "bundle/nsis/Nightfall_${version}_x64-setup.exe"
Copy-Item -LiteralPath $installer -Destination (Join-Path $OutputDirectory "Nightfall-$version-windows-x64-setup.exe")

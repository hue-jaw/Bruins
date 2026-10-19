$ErrorActionPreference = 'Stop'
$sourceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if ((Split-Path $sourceRoot -Leaf) -ne 'BRUINS') { throw 'Unexpected source directory' }
if (-not (Test-Path -LiteralPath (Join-Path $sourceRoot 'BRUINS.yyp'))) { throw 'Project missing' }
$zipPath = Join-Path (Split-Path $sourceRoot -Parent) 'BRUINS_Source.zip'
Compress-Archive -LiteralPath $sourceRoot -DestinationPath $zipPath -CompressionLevel Optimal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipArchive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$checked = 0
try {
    foreach ($entry in $zipArchive.Entries) {
        if ([string]::IsNullOrEmpty($entry.Name)) { continue }
        $entryName = $entry.FullName.Replace('\', '/')
        if (-not $entryName.StartsWith('BRUINS/')) { throw "Unexpected archive entry: $entryName" }
        $relative = $entryName.Substring(7).Replace('/', '\')
        $original = [System.IO.Path]::GetFullPath((Join-Path $sourceRoot $relative))
        if (-not $original.StartsWith($sourceRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Archive path escaped source root' }
        $expected = (Get-FileHash -LiteralPath $original -Algorithm SHA256).Hash
        $stream = $entry.Open()
        $hasher = [System.Security.Cryptography.SHA256]::Create()
        try { $actual = [BitConverter]::ToString($hasher.ComputeHash($stream)).Replace('-', '') }
        finally { $stream.Dispose(); $hasher.Dispose() }
        if ($actual -ne $expected) { throw "Archive mismatch: $entryName" }
        $checked++
    }
} finally { $zipArchive.Dispose() }
$expectedCount = (Get-ChildItem -LiteralPath $sourceRoot -File -Recurse).Count
if ($checked -ne $expectedCount) { throw "Archive file count mismatch: $checked / $expectedCount" }
$receipt = [ordered]@{ kind = 'GameMaker source archive, NOT a Windows executable'; files = $checked; bytes = (Get-Item -LiteralPath $zipPath).Length; sha256 = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash; archiveIntegrity = 'Every archived file matched its source SHA256'; runtimeTested = $false }
$receipt | ConvertTo-Json | Set-Content -LiteralPath ($zipPath + '.receipt.json') -Encoding UTF8
$receipt | ConvertTo-Json

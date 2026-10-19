$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if((Split-Path $root -Leaf) -ne 'BRUINS'){throw 'Unexpected root'}
$parent=Split-Path $root -Parent
function Write-BruinsArchive($archivePath,$entries){
 $file=[IO.File]::Open($archivePath,[IO.FileMode]::Create,[IO.FileAccess]::ReadWrite)
 $zip=[IO.Compression.ZipArchive]::new($file,[IO.Compression.ZipArchiveMode]::Create,$false)
 try{foreach($e in $entries){[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$e.source,$e.entry,[IO.Compression.CompressionLevel]::Optimal)|Out-Null}}finally{$zip.Dispose()}
 $zip=[IO.Compression.ZipFile]::OpenRead($archivePath)
 try{
  if($zip.Entries.Count -ne $entries.Count){throw 'Entry count mismatch'}
  foreach($e in $entries){$entry=$zip.GetEntry($e.entry);if($null -eq $entry){throw 'Missing entry'};$stream=$entry.Open();$hash=[Security.Cryptography.SHA256]::Create();try{$actual=[BitConverter]::ToString($hash.ComputeHash($stream)).Replace('-','')}finally{$stream.Dispose();$hash.Dispose()};if($actual -ne (Get-FileHash -LiteralPath $e.source -Algorithm SHA256).Hash){throw "Mismatch: $($e.entry)"}}
 }finally{$zip.Dispose()}
 [ordered]@{file=$archivePath;entries=$entries.Count;bytes=(Get-Item -LiteralPath $archivePath).Length;sha256=(Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash;validation='Every entry matches source SHA256'}
}
$sourceEntries=@(Get-ChildItem -LiteralPath $root -File -Recurse | ForEach-Object { $rel=$_.FullName.Substring($root.Length+1).Replace('\','/');if($rel -notmatch '^(build/|output/|OST/WAV/|OST/MP3/)'){[pscustomobject]@{source=$_.FullName;entry='BRUINS/'+$rel}} })
$audioEntries=@(Get-ChildItem -LiteralPath (Join-Path $root 'OST\MP3') -File -Filter *.mp3 | ForEach-Object { [pscustomobject]@{source=$_.FullName;entry='BRUINS_OST_MP3/'+$_.Name} })
foreach($rel in @('OST/README.md','OST/manifest.json','CREDITS.md','documentation/ost-validation.json')){$audioEntries+=[pscustomobject]@{source=(Join-Path $root $rel);entry='BRUINS_OST_MP3/'+(Split-Path $rel -Leaf)}}
$receipts=@((Write-BruinsArchive (Join-Path $parent 'BRUINS_Source.zip') $sourceEntries),(Write-BruinsArchive (Join-Path $parent 'BRUINS_OST_MP3.zip') $audioEntries))
$receipts | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $parent 'BRUINS_Deliverables.receipt.json') -Encoding UTF8
$receipts | ConvertTo-Json -Depth 4

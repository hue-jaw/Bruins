param([ValidateSet('Compile','PackageZip','PackageNsis')][string]$Action = 'Compile')
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtime='C:\ProgramData\GameMakerStudio2-LTS2026\Cache\runtimes\runtime-2026.0.0.23'
$igor=Join-Path $runtime 'bin\igor\windows\x64\Igor.exe'
$profileRoot=Join-Path $env:APPDATA 'GameMakerStudio2-LTS2026'
$license=Get-ChildItem -LiteralPath $profileRoot -Filter licence.plist -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
$profile=if($license){$license.DirectoryName}else{Join-Path $profileRoot 'unknownUser_unknownUserID'}
$output=Join-Path $root 'build'
New-Item -ItemType Directory -Path $output -Force | Out-Null
$target=if($Action -eq 'PackageNsis'){'BRUINS_Setup.exe'}else{'BRUINS_Portable_Windows.zip'}
$buildArgs=@('/project='+ (Join-Path $root 'BRUINS.yyp'),'/rp='+$runtime,'/uf='+$profile,'/cache='+(Join-Path $env:TEMP 'BRUINS-build-cache'),'/temp='+(Join-Path $env:TEMP 'BRUINS-build-temp'),'/of='+(Join-Path $output 'BRUINS'),'/tf='+(Join-Path $output $target),'--','Windows',$Action)
Push-Location $root
try { & $igor @buildArgs 2>&1 | Tee-Object -FilePath (Join-Path $output ('build-'+$Action+'.log')); $result=$LASTEXITCODE } finally { Pop-Location }
exit $result

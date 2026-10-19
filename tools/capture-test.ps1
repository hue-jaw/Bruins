param([string]$Name='menu',[string]$Keys='')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type @'
using System; using System.Runtime.InteropServices;
public class BruinsWindow {
 [StructLayout(LayoutKind.Sequential)] public struct RECT {public int Left,Top,Right,Bottom;}
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h,out RECT rect);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
}
'@
$game=Get-Process -Name Runner -ErrorAction Stop | Where-Object MainWindowHandle -NE 0 | Select-Object -First 1
[BruinsWindow]::SetForegroundWindow($game.MainWindowHandle) | Out-Null
Start-Sleep -Milliseconds 300
if($Keys -ne '') { if([BruinsWindow]::GetForegroundWindow() -ne $game.MainWindowHandle){throw 'Game window is not focused'}; [System.Windows.Forms.SendKeys]::SendWait($Keys); Start-Sleep -Milliseconds 700 }
$rect=New-Object BruinsWindow+RECT
[BruinsWindow]::GetWindowRect($game.MainWindowHandle,[ref]$rect) | Out-Null
$image=New-Object System.Drawing.Bitmap(($rect.Right-$rect.Left),($rect.Bottom-$rect.Top))
$graphics=[System.Drawing.Graphics]::FromImage($image)
$dest=Join-Path ([IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))) ('documentation\runtime-'+$Name+'.png')
try{$graphics.CopyFromScreen($rect.Left,$rect.Top,0,0,$image.Size);$image.Save($dest,[System.Drawing.Imaging.ImageFormat]::Png)}finally{$graphics.Dispose();$image.Dispose()}
Write-Output $dest

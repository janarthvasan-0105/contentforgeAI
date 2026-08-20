$ErrorActionPreference = "Stop"

$destE = "E:\ContentForge\frontend\public\frames"
$destD = "D:\ContentForge\frontend\public\frames"

New-Item -ItemType Directory -Force -Path $destE | Out-Null
New-Item -ItemType Directory -Force -Path $destD | Out-Null

$counter = 1

Write-Host "Copying frames from newframe1..."
$frames1 = Get-ChildItem -Path "E:\ContentForge\newframe1" -Filter "*.jpg" | Sort-Object Name
foreach ($f in $frames1) {
    $newName = "{0:D4}.jpg" -f $counter
    Copy-Item $f.FullName -Destination (Join-Path $destE $newName)
    Copy-Item $f.FullName -Destination (Join-Path $destD $newName)
    $counter++
}

Write-Host "Copying frames from newframe2..."
$frames2 = Get-ChildItem -Path "E:\ContentForge\newframe2" -Filter "*.jpg" | Sort-Object Name
foreach ($f in $frames2) {
    $newName = "{0:D4}.jpg" -f $counter
    Copy-Item $f.FullName -Destination (Join-Path $destE $newName)
    Copy-Item $f.FullName -Destination (Join-Path $destD $newName)
    $counter++
}

Write-Host "Total frames copied: $($counter - 1)"

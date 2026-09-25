# PowerShell script to export clean project files and create zip archive
$ErrorActionPreference = "Stop"

$source = "c:\Users\WMT CS\Downloads\employee-performance-tracker-app"
$destFolder = "c:\Users\WMT CS\Downloads\nearby-masjid-app"
$destZip = "c:\Users\WMT CS\Downloads\nearby-masjid-app.zip"

Write-Host "Cleaning previous export if exists..."
if (Test-Path -LiteralPath $destFolder) {
    Remove-Item -Recurse -Force -LiteralPath $destFolder
}
if (Test-Path -LiteralPath $destZip) {
    Remove-Item -Force -LiteralPath $destZip
}

New-Item -ItemType Directory -Path $destFolder -Force | Out-Null

$excludeDirs = @("node_modules", ".next", ".git", ".vercel")
$excludeFiles = @("tsconfig.tsbuildinfo", ".workpulse-local-data.json")

Write-Host "Copying project files with LiteralPath support..."
Get-ChildItem -LiteralPath $source -Recurse | ForEach-Object {
    $item = $_
    $relPath = $item.FullName.Substring($source.Length).TrimStart("\", "/")
    
    $skip = $false
    foreach ($ex in $excludeDirs) {
        if ($relPath -eq $ex -or $relPath.StartsWith($ex + "\") -or $relPath.StartsWith($ex + "/")) {
            $skip = $true
            break
        }
    }
    foreach ($exFile in $excludeFiles) {
        if ($item.Name -eq $exFile) {
            $skip = $true
            break
        }
    }
    
    if (-not $skip) {
        $target = Join-Path $destFolder $relPath
        if ($item.PSIsContainer) {
            if (-not (Test-Path -LiteralPath $target)) {
                New-Item -ItemType Directory -Path $target -Force | Out-Null
            }
        } else {
            $parent = Split-Path $target -Parent
            if (-not (Test-Path -LiteralPath $parent)) {
                New-Item -ItemType Directory -Path $parent -Force | Out-Null
            }
            Copy-Item -LiteralPath $item.FullName -Destination $target -Force
        }
    }
}

Write-Host "Creating ZIP archive at $destZip..."
Compress-Archive -Path "$destFolder\*" -DestinationPath $destZip -Force

# Also copy a backup zip inside workspace for convenience
$localZip = Join-Path $source "nearby-masjid-app.zip"
Copy-Item -LiteralPath $destZip -Destination $localZip -Force

$zipItem = Get-Item -LiteralPath $destZip
$folderCount = (Get-ChildItem -LiteralPath $destFolder -Recurse | Measure-Object).Count

Write-Host "========================================="
Write-Host "EXPORT SUCCESSFUL!"
Write-Host "Folder Path: $destFolder"
Write-Host "Zip File:    $destZip"
Write-Host "Zip Size:    $([math]::Round($zipItem.Length / 1MB, 2)) MB"
Write-Host "Total Files: $folderCount"
Write-Host "========================================="

param(
    [ValidateRange(1024, 65535)][int]$Port = 8000,
    [switch]$SkipBuild
)
& (Join-Path $PSScriptRoot 'web\start.ps1') -Port $Port -SkipBuild:$SkipBuild

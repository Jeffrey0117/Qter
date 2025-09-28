# PowerShell script to fix HTML entity issue
$content = Get-Content "frontend/src/pages/fill/FormFill.tsx" -Raw -Encoding UTF8
$fixed = $content -replace '&gt;', '>'
Set-Content "frontend/src/pages/fill/FormFill.tsx" $fixed -Encoding UTF8 -NoNewline
Write-Host "File fixed successfully!"
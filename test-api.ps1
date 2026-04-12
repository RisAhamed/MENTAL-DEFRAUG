Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "cd /d C:\Users\riswa\Desktop\Mental Fatigue\mental-defrag && npm run dev" -NoNewWindow -WindowStyle Hidden
Start-Sleep -Seconds 15
try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/defrag" -Method POST -ContentType "application/json" -Body '{"input": "I just spent 2 hours coding"}' -ErrorAction Stop
    Write-Host "SUCCESS:"
    $result | ConvertTo-Json
} catch {
    Write-Host "ERROR:" $_.Exception.Message
}
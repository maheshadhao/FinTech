$ErrorActionPreference = "Stop"

Write-Host "Verifying Portfolio History Endpoint..."

try {
    Write-Host "Attempting Login..."
    $headers = @{ "Content-Type" = "application/json" }
    $loginBody = '{"accountNumber":"0888969441","password":"admin123"}'
    
    $resLogin = Invoke-WebRequest -Uri "http://localhost:8080/login" -Method POST -Body $loginBody -Headers $headers -SessionVariable session -UseBasicParsing
    
    if ($resLogin.StatusCode -eq 200) {
        Write-Host "✅ Login Success (200)"
    } else {
        Write-Host "❌ Login Failed ($($resLogin.StatusCode))"
        exit 1
    }

    Write-Host "`nChecking /api/portfolio/history (GET)..."
    try {
        $resGet = Invoke-WebRequest -Uri "http://localhost:8080/api/portfolio/history" -Method GET -WebSession $session -UseBasicParsing
        if ($resGet.StatusCode -eq 200) {
           Write-Host "✅ /api/portfolio/history GET Endpoint Exists (200)"
           Write-Host "Response Body:"
           Write-Host $resGet.Content
        } else {
           Write-Host "❌ /api/portfolio/history GET Failed ($($resGet.StatusCode))"
        }
    } catch {
       Write-Host "❌ Request Failed: $_"
       if ($_.Exception.Response) {
           $msg = $_.Exception.Response.StatusCode
           Write-Host "   Status Code: $msg"
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
            Write-Host "   Body: $body"
       }
    }

} catch {
    Write-Host "❌ Script Failed: $_"
}

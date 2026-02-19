$ErrorActionPreference = "Stop"

Write-Host "Verifying Backend Endpoints..."

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

    Write-Host "`nChecking /api/balance (GET)..."
    $resGet = Invoke-WebRequest -Uri "http://localhost:8080/api/balance" -Method GET -WebSession $session -UseBasicParsing
    if ($resGet.StatusCode -eq 200) {
        Write-Host "✅ /api/balance GET Endpoint Exists (200)"
    } else {
        Write-Host "❌ /api/balance GET Failed ($($resGet.StatusCode))"
    }

    Write-Host "`nChecking /api/balance (POST)..."
    $resPost = Invoke-WebRequest -Uri "http://localhost:8080/api/balance" -Method POST -WebSession $session -UseBasicParsing
    if ($resPost.StatusCode -eq 200) {
        Write-Host "✅ /api/balance POST Endpoint Exists (200)"
    } else {
        Write-Host "❌ /api/balance POST Failed ($($resPost.StatusCode))"
    }

} catch {
    Write-Host "❌ Request Failed: $_"
    if ($_.Exception.Response) {
        $msg = $_.Exception.Response.StatusCode
        Write-Host "   Status Code: $msg"
    }
}

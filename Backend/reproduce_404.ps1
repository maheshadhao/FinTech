$headers = @{ "Content-Type" = "application/json" }
$body = Get-Content "test_login.json" -Raw

try {
    Write-Host "Logging in..."
    $response = Invoke-WebRequest -Uri "http://localhost:8080/login" -Method POST -Body $body -Headers $headers -SessionVariable session -UseBasicParsing
    Write-Host "Login Status: $($response.StatusCode)"
} catch {
    Write-Host "Login Failed: $_"
    exit
}

Write-Host "Testing GET /api/balance..."
try {
    $r1 = Invoke-WebRequest -Uri "http://localhost:8080/api/balance" -Method GET -WebSession $session -UseBasicParsing
    Write-Host "GET /api/balance: $($r1.StatusCode)"
} catch {
    # 404 or 405
    Write-Host "GET /api/balance Failed: $($_.ToString())"
}

Write-Host "Testing POST /api/balance..."
try {
    $r2 = Invoke-WebRequest -Uri "http://localhost:8080/api/balance" -Method POST -WebSession $session -UseBasicParsing
    Write-Host "POST /api/balance: $($r2.StatusCode)"
} catch {
    Write-Host "POST /api/balance Failed: $($_.ToString())"
}

Write-Host "Testing GET /api/account/balance..."
try {
    $r3 = Invoke-WebRequest -Uri "http://localhost:8080/api/account/balance" -Method GET -WebSession $session
    Write-Host "GET /api/account/balance: $($r3.StatusCode)"
} catch {
    Write-Host "GET /api/account/balance Failed: $($_.ToString())"
}

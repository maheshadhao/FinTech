$headers = @{ "Content-Type" = "application/json" }
$loginBody = '{"accountNumber":"0888969441","password":"admin123"}'
$transferBody = Get-Content "test_fail.json" -Raw

try {
    Write-Host "Logging in..."
    $response = Invoke-WebRequest -Uri "http://localhost:8080/login" -Method POST -Body $loginBody -Headers $headers -SessionVariable session
    Write-Host "Login Status: $($response.StatusCode)"
} catch {
    Write-Host "Login Failed: $_"
    exit
}

Write-Host "Attempting Transfer..."
try {
    $r1 = Invoke-WebRequest -Uri "http://localhost:8080/api/transfer" -Method POST -Body $transferBody -WebSession $session -Headers $headers
    Write-Host "Transfer Status: $($r1.StatusCode)"
    Write-Host "Response: $($r1.Content)"
} catch {
    Write-Host "Transfer Failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
        $errBody = $reader.ReadToEnd()
        Write-Host "Error Body: $errBody"
    }
}

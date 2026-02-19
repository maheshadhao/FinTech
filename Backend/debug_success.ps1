$ErrorActionPreference = "Stop"
try {
    $h = @{ "Content-Type" = "application/json" }
    $loginBody = '{"accountNumber":"0888969441","password":"admin123"}'
    Write-Host "Logging in as 0888969441..."
    $res = Invoke-WebRequest "http://localhost:8080/login" -Method POST -Body $loginBody -Headers $h -SessionVariable sess
    Write-Host "Login: $($res.StatusCode)"
} catch {
    Write-Host "Login Failed: $_"
    exit 1
}

try {
    $transferBody = Get-Content "test_success.json" -Raw
    Write-Host "Transferring 10 to 0458530329..."
    $res2 = Invoke-WebRequest "http://localhost:8080/api/transfer" -Method POST -Body $transferBody -WebSession $sess -Headers $h
    Write-Host "Transfer: $($res2.StatusCode)"
    Write-Host "Response: $($res2.Content)"
} catch {
    if ($_.Exception.Response) {
        Write-Host "Transfer Failed Code: $($_.Exception.Response.StatusCode)"
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Transfer Failed Body: $body"
    } else {
        Write-Host "Transfer Failed: $_"
    }
}

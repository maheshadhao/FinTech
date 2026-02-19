$ErrorActionPreference = "Stop"

Write-Host "Verifying Trading Statement PDF Endpoint..."

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

    Write-Host "`nDownloading Trading Statement PDF..."
    try {
        $resPdf = Invoke-WebRequest -Uri "http://localhost:8080/api/statements/trading" -Method GET -WebSession $session -UseBasicParsing -OutFile "trading_statement.pdf"
        
        if (Test-Path "trading_statement.pdf") {
            $fileSize = (Get-Item "trading_statement.pdf").Length
            Write-Host "✅ PDF Downloaded Successfully"
            Write-Host "   File Size: $fileSize bytes"
            
            if ($fileSize -gt 0) {
                Write-Host "✅ PDF file is not empty"
            } else {
                Write-Host "❌ PDF file is empty"
            }
        } else {
            Write-Host "❌ PDF file not created"
        }
    } catch {
       Write-Host "❌ Request Failed: $_"
       if ($_.Exception.Response) {
           $msg = $_.Exception.Response.StatusCode
           Write-Host "   Status Code: $msg"
       }
    }

} catch {
    Write-Host "❌ Script Failed: $_"
}

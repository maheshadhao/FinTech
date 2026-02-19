$ErrorActionPreference = "Stop"

Write-Host "Testing Trading Statement PDF Endpoint (Detailed)..."

try {
    Write-Host "`n1. Attempting Login..."
    $headers = @{ "Content-Type" = "application/json" }
    $loginBody = '{"accountNumber":"0888969441","password":"admin123"}'
    
    $resLogin = Invoke-WebRequest -Uri "http://localhost:8080/login" -Method POST -Body $loginBody -Headers $headers -SessionVariable session -UseBasicParsing
    
    if ($resLogin.StatusCode -eq 200) {
        Write-Host "   ✅ Login Success (200)"
    } else {
        Write-Host "   ❌ Login Failed ($($resLogin.StatusCode))"
        exit 1
    }

    Write-Host "`n2. Calling Trading Statement Endpoint..."
    $uri = "http://localhost:8080/api/statements/trading"
    Write-Host "   URI: $uri"
    
    try {
        $response = Invoke-WebRequest -Uri $uri -Method GET -WebSession $session -UseBasicParsing
        
        Write-Host "   ✅ Response Status: $($response.StatusCode)"
        Write-Host "   Content-Type: $($response.Headers['Content-Type'])"
        Write-Host "   Content-Length: $($response.RawContentLength) bytes"
        
        # Save the PDF
        $outputFile = "trading_statement_test.pdf"
        [System.IO.File]::WriteAllBytes($outputFile, $response.Content)
        
        if (Test-Path $outputFile) {
            $fileInfo = Get-Item $outputFile
            Write-Host "`n3. PDF File Created:"
            Write-Host "   File: $($fileInfo.Name)"
            Write-Host "   Size: $($fileInfo.Length) bytes"
            Write-Host "   Path: $($fileInfo.FullName)"
            
            # Check PDF header
            $bytes = [System.IO.File]::ReadAllBytes($outputFile)
            $header = [System.Text.Encoding]::ASCII.GetString($bytes[0..4])
            Write-Host "   PDF Header: $header"
            
            if ($header -eq "%PDF-") {
                Write-Host "   ✅ Valid PDF header detected"
            } else {
                Write-Host "   ❌ Invalid PDF header: Expected '%PDF-', got '$header'"
            }
        }
        
    } catch {
        Write-Host "   ❌ Request Failed: $_"
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "   Status Code: $statusCode"
            
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Response Body: $responseBody"
        }
    }

} catch {
    Write-Host "`n❌ Script Failed: $_"
    Write-Host $_.ScriptStackTrace
}

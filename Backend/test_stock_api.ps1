$baseUrl = "http://localhost:8080/api"

function Test-Endpoint {
    param($method, $url, $body = $null)
    Write-Host "Testing $method $url..." -NoNewline
    try {
        if ($body) {
            $response = Invoke-RestMethod -Method $method -Uri "$baseUrl$url" -Body ($body | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Method $method -Uri "$baseUrl$url" -ErrorAction Stop
        }
        Write-Host " [OK]" -ForegroundColor Green
        return $response
    } catch {
        Write-Host " [FAILED]" -ForegroundColor Red
        Write-Host $_.Exception.Message
        if ($_.Exception.Response) {
             # Write-Host $_.Exception.Response.StatusCode
        }
        return $null
    }
}

# 1. Test Stock Data
Test-Endpoint "GET" "/stocks/AAPL"
Test-Endpoint "GET" "/stocks/AAPL/history?period=7d"

# 2. Test Portfolio (Buy)
$buyPayload = @{ symbol = "AAPL"; quantity = 10 }
Test-Endpoint "POST" "/portfolio/buy" $buyPayload

# 3. Test Portfolio (Summary)
Test-Endpoint "GET" "/portfolio"

# 4. Test Alerts
$alertPayload = @{ stockSymbol = "AAPL"; targetPrice = 140.00; condition = "BELOW" }
Test-Endpoint "POST" "/alerts" $alertPayload
Test-Endpoint "GET" "/alerts"

# 5. Test Metrics
Test-Endpoint "GET" "/metrics/latency"

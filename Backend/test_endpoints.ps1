$baseUrl = "http://localhost:8080"
$endpoints = @(
    "/login",
    "/loggedin_user",
    "/api/transfer",
    "/api/transactions",
    "/api/balance",
    "/api/search-user",
    "/api/deposit",
    "/api/chat",
    "/createAccount"
)

foreach ($endpoint in $endpoints) {
    Write-Host "Testing $baseUrl$endpoint ..."
    try {
        $resp = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method Options -ErrorAction Stop
        Write-Host "  Success (OPTIONS reachable)"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "  FAILED: 404 Not Found" -ForegroundColor Red
        } else {
            Write-Host "  Status: $($_.Exception.Response.StatusCode)"
        }
    }
}

$baseUrl = "http://localhost:8080"
$loginBody = @{
    accountNumber = "0888969441"
    password = "admin123"
} | ConvertTo-Json

Write-Host ">>> Attempting Login..."
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $loginBody -ContentType "application/json" -SessionVariable sess
Write-Host "Login Response: $($loginResponse | ConvertTo-Json -Compress)"

Write-Host "`n>>> Fetching Logged-in User Info with Session..."
try {
    $userResponse = Invoke-RestMethod -Uri "$baseUrl/loggedin_user" -Method Get -WebSession $sess
    Write-Host "User Info: $($userResponse | ConvertTo-Json -Compress)"
} catch {
    Write-Host "ERROR: Fetching user info failed with status: $($_.Exception.Response.StatusCode)"
    $_.Exception.Response.GetResponseStream() | %{ (New-Object System.IO.StreamReader($_)).ReadToEnd() }
}

Write-Host "`n>>> Fetching Transactions with Session..."
try {
    $txResponse = Invoke-RestMethod -Uri "$baseUrl/api/transactions" -Method Get -WebSession $sess
    Write-Host "Transactions fetched successfully: $($txResponse.Count) items found."
} catch {
    Write-Host "ERROR: Fetching transactions failed with status: $($_.Exception.Response.StatusCode)"
    $_.Exception.Response.GetResponseStream() | %{ (New-Object System.IO.StreamReader($_)).ReadToEnd() }
}

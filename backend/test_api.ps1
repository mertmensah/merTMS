# Test TMS API Endpoints

Write-Host "=" * 60
Write-Host "🚛 TMS API Test Suite"
Write-Host "=" * 60
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing
Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
Write-Host ""

# Test 2: Get All Orders
Write-Host "Test 2: Get All Orders" -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/orders" -UseBasicParsing
$orders = ($response.Content | ConvertFrom-Json).orders
Write-Host "✅ Found $($orders.Count) orders" -ForegroundColor Green
Write-Host "Sample: $($orders[0].order_number) - $($orders[0].origin) to $($orders[0].destination)"
Write-Host ""

# Test 3: Load Optimization
Write-Host "Test 3: AI Load Optimization (Gemini AI)" -ForegroundColor Cyan
$body = @{} | ConvertTo-Json
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/loads/optimize" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 30
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Optimization complete!" -ForegroundColor Green
    Write-Host "   Orders: $($result.summary.total_orders)"
    Write-Host "   Loads: $($result.summary.total_loads)"
    Write-Host "   Avg Utilization: $($result.summary.avg_utilization)%"
    Write-Host "   Cost Savings: $($result.summary.cost_savings_percent)%"
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=" * 60
Write-Host "✅ API Testing Complete!"
Write-Host "=" * 60

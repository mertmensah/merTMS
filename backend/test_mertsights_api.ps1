# Test MertsightsAI Intent Classification via API
# Tests conversational vs data query detection

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "  MERTSIGHTS AI INTENT CLASSIFICATION TEST" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000/api/mertsights/query"

# Test cases
$tests = @(
    @{ Question = "Hello!"; Expected = "conversational" },
    @{ Question = "Thanks!"; Expected = "conversational" },
    @{ Question = "What can you do?"; Expected = "conversational" },
    @{ Question = "How many orders do we have?"; Expected = "data_query" },
    @{ Question = "Show me all pending loads"; Expected = "data_query" },
    @{ Question = "Goodbye"; Expected = "conversational" }
)

$passed = 0
$total = $tests.Count

foreach ($test in $tests) {
    $question = $test.Question
    $expected = $test.Expected
    
    Write-Host "Testing: $question" -ForegroundColor Yellow
    
    $body = @{
        question = $question
        conversation_history = @()
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        
        if ($response.success) {
            if ($response.conversational) {
                $actual = "conversational"
                Write-Host "  ✓ CONVERSATIONAL" -ForegroundColor Green
                Write-Host "  Response: $($response.response.Substring(0, [Math]::Min(80, $response.response.Length)))..." -ForegroundColor Gray
            } else {
                $actual = "data_query"
                Write-Host "  ✓ DATA QUERY" -ForegroundColor Green
                Write-Host "  SQL Generated: $($response.sql.Substring(0, [Math]::Min(80, $response.sql.Length)))..." -ForegroundColor Gray
            }
            
            if ($actual -eq $expected) {
                Write-Host "  ✅ PASS - Classification correct" -ForegroundColor Green
                $passed++
            } else {
                Write-Host "  ❌ FAIL - Expected $expected, got $actual" -ForegroundColor Red
            }
        } else {
            Write-Host "  ❌ ERROR: $($response.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ API ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "  RESULTS: $passed/$total PASSED ($([math]::Round($passed/$total*100, 1))%)" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })
Write-Host "===============================================`n" -ForegroundColor Cyan

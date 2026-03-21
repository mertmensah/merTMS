# Control Tower Setup Instructions

## Overview
Updated Control Tower to filter by customer expected delivery date and show risk assessment based on estimated delivery date.

## Step 1: Add Database Columns

**Open your Supabase SQL Editor and run this SQL:**

Location: `backend/database/RUN_IN_SUPABASE_SQL_EDITOR.sql`

```sql
-- Add estimated_delivery_date column to loads table
ALTER TABLE loads 
ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;

-- Add customer_expected_delivery_date column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_expected_delivery_date DATE;

-- Populate customer_expected_delivery_date from existing delivery_window_end
UPDATE orders 
SET customer_expected_delivery_date = delivery_window_end::DATE 
WHERE customer_expected_delivery_date IS NULL 
  AND delivery_window_end IS NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_loads_estimated_delivery_date 
ON loads(estimated_delivery_date);

CREATE INDEX IF NOT EXISTS idx_orders_customer_expected_delivery_date 
ON orders(customer_expected_delivery_date);
```

## Step 2: Seed Test Data

After the SQL migration is applied, run this command to create 8 test loads:

```powershell
cd C:\Users\MertMM\Desktop\MerTM.S\TMS-Project\backend
C:\Users\MertMM\anaconda3\envs\streamlitenv\python.exe seed_control_tower_loads.py
```

This will create:
- **3 loads** - Status: "Delivered" (completed today)
- **3 loads** - Status: "In Transit" with estimated_delivery_date = today (on time)
- **2 loads** - Status: "In Transit" with estimated_delivery_date = tomorrow (AT RISK ⚠️)

All loads will have:
- `customer_expected_delivery_date` = today (2025-11-29)
- Load numbers: CT-001 through CT-008
- 5 orders each (40 total orders)

## Step 3: Updated Control Tower Logic

The Control Tower now:

1. **Filters loads** where any order has `customer_expected_delivery_date` = today
2. **Assesses risk** by comparing `estimated_delivery_date` to today:
   - `isAtRisk = true` if estimated > today (will be late)
   - `isLate = true` if estimated < today or null
3. **Categorizes loads**:
   - ✅ **Delivered**: Status = "Delivered" 
   - 🚛 **On Time**: Status = "In Transit" AND not at risk AND not late
   - ⚠️ **Past Due/At Risk**: Any load that is at risk, late, or in Planning/Delayed status

## Step 4: Test in Control Tower

Navigate to Control Tower page and you should see:

### Delivered Bucket (3 loads)
- CT-XXX (Delivered today)
- Shows: Load number, truck type, stops, weight/utilization
- Shows: "Delivered: 2025-11-29"

### On Time/In Transit Bucket (3 loads)
- CT-XXX (In Transit, estimated delivery = today)
- Shows: Load number, truck type, stops, weight/utilization
- Shows: "Est. Delivery: 2025-11-29" in green

### Past Due/At Risk Bucket (2 loads)
- CT-XXX (In Transit but estimated = tomorrow)
- Badge shows: "At Risk" instead of "Past Due"
- Shows: "⚠️ Est: 2025-11-30 (Expected Today)" in red and bold
- These are the critical loads that need attention!

## New Database Schema

### Loads Table
- Added: `estimated_delivery_date` (DATE) - When the load is estimated to deliver
- Indexed for fast filtering

### Orders Table  
- Added: `customer_expected_delivery_date` (DATE) - When customer expects delivery
- Populated from existing `delivery_window_end` field
- Indexed for fast filtering

## Risk Assessment Logic

```javascript
// In Control Tower fetchTodayDeliveries()
const estimatedDate = load.estimated_delivery_date?.split('T')[0]
load.isAtRisk = estimatedDate && estimatedDate > today  // Will be late
load.isLate = load.status !== 'Delivered' && (!estimatedDate || estimatedDate < today)  // Already late
```

## Troubleshooting

If you don't see any loads:
1. Verify SQL migration ran successfully in Supabase
2. Check that seed script completed without errors
3. Open browser console and check for API errors
4. Verify today's date is 2025-11-29 (or update seed script)

If loads appear but no risk indicators:
1. Check that `estimated_delivery_date` column exists in loads table
2. Check that loads have `estimated_delivery_date` values set
3. Verify orders have `customer_expected_delivery_date` set to today

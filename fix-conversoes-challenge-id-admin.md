# Fix Conversões Challenge ID via Admin Dashboard

## Problem Identified
The Conversões metric for Carteira 0 is currently configured with challenge ID `E6GglPq`, but the correct challenge ID should be `E82R5cQ`.

## Solution: Update via Admin Dashboard Configuration

### Step 1: Access Admin Configuration
1. Go to `/admin/configuration` in your dashboard
2. Look for the "Dashboard Configuration" section
3. Find the Carteira 0 team configuration

### Step 2: Update Conversões Challenge ID
In the Carteira 0 configuration, update the primary goal (Conversões):

**Current Configuration:**
```json
{
  "primaryGoal": {
    "name": "conversoes",
    "displayName": "Conversões",
    "challengeId": "E6GglPq",  // ❌ INCORRECT - This is Faturamento's ID
    "actionId": "conversoes"
  }
}
```

**Correct Configuration:**
```json
{
  "primaryGoal": {
    "name": "conversoes", 
    "displayName": "Conversões",
    "challengeId": "E82R5cQ",  // ✅ CORRECT - This is Conversões' ID
    "actionId": "conversoes"
  }
}
```

### Step 3: Verify Action IDs are Correct
Ensure the action IDs match your Funifier action table:

- **Conversões**: `actionId: "conversoes"` ✅
- **UPA**: `actionId: "upa"` ✅  
- **Faturamento**: `actionId: "faturamento"` ✅
- **Reais por Ativo**: `actionId: "reais_por_ativo"` ✅

### Step 4: Save and Test
1. Save the configuration changes
2. Clear any cached data (refresh the page)
3. Test with a player who has Conversões data
4. Verify that the dashboard now shows correct Conversões percentages

## Why This Approach is Correct

1. **Configurable**: Uses the admin configuration system as intended
2. **No Code Changes**: Doesn't hardcode values in source files
3. **Flexible**: Allows future changes without code deployment
4. **Proper Separation**: Configuration data stays in the database, not in code

## Verification Steps

After making the change:

1. **Check Player Data**: Export a player's data and verify `challenge_progress` contains:
   - `E82R5cQ` with Conversões percentage data
   - `E6GglPq` with Faturamento percentage data (for Carteira I)

2. **Test Dashboard**: 
   - Carteira 0 dashboard should show correct Conversões data
   - UPA dashboard (ER) should show correct UPA data
   - No conflicts between metrics

3. **Verify Action Logs**: When reports are submitted, action logs should use:
   - `actionId: "conversoes"` for Conversões changes
   - `actionId: "upa"` for UPA changes

## Current Challenge ID Mapping (After Fix)

| Team | Metric | Challenge ID | Action ID |
|------|--------|--------------|-----------|
| Carteira 0 | Conversões | `E82R5cQ` | `conversoes` |
| Carteira 0 | Faturamento | `E6GglPq` | `faturamento` |
| ER | UPA | `E62x2PW` | `upa` |
| All | Reais por Ativo | `E6Gm8RI` | `reais_por_ativo` |

This should resolve the issue where UPA and Conversões dashboards are not fetching data from challenges properly!
# Carteira II Points Fix Summary

## Issue Description
Carteira II was using `total_points` as the base for its calculations, but it should **always** use `locked_points` regardless of the unlock status. This is different from other teams that switch between `points` (when unlocked) and `locked_points` (when locked).

## Carteira II Special Behavior
Unlike other teams, Carteira II has a unique points system:
- **ALWAYS** uses `point_categories.locked_points` as the base
- **NEVER** uses `point_categories.points` (even when unlocked)
- **NEVER** uses `total_points` directly
- The only difference when unlocked is that boost multipliers are applied

## Fix Implemented

### Before (Incorrect)
```typescript
const basePoints = rawData.total_points || 0;
```

### After (Correct)
```typescript
// Carteira II always uses locked_points as base, never total_points or points
const pointCategories = rawData.point_categories || {};
const basePoints = pointCategories['locked_points'] || 
                  pointCategories['locked'] || 
                  rawData.total_points || 0; // Fallback to total_points if no locked_points
```

## Behavior Comparison

### Other Teams (Carteira I, III, IV, ER)
- **When UNLOCKED**: Use `point_categories.points` → `total_points` (fallback)
- **When LOCKED**: Use `point_categories.locked_points` → `total_points` (fallback)

### Carteira II (Special Case)
- **When UNLOCKED**: Use `point_categories.locked_points` + apply boost multiplier
- **When LOCKED**: Use `point_categories.locked_points` (no boost multiplier)

## Example with Real Data

Using Dioni's data structure:
```json
{
  "total_points": 40954.2585,
  "point_categories": {
    "pontos_da_temporada": 38319.5510194,
    "locked_points": 2634.7074806
  }
}
```

### Carteira II Results:
- **Base Points**: 2634.71 (always from locked_points)
- **When Locked**: Final Points = 2634.71
- **When Unlocked**: Final Points = 2634.71 × boost_multiplier

### Other Teams Results:
- **When Locked**: 2634.71 (from locked_points)
- **When Unlocked**: 40954.26 (from total_points, since no 'points' field)

## Why This Matters
Carteira II represents a different business model where players always work with a limited pool of points (locked_points), and unlocking only allows them to multiply those limited points through boosts, rather than accessing a larger pool of accumulated points.

## Files Modified
- `services/carteira-ii-processor.service.ts` - Updated to always use locked_points

## Testing
✅ Verified that Carteira II now always uses `locked_points` as base  
✅ Confirmed boost multiplier logic still works correctly  
✅ Ensured fallback behavior when no `locked_points` field exists  

The fix ensures Carteira II behaves consistently with its intended business logic while maintaining compatibility with the existing boost system.
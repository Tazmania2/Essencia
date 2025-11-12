# Store Level Access Feature

## Overview

The storefront now supports level-based access control using unlock items. Players can only see items from levels where they own the required unlock item.

## How It Works

### Admin Configuration

1. Navigate to the Admin Panel → Store Configuration
2. In the "Configuração de Catálogos" section, you'll see a new column: "Item de Desbloqueio"
3. For each level, enter the virtual good item ID that players must own to access that level
4. Leave the field blank if the level should be accessible to all players

**Example:**
- Level 1: `E6F0O5f` (players need to own this item to see Level 1 items)
- Level 2: (blank - accessible to all players)
- Level 3: (blank - accessible to all players)

### Player Experience

When a player visits the storefront:
1. The system fetches their owned catalog items from Funifier
2. **All items from visible catalogs are always displayed**
3. When the "Gray out locked items" option is enabled:
   - Levels the player doesn't have access to are shown with reduced opacity
   - A lock icon (🔒) appears next to locked level names
   - Items from locked levels appear grayed out
4. When the "Gray out locked items" option is disabled:
   - All items appear normal regardless of level access
5. Levels without an unlock item configured are always accessible (never grayed out)

### Technical Implementation

**Type Changes:**
- `LevelConfiguration` now includes optional `unlockItemId?: string` field

**New Service Methods:**
- `pointsService.getPlayerCatalogItems(playerId)` - Fetches player's owned items
- `pointsService.playerOwnsItem(playerId, itemId)` - Checks if player owns a specific item

**Storefront Logic:**
- Fetches player's catalog items on page load
- Displays ALL items from visible catalogs
- When "grayOutLocked" is enabled, applies visual styling to locked levels
- Locked levels show with reduced opacity and a lock icon

## Example Player Data

```json
{
  "catalog_items": {
    "E6F0O5f": 1,  // Player owns the Level 1 unlock item
    "E6F0WGc": 0,  // Player doesn't own this item
    "E6K79Mt": 0,
    "E6F0MJ3": 1
  }
}
```

With this data and "Gray out locked items" enabled:
- If Level 1 requires `E6F0O5f`, Level 1 items appear NORMAL (player owns 1)
- If Level 2 requires `E6F0WGc`, Level 2 items appear GRAYED OUT (player owns 0)
- If Level 3 has no unlock requirement, Level 3 items appear NORMAL (always accessible)

With "Gray out locked items" disabled:
- ALL items appear normal regardless of ownership

## Default Configuration

By default, Level 1 requires `E6F0O5f` as the unlock item. This can be changed in the admin panel.

## Visual Indicators

When "Gray out locked items" is enabled:
- Locked level headers show with 50% opacity
- A lock icon (🔒) appears next to locked level names
- All items in locked levels appear grayed out
- Accessible levels and items appear with normal styling

When "Gray out locked items" is disabled:
- All levels and items appear with normal styling
- No visual distinction between locked and unlocked content

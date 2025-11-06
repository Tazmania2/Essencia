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
2. For each level with an unlock item configured:
   - If the player owns the unlock item (quantity > 0), they can see items from that level
   - If the player doesn't own the unlock item, items from that level are hidden
3. Levels without an unlock item configured are always visible

### Technical Implementation

**Type Changes:**
- `LevelConfiguration` now includes optional `unlockItemId?: string` field

**New Service Methods:**
- `pointsService.getPlayerCatalogItems(playerId)` - Fetches player's owned items
- `pointsService.playerOwnsItem(playerId, itemId)` - Checks if player owns a specific item

**Storefront Logic:**
- Fetches player's catalog items on page load
- Filters levels based on unlock item ownership
- Only displays items from accessible levels

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

With this data:
- If Level 1 requires `E6F0O5f`, the player CAN access Level 1 (owns 1)
- If Level 2 requires `E6F0WGc`, the player CANNOT access Level 2 (owns 0)
- If Level 3 has no unlock requirement, the player CAN access Level 3

## Default Configuration

By default, Level 1 requires `E6F0O5f` as the unlock item. This can be changed in the admin panel.

## Logging

The storefront logs level access checks for debugging:
- `✅ Level X has no unlock requirement` - Level is always accessible
- `✅ Player has access to level X - owns [itemId]` - Player owns the unlock item
- `🔒 Player does NOT have access to level X - missing [itemId]` - Player lacks the unlock item

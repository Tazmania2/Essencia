# Store Multi-Currency Implementation

## Overview
Updated the storefront to support multiple currencies, with each level using its own specific currency instead of a single global currency for the entire store.

## Changes Made

### 1. Type Definitions (`types/index.ts`)

**Updated `LevelConfiguration` interface:**
- Added `currencyId: string` - Currency ID for this level (e.g., 'coins', 'gold', 'plat')
- Added `currencyName: string` - Display name for the currency (e.g., 'Moedas', 'Ouro', 'Platina')

**Updated `StoreConfiguration` interface:**
- Removed global `currencyId` and `currencyName` fields
- Currency configuration is now per-level

**Updated `DEFAULT_STORE_CONFIG`:**
- Level 1: `coins` / 'Moedas'
- Level 2: `gold` / 'Ouro'
- Level 3: `plat` / 'Platina'

### 2. Store Service (`services/store.service.ts`)

**Updated validation:**
- Removed global currency validation
- Added per-level currency validation (currencyId and currencyName required for each level)

**Updated configuration methods:**
- Removed global currency handling
- Configuration now only manages grayOutLocked and levels array

### 3. Storefront Page (`app/store/page.tsx`)

**State Management:**
- Changed `playerBalance` (single number) to `playerBalances` (Record<string, number>)
- Now tracks balances for all currencies used in visible levels

**Data Fetching:**
- Fetches balances for all unique currencies from visible levels
- Handles multiple currency fetches in parallel

**Filtering Logic:**
- Updated to filter items by level-specific currency
- Each level's items are filtered by that level's configured currency
- Items are grouped by catalog with proper currency association

**Header Display:**
- Shows all three currency balances at the top
- Each currency displays with a unique emoji:
  - Level 1 (coins): 💰
  - Level 2 (gold): 🥇
  - Level 3 (plat): 💎
- Responsive layout with flex-wrap for mobile

### 4. Item Grid Component (`components/store/ItemGrid.tsx`)

**Props Update:**
- Removed global `currencyName` prop
- Now uses `level.currencyName` from level configuration

**Item Rendering:**
- Each item card receives the currency name from its level configuration
- Proper currency display per level

### 5. Admin Configuration Panel (`components/admin/StoreConfigPanel.tsx`)

**UI Updates:**
- Removed global currency configuration section
- Added per-level currency configuration in the catalog table
- New columns:
  - **Moeda**: Dropdown to select currency ID (coins, gold, plat, etc.)
  - **Nome da Moeda**: Text input for display name (Moedas, Ouro, Platina, etc.)

**Configuration Management:**
- Removed `handleCurrencyChange` and `handleCurrencyNameChange` functions
- Currency changes now handled through `handleLevelChange` for each level
- Default currency for new levels: 'coins' / 'Moedas'

## Configuration Example

```json
{
  "grayOutLocked": false,
  "levels": [
    {
      "catalogId": "loja_de_recompensas",
      "levelNumber": 1,
      "levelName": "Nível 1",
      "visible": true,
      "unlockItemId": "E6F0O5f",
      "currencyId": "coins",
      "currencyName": "Moedas"
    },
    {
      "catalogId": "loja_de_recompensas_2",
      "levelNumber": 2,
      "levelName": "Nível 2",
      "visible": true,
      "currencyId": "gold",
      "currencyName": "Ouro"
    },
    {
      "catalogId": "loja_de_recompensas_3",
      "levelNumber": 3,
      "levelName": "Nível 3",
      "visible": true,
      "currencyId": "plat",
      "currencyName": "Platina"
    }
  ]
}
```

## User Experience

### Player View
1. **Header**: Shows all three currency balances simultaneously
2. **Level 1 Items**: Filtered by 'coins' currency, prices shown in Moedas
3. **Level 2 Items**: Filtered by 'gold' currency, prices shown in Ouro
4. **Level 3 Items**: Filtered by 'plat' currency, prices shown in Platina

### Admin Configuration
1. Navigate to Admin Dashboard → Store Configuration
2. For each level, configure:
   - Level number and name
   - Catalog ID (auto-populated)
   - Currency ID (dropdown: coins, gold, plat, etc.)
   - Currency display name (text input)
   - Unlock item ID (optional)
   - Visibility toggle
3. Save configuration

## Benefits

1. **Flexibility**: Each level can use a different currency
2. **Progression**: Players can earn different currencies for different level tiers
3. **Clarity**: Players see all their currency balances at once
4. **Admin Control**: Easy configuration per level through admin panel
5. **Scalability**: Easy to add more currencies or levels in the future

## Migration Notes

- Existing configurations with global `currencyId` and `currencyName` will need to be migrated
- The system will fall back to default configuration if validation fails
- Admins should reconfigure the store after this update to set per-level currencies

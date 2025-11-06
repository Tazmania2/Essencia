# Store Configuration Current Flag Implementation

## Problem
The system didn't have a way to identify which store configuration entry in the `store__c` collection was the active/current one. This could lead to:
- Multiple configurations existing without knowing which to use
- Inconsistent behavior between dashboard and admin
- No fallback mechanism when no current config exists

## Solution
Implemented a `current` flag system to mark the active configuration.

## Changes Made

### 1. Updated `StoreConfiguration` Interface (types/index.ts)
Added optional metadata fields:
```typescript
export interface StoreConfiguration {
  _id?: string;              // Funifier document ID
  currencyId: string;
  currencyName: string;
  grayOutLocked: boolean;
  levels: LevelConfiguration[];
  current?: boolean;         // NEW: Marks if this is the active config
  createdAt?: string;        // NEW: Timestamp when created
  updatedAt?: string;        // NEW: Timestamp when last updated
}
```

### 2. Updated Funifier API Service (services/funifier-api.service.ts)

#### `getStoreConfig()` - Enhanced to fetch only current configuration
- Queries `store__c` collection with filter `{ current: true }`
- If no current config found, attempts to find any config and marks it as current
- Returns `null` if no configurations exist (triggers default fallback)

#### `getAllStoreConfigs()` - NEW method
- Fetches all store configurations from `store__c` collection
- Used internally to manage the current flag

#### `updateStoreConfig()` - NEW method
- Updates an existing configuration by ID
- Used to mark old configs as not current

#### `saveStoreConfig()` - Enhanced to manage current flag
- Fetches all existing configurations
- Marks all existing configs as `current: false`
- Saves new configuration with `current: true`
- Adds `createdAt` and `updatedAt` timestamps

### 3. Updated Store Service (services/store.service.ts)

#### Enhanced logging
- Logs when fetching current configuration
- Logs configuration ID when found
- Logs creation timestamp for debugging

## Behavior

### When fetching configuration:
1. **Current config exists**: Returns the config marked with `current: true`
2. **No current config, but configs exist**: Marks the first one as current and returns it
3. **No configs exist**: Returns default configuration
4. **Error occurs**: Falls back to default configuration

### When saving configuration:
1. Validates the new configuration
2. Fetches all existing configurations
3. Marks all existing configs as `current: false`
4. Saves new config with `current: true`, `createdAt`, and `updatedAt`
5. Invalidates cache to force refresh

### Fallback to Default:
The system falls back to default configuration when:
- No configurations exist in `store__c`
- No configuration is marked as current
- Configuration fetch fails
- Configuration validation fails

## Default Configuration
```typescript
{
  currencyId: 'coins',
  currencyName: 'Moedas',
  grayOutLocked: false,
  levels: [
    { catalogId: 'loja_de_recompensas', levelNumber: 1, levelName: 'Nível 1', visible: true },
    { catalogId: 'loja_de_recompensas_2', levelNumber: 2, levelName: 'Nível 2', visible: true },
    { catalogId: 'loja_de_recompensas_3', levelNumber: 3, levelName: 'Nível 3', visible: true },
    { catalogId: 'backend_tools', levelNumber: 999, levelName: 'Internal', visible: false }
  ]
}
```

## Benefits
1. **Clear active configuration**: Only one config is marked as current at any time
2. **Configuration history**: Old configs remain in database but are marked as not current
3. **Automatic fallback**: System gracefully handles missing or invalid configurations
4. **Debugging support**: Timestamps help track when configurations were created/updated
5. **Cache management**: Cache is invalidated after saves to ensure fresh data

## Usage

### For Dashboard/Storefront:
```typescript
const config = await storeService.getStoreConfiguration();
// Always returns a valid configuration (current or default)
```

### For Admin Panel:
```typescript
// Load current config
const config = await storeService.getStoreConfiguration();

// Save new config (automatically marks as current)
await storeService.saveStoreConfiguration(newConfig);
```

## Testing Recommendations
1. Test with no configurations in `store__c`
2. Test with multiple configurations (ensure only one is current)
3. Test saving new configuration (verify old ones are marked as not current)
4. Test error scenarios (API failures, invalid data)
5. Verify cache invalidation after saves

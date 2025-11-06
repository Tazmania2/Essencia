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
- Updates an existing configuration by ID using PUT
- Sends the complete configuration object (as required by Funifier)
- Used to mark old configs as not current

#### `saveStoreConfig()` - Enhanced to manage current flag
- Fetches all existing configurations
- Checks if this is an update (config has `_id` that exists) or new creation
- Marks all other existing configs as `current: false`
- **If updating**: Updates the existing config with `current: true` and new `updatedAt`
- **If creating**: Removes `_id` (if present) and creates new config with `current: true`, `createdAt`, and `updatedAt`
- Prevents duplicate key errors by properly handling updates vs creates

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
3. Checks if this is an update (has existing `_id`) or new creation
4. Marks all other existing configs as `current: false`
5. **If updating**: Updates the existing config with `current: true` and new `updatedAt`
6. **If creating**: Creates new config with `current: true`, `createdAt`, and `updatedAt`
7. Invalidates cache to force refresh

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

## Error Handling

### Duplicate Key Error (E11000)
The system now properly handles the distinction between creating new configurations and updating existing ones:
- **Update scenario**: When a config with an existing `_id` is saved, it uses the update endpoint
- **Create scenario**: When a new config is saved, the `_id` is removed to let Funifier generate a new one
- This prevents the E11000 duplicate key error that would occur if trying to POST with an existing `_id`

## Testing Recommendations
1. Test with no configurations in `store__c`
2. Test with multiple configurations (ensure only one is current)
3. Test saving new configuration (verify old ones are marked as not current)
4. Test updating existing configuration (verify it doesn't create duplicate)
5. Test error scenarios (API failures, invalid data)
6. Verify cache invalidation after saves

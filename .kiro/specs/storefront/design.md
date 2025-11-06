# Storefront Design Document

## Overview

The storefront feature provides a player-facing interface for browsing virtual goods from Funifier's catalog system, organized by progression levels. The system includes an administrative configuration interface for white-label customization. This design follows the existing architecture patterns established in the dashboard configuration system, utilizing Funifier's custom collections for persistent storage and maintaining consistency with the current UI/UX design.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Player Interface                         │
│  ┌────────────────┐         ┌──────────────────────────┐   │
│  │   Dashboard    │────────▶│   Storefront Page        │   │
│  │  (Shop Button) │         │  - Item Grid Display     │   │
│  └────────────────┘         │  - Level Indicators      │   │
│                              │  - Currency Balance      │   │
│                              │  - Item Modal            │   │
│                              └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌──────────────────┐      ┌──────────────────────────┐    │
│  │ Store Service    │      │  Funifier API Service    │    │
│  │ - Config Fetch   │◀────▶│  - Virtual Goods API     │    │
│  │ - Item Filtering │      │  - Catalogs API          │    │
│  │ - Level Mapping  │      │  - Points API            │    │
│  └──────────────────┘      │  - Custom Collections    │    │
│                             └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  Funifier Backend                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Virtual Goods API (/v3/virtualgoods/item)           │  │
│  │  Catalogs API (/v3/virtualgoods/catalog)             │  │
│  │  Points API (/v3/point)                              │  │
│  │  Custom Collection (store__c)                        │  │
│  │  Player Status API (/player/status)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Admin Interface                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Store Configuration Panel                          │  │
│  │   - Currency Selection                               │  │
│  │   - Currency Name Input                              │  │
│  │   - Catalog Management (Show/Hide)                   │  │
│  │   - Level Mapping & Naming                           │  │
│  │   - Visual Options (Gray Out Locked Items)           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Admin Configuration Flow**:
   - Admin accesses Store Configuration panel
   - System fetches available catalogs from `/v3/virtualgoods/catalog`
   - System fetches available points from `/v3/point`
   - Admin configures catalog visibility, level mappings, currency settings
   - Configuration saved to `store__c` custom collection in Funifier

2. **Player Storefront Flow**:
   - Player clicks Shop button on dashboard
   - System fetches store configuration from `store__c` collection
   - System fetches all virtual goods from `/v3/virtualgoods/item`
   - System fetches player's currency balance from `/player/status`
   - Items filtered by configured currency type and visible catalogs
   - Items grouped and displayed by level/catalog
   - Player clicks item to view details in modal

## Components and Interfaces

### Frontend Components

#### 1. StorefrontPage Component
**Location**: `app/store/page.tsx`

**Responsibilities**:
- Main page container for the storefront
- Fetch and manage store configuration
- Fetch and filter virtual goods items
- Display player's currency balance
- Render item grid grouped by levels
- Handle navigation back to dashboard

**Props**: None (uses route context)

**State**:
```typescript
interface StorefrontState {
  storeConfig: StoreConfiguration | null;
  items: VirtualGoodItem[];
  playerBalance: number;
  loading: boolean;
  error: string | null;
  selectedItem: VirtualGoodItem | null;
}
```

#### 2. ItemGrid Component
**Location**: `components/store/ItemGrid.tsx`

**Responsibilities**:
- Display items grouped by level/catalog
- Apply visual styling based on configuration (gray out locked items)
- Handle item click to open modal

**Props**:
```typescript
interface ItemGridProps {
  itemsByLevel: Map<string, VirtualGoodItem[]>;
  levelConfig: LevelConfiguration[];
  onItemClick: (item: VirtualGoodItem) => void;
  grayOutLocked: boolean;
}
```

#### 3. ItemCard Component
**Location**: `components/store/ItemCard.tsx`

**Responsibilities**:
- Display individual item with small image, name, and price
- Apply locked/unlocked styling
- Handle click events

**Props**:
```typescript
interface ItemCardProps {
  item: VirtualGoodItem;
  levelName: string;
  currencyName: string;
  isLocked?: boolean;
  grayedOut?: boolean;
  onClick: () => void;
}
```

#### 4. ItemModal Component
**Location**: `components/store/ItemModal.tsx`

**Responsibilities**:
- Display item details in modal overlay
- Show larger image, full description, level, price
- Handle modal close

**Props**:
```typescript
interface ItemModalProps {
  item: VirtualGoodItem | null;
  levelName: string;
  currencyName: string;
  isOpen: boolean;
  onClose: () => void;
}
```

#### 5. StoreConfigPanel Component
**Location**: `components/admin/StoreConfigPanel.tsx`

**Responsibilities**:
- Admin interface for store configuration
- Currency selection and naming
- Catalog visibility toggles
- Level mapping and naming
- Visual options configuration
- Save configuration to Funifier

**Props**: None (admin context)

**State**:
```typescript
interface StoreConfigState {
  availableCatalogs: Catalog[];
  availablePoints: Point[];
  configuration: StoreConfiguration;
  loading: boolean;
  saving: boolean;
  error: string | null;
}
```

### Service Layer

#### StoreService
**Location**: `services/store.service.ts`

**Responsibilities**:
- Fetch store configuration from `store__c` collection
- Save store configuration to `store__c` collection
- Provide default configuration when none exists
- Transform and validate configuration data

**Methods**:
```typescript
class StoreService {
  // Fetch store configuration
  async getStoreConfiguration(): Promise<StoreConfiguration>
  
  // Save store configuration
  async saveStoreConfiguration(config: StoreConfiguration): Promise<void>
  
  // Get default configuration
  getDefaultConfiguration(): StoreConfiguration
  
  // Validate configuration
  validateConfiguration(config: StoreConfiguration): boolean
}
```

#### VirtualGoodsService
**Location**: `services/virtual-goods.service.ts`

**Responsibilities**:
- Fetch virtual goods items from Funifier API
- Fetch catalog list from Funifier API
- Filter items by currency type and catalog visibility
- Group items by catalog/level

**Methods**:
```typescript
class VirtualGoodsService {
  // Fetch all virtual goods items
  async getVirtualGoodsItems(): Promise<VirtualGoodItem[]>
  
  // Fetch available catalogs
  async getCatalogs(): Promise<Catalog[]>
  
  // Filter items by currency type
  filterItemsByCurrency(items: VirtualGoodItem[], currencyId: string): VirtualGoodItem[]
  
  // Group items by catalog
  groupItemsByCatalog(items: VirtualGoodItem[]): Map<string, VirtualGoodItem[]>
  
  // Get item price for specific currency
  getItemPrice(item: VirtualGoodItem, currencyId: string): number | null
}
```

#### PointsService
**Location**: `services/points.service.ts`

**Responsibilities**:
- Fetch available points/currencies from Funifier API
- Get player's currency balance from player status

**Methods**:
```typescript
class PointsService {
  // Fetch available points
  async getAvailablePoints(): Promise<Point[]>
  
  // Get player balance for specific currency
  async getPlayerBalance(currencyId: string): Promise<number>
}
```

### Extensions to Existing Services

#### FunifierApiService Extensions
**Location**: `services/funifier-api.service.ts`

Add new methods:
```typescript
// Fetch virtual goods items
async getVirtualGoodsItems(): Promise<any[]>

// Fetch catalogs
async getCatalogs(): Promise<any[]>

// Fetch points
async getPoints(): Promise<any[]>

// Fetch from store__c collection
async getStoreConfig(): Promise<any>

// Save to store__c collection
async saveStoreConfig(config: any): Promise<void>
```

## Data Models

### TypeScript Interfaces

```typescript
// Virtual Good Item from Funifier API
interface VirtualGoodItem {
  _id: string;
  catalogId: string;
  name: string;
  description?: string;
  amount: number;
  active: boolean;
  created: number;
  image?: {
    small?: ImageData;
    medium?: ImageData;
    original?: ImageData;
  };
  requires: Requirement[];
  rewards: any[];
  notifications: any[];
  limit: {
    total: number;
    per: string;
    every: string;
  };
  extra: Record<string, any>;
  i18n: Record<string, any>;
  techniques: string[];
  owned: number;
}

interface ImageData {
  url: string;
  size: number;
  width: number;
  height: number;
  depth: number;
}

interface Requirement {
  total: number;
  type: number;
  item: string;
  operation: number;
  extra: Record<string, any>;
  restrict: boolean;
  perPlayer: boolean;
}

// Catalog from Funifier API
interface Catalog {
  _id: string;
  catalog: string;
  extra: Record<string, any>;
  created: number;
  i18n: Record<string, any>;
}

// Point from Funifier API
interface Point {
  _id: string;
  category: string;
  shortName: string;
  extra: Record<string, any>;
  techniques: string[];
}

// Store Configuration (stored in store__c)
interface StoreConfiguration {
  currencyId: string;           // Selected point ID (e.g., "coins")
  currencyName: string;          // Display name (e.g., "Moedas")
  grayOutLocked: boolean;        // Whether to gray out locked items
  levels: LevelConfiguration[];  // Level/catalog mappings
}

interface LevelConfiguration {
  catalogId: string;             // Funifier catalog ID
  levelNumber: number;           // Display order
  levelName: string;             // Custom level name
  visible: boolean;              // Whether to show this catalog
}

// Default Configuration
const DEFAULT_STORE_CONFIG: StoreConfiguration = {
  currencyId: "coins",
  currencyName: "Moedas",
  grayOutLocked: false,
  levels: [
    {
      catalogId: "loja_de_recompensas",
      levelNumber: 1,
      levelName: "Nível 1",
      visible: true
    },
    {
      catalogId: "loja_de_recompensas_2",
      levelNumber: 2,
      levelName: "Nível 2",
      visible: true
    },
    {
      catalogId: "backend_tools",
      levelNumber: 999,
      levelName: "Internal",
      visible: false
    }
  ]
};
```

## Error Handling

### Error Scenarios

1. **Configuration Not Found**:
   - Fallback to default configuration
   - Log warning but continue operation
   - Admin can save configuration to persist

2. **API Failures**:
   - Display user-friendly error messages
   - Retry logic for transient failures
   - Graceful degradation (show cached data if available)

3. **Invalid Item Data**:
   - Filter out items with missing required fields
   - Log validation errors
   - Continue displaying valid items

4. **Currency Mismatch**:
   - Filter out items that don't match configured currency
   - Don't display items with no price in configured currency

### Error Messages

```typescript
const ERROR_MESSAGES = {
  FETCH_ITEMS_FAILED: "Não foi possível carregar os itens da loja. Tente novamente.",
  FETCH_CONFIG_FAILED: "Erro ao carregar configuração da loja. Usando configuração padrão.",
  SAVE_CONFIG_FAILED: "Não foi possível salvar a configuração. Tente novamente.",
  FETCH_BALANCE_FAILED: "Não foi possível carregar seu saldo.",
  NO_ITEMS_AVAILABLE: "Nenhum item disponível no momento.",
};
```

## Testing Strategy

### Unit Tests

1. **StoreService Tests**:
   - Test configuration fetch with valid data
   - Test configuration fetch with missing data (default fallback)
   - Test configuration save
   - Test configuration validation

2. **VirtualGoodsService Tests**:
   - Test item filtering by currency type
   - Test item grouping by catalog
   - Test price extraction for specific currency
   - Test handling of items without prices

3. **Component Tests**:
   - Test ItemCard rendering with different states
   - Test ItemGrid grouping and display
   - Test ItemModal open/close behavior
   - Test StoreConfigPanel form interactions

### Integration Tests

1. **Storefront Page Flow**:
   - Test complete page load with configuration
   - Test item display and filtering
   - Test modal open/close with item selection
   - Test navigation back to dashboard

2. **Admin Configuration Flow**:
   - Test loading existing configuration
   - Test modifying and saving configuration
   - Test catalog visibility toggles
   - Test level reordering

### E2E Tests

1. **Player Journey**:
   - Navigate from dashboard to store
   - Browse items by level
   - Click item to view details
   - Navigate back to dashboard

2. **Admin Journey**:
   - Access store configuration
   - Modify currency settings
   - Toggle catalog visibility
   - Save and verify changes reflect in player view

## UI/UX Design Specifications

### Storefront Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                    💰 1,250 Moedas │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                    Loja                             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Nível 1                                            │ │
│  ├────────────────────────────────────────────────────┤ │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │ │
│  │  │ IMG  │  │ IMG  │  │ IMG  │  │ IMG  │          │ │
│  │  │      │  │      │  │      │  │      │          │ │
│  │  │ Item │  │ Item │  │ Item │  │ Item │          │ │
│  │  │ 150  │  │ 200  │  │ 300  │  │ 450  │          │ │
│  │  └──────┘  └──────┘  └──────┘  └──────┘          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Nível 2                                            │ │
│  ├────────────────────────────────────────────────────┤ │
│  │  ┌──────┐  ┌──────┐  ┌──────┐                     │ │
│  │  │ IMG  │  │ IMG  │  │ IMG  │                     │ │
│  │  │      │  │      │  │      │                     │ │
│  │  │ Item │  │ Item │  │ Item │                     │ │
│  │  │ 500  │  │ 600  │  │ 750  │                     │ │
│  │  └──────┘  └──────┘  └──────┘                     │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Item Modal Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                      ✕   │
│                                                          │
│                  ┌──────────────────┐                   │
│                  │                  │                   │
│                  │   Large Image    │                   │
│                  │                  │                   │
│                  └──────────────────┘                   │
│                                                          │
│                    Item Name                            │
│                    Nível 1                              │
│                    500 Moedas                           │
│                                                          │
│  Full description of the item goes here with all the    │
│  details that the user needs to know about this         │
│  particular reward item.                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Admin Store Configuration Layout

```
┌─────────────────────────────────────────────────────────┐
│  Store Configuration                                     │
│                                                          │
│  Currency Settings                                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Currency Type:  [Coins ▼]                          │ │
│  │ Currency Name:  [Moedas                    ]       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Display Options                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ☐ Gray out locked items                            │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Catalog Configuration                                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Catalog ID          Level  Name        Visible     │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ loja_de_recompensas  [1]  [Nível 1  ]  ☑         │ │
│  │ loja_de_recompensas_2[2]  [Nível 2  ]  ☑         │ │
│  │ backend_tools        [99] [Internal  ]  ☐         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Save Configuration]                                    │
└─────────────────────────────────────────────────────────┘
```

### Design Tokens

Follow existing design system:
- Colors: Use current theme colors
- Typography: Match dashboard typography
- Spacing: Consistent with existing components
- Shadows: Match card shadows from dashboard
- Border radius: Consistent with current design
- Transitions: Smooth hover and click effects

### Responsive Design

- Mobile: Single column item grid
- Tablet: 2-3 column item grid
- Desktop: 4+ column item grid
- Modal: Full screen on mobile, centered overlay on desktop

## Performance Considerations

1. **Data Caching**:
   - Cache store configuration for session
   - Cache virtual goods items with TTL
   - Invalidate cache on configuration changes

2. **Image Optimization**:
   - Use small images for grid display
   - Lazy load images as user scrolls
   - Use medium/original images only in modal

3. **Pagination/Virtual Scrolling**:
   - Consider virtual scrolling for large item lists
   - Load items progressively if catalog is very large

4. **API Request Optimization**:
   - Batch requests where possible
   - Implement request debouncing for admin changes
   - Use loading states to improve perceived performance

## Security Considerations

1. **Admin Access Control**:
   - Verify admin permissions before showing configuration panel
   - Validate admin session on save operations

2. **Data Validation**:
   - Validate all configuration data before saving
   - Sanitize user inputs (level names, currency names)
   - Validate catalog IDs against available catalogs

3. **API Security**:
   - Use existing authentication mechanisms
   - Don't expose sensitive data in client-side code
   - Validate responses from Funifier API

## Migration and Deployment

### Initial Deployment

1. **Database Setup**:
   - Ensure `store__c` custom collection exists in Funifier
   - No migration needed (new feature)

2. **Default Configuration**:
   - System will use default configuration if none exists
   - Admin can customize and save configuration

3. **Feature Flag** (Optional):
   - Consider feature flag to enable/disable store
   - Allows gradual rollout

### Rollback Plan

1. **Hide Shop Button**:
   - Quick rollback by hiding shop button in dashboard
   - No data loss, configuration persists

2. **Restore Ranking Button**:
   - Re-enable ranking button if needed
   - Store feature remains available but not prominently displayed

## Future Enhancements

1. **Purchase Functionality**:
   - Implement actual item purchase flow
   - Transaction history
   - Inventory management

2. **Multi-Currency Support**:
   - Display items with multiple currency options
   - Currency conversion

3. **Search and Filters**:
   - Search items by name
   - Filter by price range
   - Sort options (price, name, newest)

4. **Wishlist**:
   - Allow players to save favorite items
   - Notifications when items become affordable

5. **Limited-Time Offers**:
   - Display countdown timers
   - Special promotional items

6. **Player Level Restrictions**:
   - Actually enforce level requirements
   - Show locked items with unlock requirements
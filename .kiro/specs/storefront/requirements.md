# Requirements Document

## Introduction

This document specifies the requirements for a storefront feature that displays virtual goods from Funifier's catalog system. The storefront allows players to browse items organized by level/catalog, with white-label configuration capabilities for administrators. This is a display-only feature (no purchase functionality) that integrates with Funifier's virtual goods API and custom collection storage for configuration.

## Glossary

- **Storefront**: The player-facing interface displaying virtual goods organized by catalog/level
- **Virtual Good**: An item from Funifier's catalog system with properties like name, description, image, and price
- **Catalog**: A Funifier grouping mechanism for virtual goods, used to represent different levels
- **Level**: A player progression tier, mapped to a Funifier catalog
- **White-Label Configuration**: Admin-defined settings stored in Funifier's store__c custom collection
- **Currency Point**: A Funifier point type (e.g., coins, XP) used as the store currency
- **Player Dashboard**: The main player interface where the shop button will be added
- **Admin Panel**: The administrative interface for configuring store settings
- **Funifier API**: The external API service providing virtual goods, catalogs, and points data
- **Custom Collection**: Funifier's database storage mechanism for custom data (store__c)

## Requirements

### Requirement 1: Player Storefront Display

**User Story:** As a player, I want to browse available store items organized by level, so that I can see what rewards are available at different progression tiers

#### Acceptance Criteria

1. WHEN THE player navigates to the storefront, THE Storefront SHALL display all virtual goods grouped by their catalog/level
2. WHILE displaying items, THE Storefront SHALL show each item's small image, name, and price in the currency specified by admin configuration
3. WHEN THE player views the storefront, THE Storefront SHALL display the player's current currency balance at the top of the page
4. WHERE THE admin has configured level names, THE Storefront SHALL display custom level names instead of catalog IDs
5. WHEN THE player clicks on an item, THE Storefront SHALL open a modal displaying the item's large image, name, level, price, and description

### Requirement 2: Item Filtering and Display Rules

**User Story:** As a player, I want to see only relevant items in the store, so that I am not confused by internal or irrelevant products

#### Acceptance Criteria

1. WHEN THE Storefront fetches items from Funifier, THE Storefront SHALL filter out items from catalogs marked as hidden in admin configuration
2. WHEN THE Storefront displays items, THE Storefront SHALL show only items with type 0 requirements matching the configured currency point ID
3. IF AN item does not have a type 0 requirement matching the configured currency, THEN THE Storefront SHALL exclude that item from display
4. WHERE THE admin has enabled the "gray out locked items" option, THE Storefront SHALL visually distinguish items from higher levels with reduced opacity or grayscale styling
5. WHILE THE "gray out locked items" option is disabled (default), THE Storefront SHALL display all items with normal styling regardless of level

### Requirement 3: Navigation and User Experience

**User Story:** As a player, I want easy navigation to and from the store, so that I can quickly access the storefront and return to my dashboard

#### Acceptance Criteria

1. WHEN THE player views the dashboard, THE Dashboard SHALL display a "Shop" button in place of the disabled "Ranking" button
2. WHEN THE player clicks the "Shop" button, THE Dashboard SHALL navigate to the storefront page
3. WHEN THE player is on the storefront page, THE Storefront SHALL display a "Back" button
4. WHEN THE player clicks the "Back" button, THE Storefront SHALL navigate back to the player dashboard
5. WHILE navigating between pages, THE System SHALL maintain the player's session and authentication state

### Requirement 4: Admin Store Configuration Interface

**User Story:** As an administrator, I want to configure which catalogs are displayed and how they are presented, so that I can customize the store experience for my organization

#### Acceptance Criteria

1. WHEN THE administrator accesses the admin panel, THE Admin Panel SHALL display a "Store" configuration section
2. WHEN THE administrator opens store configuration, THE System SHALL fetch and display all available catalogs from Funifier's catalog API
3. WHILE configuring the store, THE Admin Panel SHALL allow the administrator to show or hide each catalog via toggle controls
4. WHERE THE administrator configures catalog visibility, THE Admin Panel SHALL allow mapping each visible catalog to a level number
5. WHEN THE administrator maps catalogs to levels, THE Admin Panel SHALL allow entering custom display names for each level

### Requirement 5: Currency Configuration

**User Story:** As an administrator, I want to configure which currency is used in the store, so that I can align the store with my gamification strategy

#### Acceptance Criteria

1. WHEN THE administrator configures the store, THE Admin Panel SHALL fetch available point types from Funifier's points API
2. WHEN THE administrator views currency options, THE Admin Panel SHALL display a selector showing all available point types with their shortName and category
3. WHEN THE administrator selects a currency point type, THE Admin Panel SHALL save the selected point ID to the store configuration
4. WHERE NO currency is configured, THE System SHALL use "coins" as the default currency point ID
5. WHEN THE administrator configures a custom currency name, THE Admin Panel SHALL save the display name (default: "Moedas") to the store configuration

### Requirement 6: White-Label Configuration Storage

**User Story:** As a system, I want to store store configuration in Funifier's custom collection, so that configuration persists and follows the existing white-label pattern

#### Acceptance Criteria

1. WHEN THE administrator saves store configuration, THE System SHALL store the configuration in Funifier's store__c custom collection
2. WHEN THE System stores configuration, THE Configuration Record SHALL include catalog visibility settings, level mappings, level names, currency point ID, and currency display name
3. WHEN THE player loads the storefront, THE System SHALL fetch the latest configuration from the store__c collection
4. WHERE NO configuration exists in store__c, THE System SHALL use default configuration with catalogs from the provided sample data
5. WHEN THE System uses default configuration, THE Default Configuration SHALL hide the "backend_tools" catalog and use "coins" as the currency

### Requirement 7: Data Fetching and Integration

**User Story:** As a system, I want to fetch virtual goods and configuration data from Funifier APIs, so that the storefront displays current and accurate information

#### Acceptance Criteria

1. WHEN THE storefront loads, THE System SHALL fetch virtual goods from Funifier's GET /v3/virtualgoods/item endpoint
2. WHEN THE admin panel loads store configuration, THE System SHALL fetch catalogs from Funifier's GET /v3/virtualgoods/catalog endpoint
3. WHEN THE admin panel loads currency options, THE System SHALL fetch point types from Funifier's GET /v3/point endpoint
4. WHEN THE storefront displays currency balance, THE System SHALL use the existing player/status data that includes point categories
5. IF ANY API request fails, THEN THE System SHALL display an appropriate error message to the user and log the error details

### Requirement 8: Responsive Design and Styling

**User Story:** As a player, I want the storefront to match the existing application design, so that I have a consistent user experience

#### Acceptance Criteria

1. WHEN THE storefront renders, THE Storefront SHALL use the same design system and color scheme as the existing dashboard
2. WHEN THE storefront displays on mobile devices, THE Storefront SHALL adapt layout to smaller screens with responsive grid layouts
3. WHEN THE item modal opens, THE Modal SHALL display centered with appropriate backdrop and close functionality
4. WHILE displaying items, THE Storefront SHALL use card-based layouts consistent with existing dashboard components
5. WHEN THE storefront shows loading states, THE System SHALL display loading indicators consistent with existing patterns

### Requirement 9: Default Configuration Data

**User Story:** As a system, I want to provide sensible default configuration, so that the store works immediately without requiring admin setup

#### Acceptance Criteria

1. WHEN NO store configuration exists, THE System SHALL use default catalog mappings based on the provided sample data
2. WHEN THE System creates default configuration, THE Default Configuration SHALL map "loja_de_recompensas" to Level 1 with display name "Nível 1"
3. WHEN THE System creates default configuration, THE Default Configuration SHALL map "loja_de_recompensas_2" to Level 2 with display name "Nível 2"
4. WHEN THE System creates default configuration, THE Default Configuration SHALL set "backend_tools" catalog as hidden
5. WHEN THE System creates default configuration, THE Default Configuration SHALL set currency to "coins" with display name "Moedas"

### Requirement 10: Item Modal Display

**User Story:** As a player, I want to see detailed information about items when I click on them, so that I can make informed decisions about what I want to pursue

#### Acceptance Criteria

1. WHEN THE player clicks an item card, THE System SHALL open a modal overlay
2. WHEN THE modal opens, THE Modal SHALL display the item's medium or original size image
3. WHEN THE modal displays item details, THE Modal SHALL show the item name, level name, price with currency, and full description
4. WHEN THE player wants to close the modal, THE Modal SHALL provide a close button and backdrop click functionality
5. WHILE THE modal is open, THE System SHALL prevent scrolling of the background content

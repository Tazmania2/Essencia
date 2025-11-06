# Storefront Implementation Plan

- [x] 1. Set up data models and TypeScript interfaces





  - Create TypeScript interfaces for VirtualGoodItem, Catalog, Point, StoreConfiguration, and LevelConfiguration
  - Define default store configuration constant
  - Define error message constants
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2_

- [x] 2. Extend Funifier API service with store-related endpoints




  - [x] 2.1 Add method to fetch virtual goods items from `/v3/virtualgoods/item`


    - Implement `getVirtualGoodsItems()` method in FunifierApiService
    - Handle authentication and error responses
    - _Requirements: 1.1, 2.1_
  

  - [x] 2.2 Add method to fetch catalogs from `/v3/virtualgoods/catalog`

    - Implement `getCatalogs()` method in FunifierApiService
    - Handle authentication and error responses
    - _Requirements: 3.1_
  
  - [x] 2.3 Add method to fetch points from `/v3/point`

    - Implement `getPoints()` method in FunifierApiService
    - Handle authentication and error responses
    - _Requirements: 3.2_
  


  - [x] 2.4 Add methods for store__c custom collection operations

    - Implement `getStoreConfig()` method to fetch from store__c collection
    - Implement `saveStoreConfig(config)` method to save to store__c collection
    - Handle cases where collection doesn't exist yet
    - _Requirements: 3.1, 3.2, 3.3_


- [x] 3. Create VirtualGoodsService for item management




  - [x] 3.1 Implement item fetching and filtering logic


    - Create `getVirtualGoodsItems()` method
    - Create `filterItemsByCurrency(items, currencyId)` method to filter by type 0 requirements
    - Create `getItemPrice(item, currencyId)` method to extract price from requires array
    - _Requirements: 1.1, 2.1, 2.2_
  

  - [x] 3.2 Implement catalog operations


    - Create `getCatalogs()` method
    - Create `groupItemsByCatalog(items)` method to organize items by catalogId
    - _Requirements: 1.1, 2.1_


- [x] 4. Create PointsService for currency management





  - [x] 4.1 Implement points fetching

    - Create `getAvailablePoints()` method
    - Parse and return Point array from API
    - _Requirements: 3.2_
  

  - [ ] 4.2 Implement player balance retrieval
    - Create `getPlayerBalance(currencyId)` method
    - Extract balance from existing player/status data
    - Handle missing currency gracefully
    - _Requirements: 2.2_

- [x] 5. Create StoreService for configuration management







  - [x] 5.1 Implement configuration fetching with fallback

    - Create `getStoreConfiguration()` method
    - Implement fallback to default configuration when store__c is empty
    - Cache configuration for session
    - _Requirements: 3.1, 3.3_
  
  - [x] 5.2 Implement configuration saving


    - Create `saveStoreConfiguration(config)` method
    - Validate configuration before saving
    - Create `validateConfiguration(config)` method
    - _Requirements: 3.3_
  

  - [x] 5.3 Implement default configuration provider

    - Create `getDefaultConfiguration()` method
    - Return default config with backend_tools hidden
    - _Requirements: 3.3_


- [x] 6. Create ItemCard component for individual item display







  - [x] 6.1 Implement basic ItemCard component

    - Create component with props for item, levelName, currencyName
    - Display small image, item name, and price
    - Implement click handler
    - _Requirements: 1.1, 1.2, 2.2_
  

  - [x] 6.2 Add locked/grayed-out styling


    - Implement conditional styling based on grayedOut prop
    - Apply opacity/grayscale filters when item is locked
    - Maintain accessibility standards
    - _Requirements: 1.3_

  
  - [x] 6.3 Style component to match existing design


    - Apply current theme colors and typography
    - Add hover effects and transitions
    - Ensure responsive behavior
    - _Requirements: 1.1_

- [x] 7. Create ItemModal component for detailed item view







  - [x] 7.1 Implement modal structure and overlay


    - Create modal component with backdrop
    - Implement open/close functionality
    - Add close button and click-outside-to-close
    - _Requirements: 1.2_
  

  - [x] 7.2 Implement item detail display

    - Display large/medium image
    - Show item name, level name, price, and full description
    - Handle missing images and descriptions gracefully
    - _Requirements: 1.2_
  

  - [x] 7.3 Style modal and ensure responsiveness

    - Full-screen on mobile, centered overlay on desktop
    - Match existing modal patterns in the app
    - Add smooth open/close animations
    - _Requirements: 1.2_


- [x] 8. Create ItemGrid component for grouped item display






  - [x] 8.1 Implement level-grouped layout


    - Accept itemsByLevel map and levelConfig array as props
    - Render level sections with headers
    - Display items in responsive grid within each level
    - _Requirements: 1.1, 1.3_
  
  - [x] 8.2 Implement item click handling


    - Pass click events to parent component
    - Trigger modal open with selected item
    - _Requirements: 1.2_
  
  - [x] 8.3 Apply responsive grid layout


    - Single column on mobile
    - 2-3 columns on tablet
    - 4+ columns on desktop


    - _Requirements: 1.1_

- [x] 9. Create StorefrontPage main page component






  - [x] 9.1 Implement page structure and navigation


    - Create page at `app/store/page.tsx`
    - Add back button to return to dashboard
    - Display page title "Loja"
    - _Requirements: 1.1, 1.4_
  
  - [x] 9.2 Implement data fetching and state management


    - Fetch store configuration on mount
    - Fetch virtual goods items
    - Fetch player balance for configured currency
    - Manage loading and error states
    - _Requirements: 1.1, 2.1, 2.2, 3.1_
  
  - [x] 9.3 Implement item filtering and grouping logic


    - Filter items by configured currency (type 0 only)
    - Filter items by visible catalogs from configuration
    - Group items by catalog/level
    - Sort levels by levelNumber
    - _Requirements: 1.1, 1.3, 2.1, 3.1_
  
  - [x] 9.4 Display currency balance in header

    - Show player's current balance with currency name
    - Format number appropriately
    - Update when balance changes
    - _Requirements: 2.2_
  
  - [x] 9.5 Integrate ItemGrid and ItemModal components


    - Render ItemGrid with filtered and grouped items
    - Handle item selection to open modal
    - Pass configuration for gray-out behavior
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 9.6 Implement error handling and empty states


    - Show empty state when no items available

l
    - Show empty state when no items available
    - Provide retry funct
ionality
    - _Requirements: 1.1_

- [x] 10. Create StoreConfigPanel admin component




  - [x] 10.1 Implement currency configuration section


    - Create dropdown to select currency from available points
    - Create text input for currency display name
    - Fetch available points on component mount
    - Default to "coins" and "Moedas"
    - _Requirements: 3.2_
  


  - [x] 10.2 Implement display options section

    - Create checkbox for "Gray out locked items" option
    - Default to unchecked (false)
    - _Requirements: 3.3_


  

  - [x] 10.3 Implement catalog configuration table
    - Fetch available catalogs on component mount
    - Display table with columns: Catalog ID, Level, Name, Visible
    - Create number inputs for level ordering
    - Create text inputs for level names
    - Create checkboxes for visibility toggles


    - _Requirements: 3.1, 3.3_

  
  - [x] 10.4 Implement configuration loading
    - Fetch existing configuration from store__c on mount
    - Populate form fields with existing values
    - Handle case where no configuration exists (use defaults)

    - Merge fetched catalogs with saved configuration
    - _Requirements: 3.1, 3.3_


  
  - [x] 10.5 Implement configuration saving
    - Create save button with loading state
    - Validate configuration before saving
    - Call StoreService to save to store__c collection
    - Show success/error feedback to admin

    - _Requirements: 3.3_



  

  - [x] 10.6 Style component to match admin dashboard design

    - Follow existing admin panel styling patterns
    - Ensure responsive layout
    - Add appropriate spacing and visual hierarchy
    - _Requirements: 3.1_

- [x] 11. Integrate store into admin dashboard






  - [x] 11.1 Add Store navigation item to admin dashboard


    - Add "Store" link/button to admin n

avigation menu
    - Route to store configuration panel
    - _Requirements: 3.1_
  
  - [x] 11.2 Create admin store configuration page


    - Create page at `app/admin/store/page.tsx`
    - Render StoreConfigPanel component
    - Add page title and breadcrumbs
    - _Requirements: 3.1_

- [x] 12. Update player dashboard to add Shop button






  - [x] 12.1 Replace disabled Ranking button with Shop button

    - Locate existing Ranking button in dashboard
    - Replace with Shop button (or hide Ranking and add Shop)
    - Link Shop button to `/store` route
    - _Requirements: 1.4_
  


  - [ ] 12.2 Style Shop button to match dashboard design
    - Use existing button styles
    - Add appropriate icon (shopping cart or store icon)
    - Ensure button is prominent and accessible
    - _Requirements: 1.4_

- [ ]* 13. Add comprehensive error handling and loading states
  - Implement loading skeletons for storefront page
  - Add error boundaries for component failures
  - Implement retry logic for failed API calls
  - Add toast notifications for user feedback
  - _Requirements: 1.1, 3.1_

- [ ]* 14. Optimize performance
  - Implement image lazy loading for item cards
  - Add caching for store configuration
  - Implement virtual scrolling for large item lists
  - Optimize re-renders with React.memo where appropriate
  - _Requirements: 1.1_

- [ ]* 15. Add accessibility improvements
  - Ensure keyboard navigation works for all interactive elements
  - Add ARIA labels for screen readers
  - Ensure sufficient color contrast
  - Test with screen reader
  - _Requirements: 1.1, 1.2, 3.1_

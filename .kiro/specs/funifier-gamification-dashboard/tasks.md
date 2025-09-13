# Implementation Plan

- [x] 1. Set up project structure and Git repository

  - [x] 1.1 Initialize Git repository and remote setup
    - Initialize Git repository in the project folder
    - Create GitHub/GitLab repository for the project
    - Set up initial commit with project structure
    - Configure .gitignore for Next.js project
    - Add README.md with project description and setup instructions
    - _Requirements: Deployment preparation_

  - [x] 1.2 Create Next.js project with TypeScript configuration
    - Create Next.js project with TypeScript configuration
    - Set up folder structure (components, services, types, utils, pages)
    - Configure environment variables for Funifier API integration
    - Install and configure required dependencies (axios, react-query, tailwindcss)
    - Set up ESLint and Prettier for code quality
    - Create initial commit with base project structure
    - _Requirements: 7.1, 7.2_

- [ ] 2. Implement Funifier API integration services
  - [ ] 2.1 Create Funifier authentication service
    - Implement authentication with API key and user credentials
    - Handle token management and refresh logic
    - Create error handling for authentication failures
    - Write unit tests for authentication service
    - _Requirements: 1.1, 7.1, 7.2_

  - [ ] 2.2 Create Funifier player data service
    - Implement player status retrieval using GET /player_status with correct base URL
    - Parse and validate FunifierPlayerStatus response structure including catalog_items
    - Extract points lock/unlock status from catalog_items (E6F0O5f for unlock)
    - Extract boost status from catalog_items (E6F0WGc, E6K79Mt for secondary boosts)
    - Handle API errors and network failures gracefully
    - Write unit tests for player data retrieval and catalog_items parsing
    - _Requirements: 2.2, 2.3, 3.1, 4.3, 7.3_

  - [ ] 2.3 Create Funifier database service for custom collections
    - Implement collection creation and bulk data insertion
    - Implement data retrieval from custom collections
    - Implement aggregation queries for data comparison
    - Write unit tests for database operations
    - _Requirements: 6.2, 6.3, 7.4_

- [ ] 3. Implement team-specific data processing
  - [ ] 3.1 Create base team processor interface and utilities
    - Define TeamProcessor interface with processPlayerData method
    - Create utility functions for percentage calculations and date handling
    - Implement challenge ID mapping configuration for each team
    - Write unit tests for utility functions
    - _Requirements: 3.1, 3.2, 4.1_

  - [ ] 3.2 Implement Carteira I processor
    - Extract Atividade goal percentage from challenge_progress in player status (primary goal)
    - Extract Reais por ativo goal percentage from challenge_progress (secondary goal 1)
    - Extract Faturamento goal percentage from challenge_progress (secondary goal 2)
    - Use boost status from catalog_items (presence of boost items indicates goal completion)
    - Use points and lock status directly from Funifier catalog_items
    - Write unit tests for Carteira I processing logic
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 3.3 Implement Carteira III/IV processor
    - Extract Faturamento goal from challenges (primary goal)
    - Extract Reais por ativo goal from challenges (secondary goal 1)
    - Extract Multimarcas por ativo goal from challenges (secondary goal 2)
    - Use points and lock status directly from Funifier
    - Write unit tests for Carteira III/IV processing logic
    - _Requirements: 3.5, 3.6, 3.7, 3.8_

  - [ ] 3.4 Implement Carteira II processor with local calculations
    - Implement points unlock logic: unlock when Reais por Ativo >= 100%
    - Implement boost multiplier logic: +100% per active boost (max 200% with both boosts)
    - Calculate final points: base_points \* (1 + boost_multipliers) only if unlocked
    - Extract Reais por ativo as primary goal (controls point unlock)
    - Extract Atividade and Multimarcas por ativo as secondary goals from collection data
    - Handle boost status from catalog_items for secondary goals
    - Write comprehensive unit tests for Carteira II complex logic
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 4. Create authentication and user management
  - [ ] 4.1 Implement login component and authentication flow
    - Create login form with username/password inputs
    - Implement authentication with Funifier API
    - Handle authentication errors and display appropriate messages
    - Store authentication token securely
    - Write unit tests for login component
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 4.2 Implement user role and team identification
    - Determine user role (player vs admin) from Funifier response
    - Extract team information from player data (teams array)
    - Map team IDs to TeamType enum values
    - Implement role-based routing logic
    - Write unit tests for role identification
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 4.3 Create authentication context and protected routes
    - Implement React context for authentication state
    - Create protected route components for player and admin areas
    - Handle token expiration and automatic logout
    - Implement route guards based on user role
    - Write integration tests for authentication flow
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 5. Adapt existing HTML dashboard and create React components
  - [ ] 5.1 Convert existing HTML dashboard to React components
    - Convert the existing "ideia basica front.html" to React/Next.js components
    - Maintain the exact visual design and animations from the HTML version
    - Create reusable components for cards, progress bars, and boost indicators
    - Implement responsive behavior and Tailwind CSS classes
    - Add TypeScript interfaces for all component props
    - Write unit tests for converted components
    - _Requirements: 2.1, 8.1, 8.2, 8.3_

  - [ ] 5.2 Connect points display to Funifier data
    - Replace static points value with dynamic data from Funifier player status
    - Implement lock/unlock logic based on catalog_items (E6F0O5f for unlock status)
    - Update card styling dynamically: blue background + green text for unlocked, white background + red text for locked
    - Handle different point calculation methods per team (direct vs Carteira II local processing)
    - Maintain existing pulse animation for unlocked state
    - Write unit tests for points display and status calculations
    - _Requirements: 2.2, 2.3, 3.1, 4.3_

  - [ ] 5.3 Connect cycle information to collection data
    - Replace static cycle values with data from custom collection (currentCycleDay, totalCycleDays)
    - Implement fallback to 21 days total when collection data is missing
    - Calculate cycle progress percentage and update progress bar
    - Maintain existing visual design and animations
    - Handle edge cases (missing data, cycle transitions)
    - Write unit tests for cycle calculations with fallback scenarios
    - _Requirements: 2.4, 2.5_

  - [ ] 5.4 Connect goal metrics to collection data with special progress bars
    - Replace static goal percentages with data from custom collection
    - Implement special progress bar logic: 0-50% red (0-33% fill), 50-100% yellow (33-66% fill), 100-150% green (66-100% fill)
    - Connect boost indicators to catalog_items (E6F0WGc, E6K79Mt for secondary boosts)
    - Maintain existing glow animation for active boosts
    - Update goal names based on team type (Atividade/Faturamento/Reais por Ativo/Multimarcas)
    - Keep existing accordion functionality for goal details
    - Write unit tests for goal components and progress bar calculations
    - _Requirements: 3.2, 3.3, 3.4, 3.6, 3.7, 3.8, 4.4, 4.5, 4.6_

  - [ ] 5.5 Create team-specific dashboard variations
    - Duplicate base dashboard for each team type (Carteira I, II, III, IV)
    - Customize goal names and processing logic per team
    - Implement team-specific routing and data processing
    - Handle Carteira II special case with local point calculations
    - Maintain consistent visual design across all team dashboards
    - Write integration tests for team-specific dashboards
    - _Requirements: 3.1, 3.5, 4.1_

- [ ] 6. Create login page and build admin dashboard components
  - [ ] 6.0 Create login page with O Boticário design
    - Design login page from scratch using O Boticário brand colors and styling
    - Create responsive login form with username/password fields
    - Implement gradient background and card-based layout matching dashboard style
    - Add form validation and error handling with branded styling
    - Integrate with Funifier authentication API
    - Add loading states and success/error feedback
    - Write unit tests for login component
    - _Requirements: 1.1, 1.2, 1.3, 8.1_

- [ ] 6. Build admin dashboard components
  - [ ] 6.1 Create admin dashboard layout and navigation from scratch
    - Design admin interface from scratch using O Boticário design system
    - Create sidebar navigation with player selection and data export sections
    - Implement responsive layout for admin tools matching player dashboard style
    - Add breadcrumb navigation and section headers with brand styling
    - Create admin header with different styling from player dashboard
    - Write unit tests for admin layout
    - _Requirements: 5.1, 5.2, 8.1, 8.4_

  - [ ] 6.2 Implement player selector component
    - Create searchable dropdown for player selection
    - Load all players from Funifier API
    - Display selected player's complete information
    - Handle loading states and empty states
    - Write unit tests for player selector
    - _Requirements: 5.1, 5.2_

  - [ ] 6.3 Create data export functionality
    - Implement export of player data to CSV/Excel format
    - Allow filtering and selection of data to export
    - Handle large datasets with pagination or streaming
    - Provide download progress indicators
    - Write unit tests for export functionality
    - _Requirements: 5.3, 5.4_

- [ ] 7. Implement report upload and processing system
  - [ ] 7.1 Create file upload component with Funifier integration
    - Build drag-and-drop file upload interface matching O Boticário design
    - Validate file format and structure (CSV/Excel)
    - Option 1: Use Funifier upload API (POST /v3/upload/file) to store files with metadata
    - Option 2: Process files directly without storing (recommended for data processing)
    - Display upload progress and status with branded styling
    - Handle upload errors and provide user feedback
    - Write unit tests for file upload component
    - _Requirements: 6.1, 8.3, 8.4_

  - [ ] 7.2 Implement report data parsing and validation
    - Parse uploaded report files (CSV/Excel)
    - Validate data structure and required fields
    - Map report data to internal data structures
    - Handle parsing errors and data validation failures
    - Write unit tests for report parsing
    - _Requirements: 6.1, 6.2_

  - [ ] 7.3 Create report comparison engine
    - Retrieve current data from Funifier custom collection
    - Compare report data with stored data
    - Calculate differences and identify changes
    - Generate comparison reports for admin review
    - Write unit tests for comparison logic
    - _Requirements: 6.2, 6.3, 6.4_

  - [ ] 7.4 Implement action log generation and submission
    - Generate action logs based on data differences
    - Calculate appropriate attribute values for Funifier
    - Submit action logs to Funifier API
    - Handle submission errors and retry logic
    - Provide feedback on successful synchronization
    - Write unit tests for action log generation
    - _Requirements: 6.3, 6.4, 6.5, 6.6_

- [ ] 8. Add error handling and user experience improvements
  - [ ] 8.1 Implement comprehensive error handling
    - Create error boundary components for different sections
    - Handle Funifier API errors gracefully
    - Display user-friendly error messages
    - Implement error logging and monitoring
    - Write unit tests for error handling
    - _Requirements: 7.5, 8.3, 8.4_

  - [ ] 8.2 Add loading states and performance optimizations
    - Implement loading spinners and skeleton screens
    - Add data caching with React Query
    - Optimize component re-renders with React.memo
    - Implement lazy loading for heavy components
    - Write performance tests and benchmarks
    - _Requirements: 8.2, 8.3_

  - [ ] 8.3 Create responsive design and accessibility features
    - Ensure mobile-first responsive design
    - Implement keyboard navigation support
    - Add ARIA labels and semantic HTML
    - Test with screen readers and accessibility tools
    - Write accessibility tests
    - _Requirements: 8.1, 8.4_

- [ ] 9. Integration testing and end-to-end testing
  - [ ] 9.1 Write integration tests for Funifier API integration
    - Test authentication flow with real API
    - Test player data retrieval and processing
    - Test report upload and synchronization flow
    - Mock external dependencies appropriately
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 9.2 Create end-to-end tests for user workflows
    - Test complete login to dashboard flow for players
    - Test admin report upload and processing workflow
    - Test error scenarios and recovery
    - Use Cypress or Playwright for E2E testing
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 6.1_

  - [ ] 9.3 Performance and load testing
    - Test application performance with realistic data loads
    - Test Funifier API integration under load
    - Optimize slow queries and heavy operations
    - Document performance benchmarks
    - _Requirements: 8.2, 8.3_

- [ ] 10. Deployment and production setup for Vercel
  - [ ] 10.1 Configure Vercel deployment from Git repository
    - Connect GitHub/GitLab repository to Vercel
    - Configure automatic deployments on push to main branch
    - Set up environment variables in Vercel dashboard (FUNIFIER_API_KEY, etc.)
    - Configure build settings and output directory
    - Set up API routes for backend functionality (serverless functions)
    - Test deployment with staging environment first
    - _Requirements: 7.1, 7.2_

  - [ ] 10.2 Deploy and verify production functionality
    - Deploy application to Vercel production environment
    - Configure custom domain if needed (optional)
    - Verify all Funifier API integrations work in production
    - Test complete user flows with real Funifier production data
    - Set up Vercel analytics and monitoring
    - Configure branch previews for development workflow
    - Document deployment process and environment setup
    - _Requirements: All requirements verification_

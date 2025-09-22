# Implementation Plan

- [x] 1. Extend type system and configuration for new dashboard types
  - Update TeamType enum in types/index.ts to include CARTEIRA_0 and ER
  - Add new team IDs (E6F5k30, E500AbT) and action IDs to FUNIFIER_CONFIG
  - Extend CHALLENGE_MAPPING in team-processor.service.ts for new team types
  - Extend CSV data interfaces for new metrics (conversoes, upa)
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2. Create Carteira 0 team processor
  - Add new Carteira0Processor class in services/carteira-0-processor.service.ts extending BaseTeamProcessor
  - Add Conversões metric extraction logic using challenge ID E6GglPq
  - Reuse existing Reais por Ativo and Faturamento challenge IDs from Carteira I mapping
  - Implement processPlayerData method with Conversões as primary goal
  - Write unit tests in services/**tests**/carteira-0-processor.service.test.ts
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Create ER team processor
  - Add new ERProcessor class in services/er-processor.service.ts extending BaseTeamProcessor
  - Add UPA metric extraction logic using challenge ID E62x2PW
  - Reuse existing Faturamento and Reais por Ativo challenge IDs from Carteira III/IV mapping
  - Implement processPlayerData method with Faturamento as primary goal
  - Write unit tests in services/**tests**/er-processor.service.test.ts
  - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [x] 4. Update team processor factory for new team types
  - Update services/team-processor-factory.service.ts getProcessor method to include Carteira 0 and ER cases
  - Update determineTeamType method to recognize new team IDs (E6F5k30, E500AbT)
  - Add new team types to getAvailableTeamTypes method
  - Update getTeamInfo method with new team information
  - Update existing unit tests in services/**tests**/team-processor-factory.service.test.ts
  - _Requirements: 1.1, 2.1, 5.1, 5.2_

- [x] 5. Create dashboard components for new team types

- [ ] 5. Create dashboard components for new team types

- [x] 5.1 Create Carteira0Dashboard component
  - Add new component in components/dashboard/Carteira0Dashboard.tsx reusing existing patterns
  - Copy structure from existing CarteiraIDashboard and integrate Carteira 0 processor

  - Ensure identical UI to existing Carteira dashboards
  - Write unit tests in components/dashboard/**tests**/Carteira0Dashboard.test.tsx
  - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.5_

-

- [x] 5.2 Create ERDashboard component
  - Add new component in components/dashboard/ERDashboard.tsx reusing existing patterns
  - Copy structure from existing dashboard and integrate ER processor
  - Add Medalhas button alongside existing Histórico and Ranking buttons

  - Implement "Em Breve" placeholder for Medalhas functionality
  - Write unit tests in components/dashboard/**tests**/ERDashboard.test.tsx
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.2, 6.3_

- [x] 6. Update TeamDashboardFactory for new dashboard routing
  - Update components/dashboard/TeamDashboardFactory.tsx to add CARTEIRA_0 and ER cases
  - Import and route to new Carteira0Dashboard and ERDashboard components
  - Update error handling for unrecognized team types
  - Update existing unit tests in components/dashboard/**tests**/TeamDashboards.test.tsx
  - _Requirements: 1.1, 2.1, 5.2, 5.3_

- [x] 7. Implement multi-team selection functionality

- [x] 7.1 Create TeamSelectionModal component
  - Add new component in components/auth/TeamSelectionModal.tsx using existing UI patterns
  - Display all available teams including Admin option
  - Handle team selection and emit selection events
  - Implement responsive design matching current modals
  - Write unit tests in components/auth/**tests**/TeamSelectionModal.test.tsx
  - _Requirements: 5.3, 5.4, 5.6_

- [x] 7.2 Update user identification service for multi-team handling
  - Update services/user-identification.service.ts identifyUser method to return all team assignments

  - Update mapTeamIdToType method to include Carteira 0 and ER team IDs
  - Add logic to detect multiple team scenarios including Admin
  - Update getAllTeamMappings method to include new teams

  - Update existing unit tests in services/**tests**/user-identification.service.test.ts
  - _Requirements: 5.1, 5.3, 5.4, 5.6_

- [x] 8. Update authentication flow for team selection
  - Update contexts/AuthContext.tsx to handle multiple team assignments
  - Integrate TeamSelectionModal when multiple teams detected
    in login flow
  - Update app/login/page.tsx to handle team selection routing
  - Update routing logic for Admin team selection
  - Update existing integration tests for complete authentication flow
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 9. Extend CSV processing for new metrics

- [x] 9.1 Update CSV data interfaces and validation
  - Update types/index.ts to extend CSVGoalData interface with conversoes and upa fields
  - Update EssenciaReportRecord interface to include new metrics
  - Maintain backward compatibility with existing CSV format
  - Update type definitions for new metric processing

  - _Requirements: 3.1, 3.2, 4.1, 4.2_

-

- [x] 9.2 Update CSV processing service methods
  - Update services/csv-processing.service.ts parseGoalCSV method to extract new metrics
  - Update validateCSVStructure method to accept optional new fields

  - Add formatting methods for Conversões and UPA display in getGoalUnit and formatGoalValue
  - Update error handling for new metric validation
  - Update existing unit tests in services/**tests**/csv-processing.test.ts
  - _Requirements: 3.3, 3.4, 4.3, 4.4_

- [x] 10. Update admin interface for new metrics
  - Update components/admin/FileUpload.tsx to handle new CSV format validation
  - Update services/report-processing.service.ts to process new metric fields
  - Update admin interface components to display new
    metric information
  - Update validation messages for new metric fields
  - Update existing unit tests for admin interface components
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 11. Update integration and end-to-end tests

- [x] 11.1 Update existing integration tests for new dashboard types
  - Update e2e/player-dashboard.spec.ts to include Carteira 0 and ER dashboard tests
  - Update e2e/login-flow.spec.ts to test team selection modal scenarios
  - Update e2e/admin-dashboard.spec.ts to test CSV upload with new metrics
  - Test complete user flows for new dashboard types
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 11.2 Update authentication and routing tests
  - Update existing tests to cover single team assignment scenarios

  - Add tests for multiple team assignment scenarios
  - Test team selection modal and dashboard routing
  - Test admin access through team selection
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 12. Update documentation and configuration
  - Update README.md with new dashboard types information
  - Update existing documentation for new CSV format requirements
  - Update environment configuration examples in .env.example

  - Document multi-team functionality in existing user guides
  - _Requirements: 6.4, 6.5_

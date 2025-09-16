# Requirements Document

## Introduction

This feature introduces two new dashboard types to the Funifier gamification system: Carteira 0 Dashboard and ER Dashboard. These dashboards expand the existing portfolio management system with new metrics and team-based functionality, requiring enhancements to the admin interface, CSV processing, authentication flow, and dashboard rendering system.

## Requirements

### Requirement 1: Carteira 0 Dashboard Implementation

**User Story:** As a Carteira 0 team member, I want to access a dashboard that tracks Conversões as the primary metric, so that I can monitor my conversion performance alongside revenue metrics.

#### Acceptance Criteria

1. WHEN a user with team "Carteira 0" logs in THEN the system SHALL redirect them to a Carteira 0 dashboard
2. WHEN the Carteira 0 dashboard loads THEN the system SHALL display "Conversões" as the Meta Principal
3. WHEN the Carteira 0 dashboard loads THEN the system SHALL display "Reais por Ativo" and "Faturamento" as Meta Secundária
4. WHEN displaying progress metrics THEN the system SHALL calculate and show conversion-based progress indicators
5. WHEN the dashboard refreshes THEN the system SHALL fetch the latest Conversões data from the Funifier API

### Requirement 2: ER Dashboard Implementation

**User Story:** As an ER team member, I want to access my individual dashboard with ER-specific metrics and team challenge features, so that I can track my performance and participate in team activities.

#### Acceptance Criteria

1. WHEN a user with team "ER" logs in THEN the system SHALL redirect them to their ER dashboard
2. WHEN the ER dashboard loads THEN the system SHALL display "Faturamento" as the Meta Principal
3. WHEN the ER dashboard loads THEN the system SHALL display "Reais por Ativo" and "UPA" as Meta Secundária
4. WHEN the ER dashboard loads THEN the system SHALL show a "Medalhas" button alongside "Histórico" and "Ranking"
5. WHEN a user clicks the "Medalhas" button THEN the system SHALL display an "Em Breve" message
6. WHEN displaying ER metrics THEN the system SHALL use the same individual dashboard structure as other teams

### Requirement 3: New Metrics Support

**User Story:** As a system administrator, I want to configure and track new metrics (Conversões and UPA), so that I can support the new dashboard types with accurate data.

#### Acceptance Criteria

1. WHEN processing CSV reports THEN the system SHALL recognize and parse "Conversões" metric data
2. WHEN processing CSV reports THEN the system SHALL recognize and parse "UPA" metric data
3. WHEN storing metric data THEN the system SHALL persist Conversões values with appropriate data types
4. WHEN storing metric data THEN the system SHALL persist UPA values with appropriate data types
5. WHEN calculating progress THEN the system SHALL apply correct formulas for Conversões and UPA metrics

### Requirement 4: Admin Interface Enhancement

**User Story:** As a system administrator, I want to upload CSV files with new metric columns, so that I can provide data for Carteira 0 and ER dashboards.

#### Acceptance Criteria

1. WHEN uploading a CSV file THEN the system SHALL accept files containing "Conversões" columns
2. WHEN uploading a CSV file THEN the system SHALL accept files containing "UPA" columns
3. WHEN processing uploaded files THEN the system SHALL validate Conversões data format
4. WHEN processing uploaded files THEN the system SHALL validate UPA data format
5. WHEN validation fails THEN the system SHALL provide clear error messages indicating which metrics are invalid
6. WHEN processing succeeds THEN the system SHALL confirm successful import of new metrics

### Requirement 5: Authentication Flow and Team Selection

**User Story:** As a user with team assignments, I want to be automatically directed to my appropriate dashboard or given a choice when I have multiple teams, so that I can access my relevant metrics efficiently.

#### Acceptance Criteria

1. WHEN a user logs in THEN the system SHALL identify all their team assignments (Carteira 0, Carteira I, Carteira II, Carteira III, Carteira IV, ER, or Admin)
2. WHEN a user has exactly one team assignment THEN the system SHALL automatically route them to their appropriate dashboard type
3. WHEN a user has multiple team assignments THEN the system SHALL display a team selection modal using the existing UI design
4. WHEN displaying the team selection modal THEN the system SHALL include Admin as a selectable option if the user has admin privileges
5. WHEN a user selects a team from the modal THEN the system SHALL route them to the corresponding dashboard type
6. WHEN a user selects Admin from the modal THEN the system SHALL route them to the admin interface
7. WHEN routing ER users THEN the system SHALL provide access to ER-specific metrics and the Medalhas button
8. WHEN routing Carteira 0 users THEN the system SHALL provide access to Conversões-based metrics
9. WHEN team data is unavailable THEN the system SHALL provide fallback behavior with clear user messaging

### Requirement 6: Dashboard UI Consistency

**User Story:** As a user of any dashboard type, I want consistent visual design and navigation, so that I can easily understand and use the interface regardless of my team assignment.

#### Acceptance Criteria

1. WHEN displaying Carteira 0 dashboard THEN the system SHALL use the exact same layout and design as existing Carteira dashboards
2. WHEN displaying ER dashboard THEN the system SHALL use the exact same layout and design as existing Carteira dashboards
3. WHEN showing the "Medalhas" button on ER dashboard THEN the system SHALL position it alongside "Histórico" and "Ranking" buttons
4. WHEN displaying new metrics THEN the system SHALL use consistent formatting and units as existing metrics
5. WHEN users interact with any dashboard THEN the system SHALL maintain identical interaction patterns across all team types
# Requirements Document

## Introduction

This feature introduces two interconnected capabilities to the Funifier gamification system: a cycle-based history function that allows players to view data from previous cycles, and a dashboard metrics configuration system that allows administrators to customize which metrics each Carteira (dashboard) uses. The system will implement cycle tracking for all data inputs and provide historical views with detailed analytics, while enabling dynamic dashboard configuration through a custom Funifier database collection.

## Requirements

### Requirement 1: Cycle-Based Data Tracking

**User Story:** As a system administrator, I want all data inputs to be marked with cycle information, so that the system can track and organize data by cycles for historical analysis.

#### Acceptance Criteria

1. WHEN an administrator uploads data through the admin interface THEN the system SHALL require cycle number input
2. WHEN cycle information is provided THEN the system SHALL store all data with the associated cycle number
3. WHEN no cycle is specified for historical data THEN the system SHALL automatically assign cycle 1 as default
4. WHEN storing data THEN the system SHALL maintain cycle information in all database collections
5. WHEN processing CSV uploads THEN the system SHALL associate all player data with the specified cycle

### Requirement 2: Player History Dashboard Access

**User Story:** As a player, I want to access a history function through the existing history button on my dashboard, so that I can view my performance data from previous cycles.

#### Acceptance Criteria

1. WHEN a player clicks the "Histórico" button THEN the system SHALL display a history interface
2. WHEN the history interface loads THEN the system SHALL show a list of all available cycles for that player
3. WHEN displaying cycles THEN the system SHALL sort cycles in descending order (most recent first)
4. WHEN a player has no historical data THEN the system SHALL display an appropriate message
5. WHEN the current cycle is in progress THEN the system SHALL exclude it from the history view

### Requirement 3: Historical Cycle Data Display

**User Story:** As a player, I want to view detailed information from a selected historical cycle, so that I can analyze my past performance and track my progress over time.

#### Acceptance Criteria

1. WHEN a player selects a historical cycle THEN the system SHALL display the latest data input for that cycle
2. WHEN displaying historical data THEN the system SHALL show all metrics (primary and secondary goals) with their final percentages
3. WHEN displaying historical data THEN the system SHALL show total points earned and lock/unlock status for that cycle
4. WHEN displaying historical data THEN the system SHALL show cycle duration information (total days, completion status)
5. WHEN displaying historical data THEN the system SHALL show boost activation status for secondary goals

### Requirement 4: Historical Cycle Analytics Graphs

**User Story:** As a player, I want to see graphical representations of my progress throughout a selected historical cycle, so that I can understand how my performance evolved over time.

#### Acceptance Criteria

1. WHEN viewing a historical cycle THEN the system SHALL display progress graphs for each metric
2. WHEN displaying graphs THEN the X-axis SHALL represent each data input by the administrator during that cycle
3. WHEN displaying graphs THEN the Y-axis SHALL represent the percentage or value achieved for each metric
4. WHEN displaying graphs THEN the system SHALL use different colors for primary and secondary goals
5. WHEN displaying graphs THEN the system SHALL indicate boost activation points on secondary goal graphs
6. WHEN no data points exist for a cycle THEN the system SHALL display an appropriate message

### Requirement 5: Dashboard Metrics Configuration Interface

**User Story:** As a system administrator, I want to configure which metrics each Carteira (dashboard) uses, so that I can customize the dashboard experience and adapt to changing business requirements.

#### Acceptance Criteria

1. WHEN an administrator accesses the dashboard configuration feature THEN the system SHALL display the current metrics configuration for all Carteiras
2. WHEN the configuration interface loads for the first time THEN the system SHALL display the current default configuration as pre-populated data
3. WHEN displaying the configuration THEN the system SHALL show primary and secondary metrics for each Carteira type
4. WHEN displaying the configuration THEN the system SHALL show associated boost mechanics and unlock conditions for each metric
5. WHEN an administrator modifies the configuration THEN the system SHALL validate that all required fields are completed

### Requirement 6: Dashboard Configuration Database Storage

**User Story:** As a system, I need to store dashboard configuration in a custom Funifier database collection, so that configurations can be persisted and retrieved across sessions.

#### Acceptance Criteria

1. WHEN saving dashboard configuration THEN the system SHALL store data in a "dashboards__c" collection in the Funifier database
2. WHEN saving configuration THEN the system SHALL include all metric definitions, boost mechanics, and unlock conditions
3. WHEN saving configuration THEN the system SHALL timestamp the configuration for version tracking
4. WHEN retrieving configuration THEN the system SHALL fetch the latest configuration from the database

### Requirement 7: Default Configuration Management

**User Story:** As a system administrator, I want the system to have a default configuration available on first use, so that I can start with the current system setup and make modifications as needed.

#### Acceptance Criteria

1. WHEN accessing the configuration feature for the first time THEN the system SHALL display current system defaults
2. WHEN no database configuration exists THEN the system SHALL use hardcoded defaults matching current system behavior
3. WHEN saving the first configuration THEN the system SHALL create the initial database record with current defaults
4. WHEN subsequent loads occur THEN the system SHALL prioritize database configuration over hardcoded defaults
5. WHEN database configuration is corrupted or unavailable THEN the system SHALL fallback to hardcoded defaults

### Requirement 8: Dynamic Dashboard Metric Application

**User Story:** As a player, I want my dashboard to reflect the current metric configuration set by administrators, so that I see the most up-to-date and relevant metrics for my team.

#### Acceptance Criteria

1. WHEN a player loads their dashboard THEN the system SHALL apply the current metric configuration from the database
2. WHEN metric configuration changes THEN the system SHALL update dashboard displays accordingly
3. WHEN displaying metrics THEN the system SHALL use the configured primary and secondary goals for each Carteira
4. WHEN calculating boosts THEN the system SHALL apply the configured boost mechanics
5. WHEN determining unlock conditions THEN the system SHALL use the configured unlock criteria

### Requirement 9: Configuration Impact on Related Systems

**User Story:** As a system administrator, I want changes to metric configuration to automatically update all related system components, so that the entire system remains consistent with the new configuration.

#### Acceptance Criteria

1. WHEN metric configuration changes THEN the system SHALL update boost calculation logic
2. WHEN metric configuration changes THEN the system SHALL update unlock/lock mechanics
3. WHEN metric configuration changes THEN the system SHALL update expanded information displays
4. WHEN metric configuration changes THEN the system SHALL update progress calculation algorithms
5. WHEN metric configuration changes THEN the system SHALL update historical data interpretation to maintain consistency

### Requirement 10: Data Migration and Backward Compatibility

**User Story:** As a system, I need to handle existing data without cycle information gracefully, so that historical data remains accessible while new cycle-based features work correctly.

#### Acceptance Criteria

1. WHEN processing existing data without cycle information THEN the system SHALL assign cycle 1 as default
2. WHEN displaying historical data THEN the system SHALL handle mixed cycle and non-cycle data appropriately
3. WHEN migrating to cycle-based system THEN the system SHALL preserve all existing player data and metrics
4. WHEN cycle information is missing THEN the system SHALL provide clear indicators in the interface
5. WHEN transitioning between cycles THEN the system SHALL maintain data integrity and player progress continuity

### Requirement 11: Enhanced Goal Details Display

**User Story:** As a player, I want the "Detalhes das Metas" accordion to show actual metric values from reports, so that I can see the real numbers behind my percentage progress.

#### Acceptance Criteria

1. WHEN a player expands the "Detalhes das Metas" accordion THEN the system SHALL display actual metric values from the latest report data
2. WHEN displaying goal details THEN the system SHALL show "Meta" (target value) and "Atual" (current value) for each metric
3. WHEN displaying Faturamento details THEN the system SHALL show target revenue and current revenue in currency format
4. WHEN displaying Reais por Ativo details THEN the system SHALL show target and current values in currency per active format
5. WHEN displaying Atividade details THEN the system SHALL show target and current activity points
6. WHEN displaying Multimarcas por Ativo details THEN the system SHALL show target and current brand count per active
7. WHEN displaying Conversões details THEN the system SHALL show target and current conversion numbers
8. WHEN displaying UPA details THEN the system SHALL show target and current UPA values
9. WHEN report data is unavailable THEN the system SHALL display appropriate fallback messages
10. WHEN displaying details THEN the system SHALL NOT duplicate the percentage information already shown in the progress bars above##
# Requirement 12: Carteira II Special Configuration Handling

**User Story:** As a system administrator, I want special warnings and validation when configuring Carteira II metrics, so that I understand the implications and don't break the local processing logic.

#### Acceptance Criteria

1. WHEN an administrator attempts to modify Carteira II configuration THEN the system SHALL display a warning about its special local processing requirements
2. WHEN configuring Carteira II THEN the system SHALL explain that this dashboard uses local calculations instead of direct Funifier API data
3. WHEN saving Carteira II configuration THEN the system SHALL validate that the new metrics are compatible with local processing logic
4. WHEN Carteira II configuration changes THEN the system SHALL require administrator confirmation acknowledging the special processing implications
5. WHEN displaying Carteira II in the configuration interface THEN the system SHALL clearly mark it as "Special Processing - Local Calculations"
6. WHEN Carteira II metrics are changed THEN the system SHALL update the local processing algorithms accordingly
7. WHEN validating Carteira II changes THEN the system SHALL ensure boost and unlock mechanics remain compatible with local processing

### Requirement 13: Percentage Calculation and Display Fix

**User Story:** As a user viewing any dashboard or interface, I want percentage values to display with proper precision, so that I see clean numbers like "13.2%" instead of "13.219999999999999%".

#### Acceptance Criteria

1. WHEN performing percentage calculations THEN the system SHALL use proper floating-point arithmetic handling to avoid precision errors
2. WHEN calculating percentages THEN the system SHALL apply the same mathematical approach used in the working Carteira I implementation
3. WHEN displaying percentage values THEN the system SHALL format to maximum 1 decimal place for display purposes
4. WHEN showing percentages in player dashboards THEN the system SHALL use consistent calculation methods across all components
5. WHEN showing percentages in admin dashboards THEN the system SHALL use consistent calculation methods across all components
6. WHEN showing percentages in historical data THEN the system SHALL use consistent calculation methods across all components
7. WHEN showing percentages in goal details THEN the system SHALL use consistent calculation methods across all components
8. WHEN displaying whole number percentages THEN the system SHALL show them without decimal places (e.g., "100%" not "100.0%")
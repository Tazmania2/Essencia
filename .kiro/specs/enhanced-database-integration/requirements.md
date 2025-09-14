# Enhanced Database Integration Requirements

## Introduction

This feature enhances the existing dashboard system to integrate with the Funifier database using the aggregate API to fetch detailed goal metrics. The system will provide comprehensive goal information including target values, current values, percentages, and deadlines, while maintaining the existing fallback mechanism from Funifier API to database records.

## Requirements

### Requirement 1: Database API Integration

**User Story:** As a system, I want to connect to the Funifier database using the aggregate API, so that I can fetch detailed player report data with authentication.

#### Acceptance Criteria

1. WHEN the system needs report data THEN it SHALL authenticate using the Basic token `Basic NjhhNjczN2E2ZTFkMGUyMTk2ZGIxYjFlOjY3ZWM0ZTRhMjMyN2Y3NGYzYTJmOTZmNQ==`
2. WHEN making database requests THEN the system SHALL use the POST endpoint `{{funifier_server}}/v3/database/:collection/aggregate?strict=true`
3. WHEN querying player data THEN the system SHALL use MongoDB aggregate syntax to find the most recent record matching the player ID
4. IF the database request fails THEN the system SHALL gracefully fallback to existing Funifier API data
5. WHEN receiving database responses THEN the system SHALL validate the data structure before processing

### Requirement 2: Enhanced Report Data Structure

**User Story:** As a developer, I want to work with comprehensive report data that includes both percentage and absolute values, so that I can display detailed goal information to users.

#### Acceptance Criteria

1. WHEN processing database records THEN the system SHALL extract percentage values for all metrics (atividade, reaisPorAtivo, faturamento, multimarcasPorAtivo)
2. WHEN processing database records THEN the system SHALL extract cycle information (diaDociclo, totalDiasCiclo)
3. WHEN a CSV URL is present THEN the system SHALL fetch and parse the CSV file to extract target and current values
4. WHEN parsing CSV data THEN the system SHALL map columns to goal metrics correctly
5. IF CSV parsing fails THEN the system SHALL continue with percentage-only data

### Requirement 3: CSV Data Processing

**User Story:** As a system, I want to parse CSV files from S3 URLs to extract detailed goal metrics, so that I can provide comprehensive goal information including targets and current values.

#### Acceptance Criteria

1. WHEN a report contains an uploadUrl THEN the system SHALL fetch the CSV file from the S3 URL
2. WHEN parsing CSV files THEN the system SHALL extract target values (Meta columns)
3. WHEN parsing CSV files THEN the system SHALL extract current values (Atual columns)
4. WHEN parsing CSV files THEN the system SHALL validate data types and handle missing values
5. IF CSV download fails THEN the system SHALL log the error and continue with available data

### Requirement 4: Enhanced Goal Details Display

**User Story:** As a player, I want to see detailed information about each goal including target values, current progress, and deadlines, so that I can better understand my performance and what I need to achieve.

#### Acceptance Criteria

1. WHEN viewing goal details THEN each goal SHALL display the target value (META)
2. WHEN viewing goal details THEN each goal SHALL display the current actual value (Valor Atual)
3. WHEN viewing goal details THEN each goal SHALL display the percentage achieved (Porcentagem alcançada)
4. WHEN viewing goal details THEN each goal SHALL display days remaining in cycle (Prazo)
5. WHEN data is incomplete THEN the system SHALL show available information and indicate missing data

### Requirement 5: Data Enhancement Integration

**User Story:** As a system, I want to enhance Funifier API data with additional database information, so that the dashboard displays complete information while maintaining Funifier API as the primary source.

#### Acceptance Criteria

1. WHEN Funifier API data is available THEN it SHALL be the primary source for percentages and basic metrics
2. WHEN database data is available THEN it SHALL supplement Funifier data with additional details (targets, current values)
3. WHEN Funifier API data is missing or incomplete THEN the system SHALL use database data as fallback
4. WHEN both data sources are available THEN the system SHALL use Funifier percentages and enhance with database details
5. WHEN data conflicts exist THEN the system SHALL prefer Funifier data for percentages and log discrepancies

### Requirement 6: Performance and Caching

**User Story:** As a user, I want the enhanced goal details to load quickly without impacting dashboard performance, so that I can access information efficiently.

#### Acceptance Criteria

1. WHEN fetching database records THEN the system SHALL implement appropriate caching with TTL
2. WHEN downloading CSV files THEN the system SHALL cache parsed results to avoid repeated downloads
3. WHEN processing fails THEN the system SHALL not block dashboard loading
4. WHEN cache expires THEN the system SHALL refresh data in the background
5. IF processing takes too long THEN the system SHALL timeout and use cached or fallback data

### Requirement 7: Error Handling and Monitoring

**User Story:** As a system administrator, I want comprehensive error handling and monitoring for database integration, so that I can identify and resolve issues quickly.

#### Acceptance Criteria

1. WHEN database authentication fails THEN the system SHALL log the error and use fallback data
2. WHEN CSV parsing fails THEN the system SHALL log specific parsing errors with context
3. WHEN data validation fails THEN the system SHALL log validation errors and use safe defaults
4. WHEN network requests fail THEN the system SHALL implement retry logic with exponential backoff
5. WHEN errors occur THEN the system SHALL provide meaningful error messages to users without exposing technical details
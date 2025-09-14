# Implementation Plan

## Overview

Simple enhancement to existing dashboard system - add database integration to fill missing data and provide goal details when available.

- [x] 1. Update database service for new auth token
  - Add method to use Basic auth token `Basic NjhhNjczN2E2ZTFkMGUyMTk2ZGIxYjFlOjY3ZWM0ZTRhMjMyN2Y3NGYzYTJmOTZmNQ==`
  - Create new method for enhanced player report with uploadUrl field
  - Leverage existing aggregateReportData method with new auth
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Add CSV processing for goal details
  - Create simple CSV parser for goal target/current values
  - Add method to fetch and parse CSV from S3 URLs in report records
  - Handle CSV parsing errors gracefully
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Enhance existing types for goal details
  - Add optional target/current/unit fields to existing goal interfaces
  - Update DashboardGoal interface to include detailed metrics
  - Keep changes minimal and backward compatible
  - _Requirements: 2.1, 2.2, 4.1, 4.2_

- [x] 4. Update team processors to use enhanced data
  - Modify existing team processors to use database data when Funifier data is missing
  - Add CSV goal details to existing goal metrics when available
  - Maintain existing fallback logic, just enhance it
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 5. Update goal cards to show detailed information
  - Enhance existing GoalCard component to display target/current values when available
  - Update GoalDetailsAccordion to show META, Valor Atual, Porcentagem, Prazo
  - Add simple loading states for CSV processing
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Add basic caching for database requests
  - Cache database aggregate results for 5 minutes
  - Cache parsed CSV data for 15 minutes
  - Use existing cache service, just add new cache keys
  - _Requirements: 6.1, 6.2_

- [x] 7. Add error handling for database integration

  - Log database errors and continue with existing Funifier data
  - Handle CSV download/parsing failures gracefully
  - Ensure dashboard never breaks due to database issues
  - _Requirements: 7.1, 7.2, 7.3_

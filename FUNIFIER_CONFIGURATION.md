# Funifier Configuration Guide

This document provides a complete overview of the Funifier gamification configuration for the Essencia dashboard.

## Team Configuration

### Team IDs (from Funifier API)
```typescript
TEAM_IDS: {
  CARTEIRA_I: 'E6F4sCh',    // Carteira Bronze
  CARTEIRA_II: 'E6F4O1b',   // Carteira Prata  
  CARTEIRA_III: 'E6F4Xf2',  // Carteira Ouro
  CARTEIRA_IV: 'E6F41Bb'    // Carteira VIP
}
```

## Challenge Configuration

### Challenge IDs by Team and Goal

#### Carteira I (E6F4sCh) - Carteira Bronze
- **Primary Goal: Atividade**
  - `E6FO12f` - Carteira I - Subir Atividade (Pré Meta)
  - `E6FQIjs` - Carteira I - Bater Meta Atividade %
  - `E6KQAoh` - Carteira I - Subir Atividade (Pós-Meta)

- **Secondary Goal 1: Reais por Ativo**
  - `E6Gm8RI` - Carteira I, III & IV - Subir Reais por Ativo
  - `E6Gke5g` - Carteira I, III & IV - Descer Reais Ativo

- **Secondary Goal 2: Faturamento**
  - `E6GglPq` - Carteira I - Bater Faturamento (Meta)
  - `E6LIVVX` - Carteira I - Perder Faturamento (Meta)

#### Carteira II (E6F4O1b) - Carteira Prata
- **Primary Goal: Reais por Ativo** (controls point unlock at 100%)
  - `E6MTIIK` - Carteira II - Subir Reais por Ativo

- **Secondary Goal 1: Atividade**
  - `E6Gv58l` - Carteira II - Subir Atividade
  - `E6MZw2L` - Carteira II - Perder Atividade

- **Secondary Goal 2: Multimarcas por Ativo**
  - `E6MWJKs` - Carteira II - Subir Multimarcas por Ativo
  - `E6MWYj3` - Carteira II - Perder Multimarcas por Ativo

#### Carteira III (E6F4Xf2) - Carteira Ouro
- **Primary Goal: Faturamento**
  - `E6F8HMK` - Carteira III & IV - Bater Meta Faturamento
  - `E6Gahd4` - Carteira III & IV - Subir Faturamento (Pre-Meta)
  - `E6MLv3L` - Carteira III & IV - Subir Faturamento (Pós-Meta)

- **Secondary Goal 1: Reais por Ativo**
  - `E6Gm8RI` - Carteira I, III & IV - Subir Reais por Ativo
  - `E6Gke5g` - Carteira I, III & IV - Descer Reais Ativo

- **Secondary Goal 2: Multimarcas por Ativo**
  - `E6MMH5v` - Carteira III & IV - Subir Multimarcas por Ativo
  - `E6MM3eK` - Carteira III & IV - Perder Multimarcas por Ativo

#### Carteira IV (E6F41Bb) - Carteira VIP
- **Primary Goal: Faturamento**
  - `E6F8HMK` - Carteira III & IV - Bater Meta Faturamento
  - `E6Gahd4` - Carteira III & IV - Subir Faturamento (Pre-Meta)
  - `E6MLv3L` - Carteira III & IV - Subir Faturamento (Pós-Meta)

- **Secondary Goal 1: Reais por Ativo**
  - `E6Gm8RI` - Carteira I, III & IV - Subir Reais por Ativo
  - `E6Gke5g` - Carteira I, III & IV - Descer Reais Ativo

- **Secondary Goal 2: Multimarcas por Ativo**
  - `E6MMH5v` - Carteira III & IV - Subir Multimarcas por Ativo
  - `E6MM3eK` - Carteira III & IV - Perder Multimarcas por Ativo

## Catalog Items Configuration

### Points and Boost Items
```typescript
CATALOG_ITEMS: {
  UNLOCK_POINTS: 'E6F0O5f',     // Unlocks points when present
  LOCK_POINTS: 'E6F0MJ3',       // Locks points when present
  BOOST_SECONDARY_1: 'E6F0WGc', // Boost for secondary goal 1
  BOOST_SECONDARY_2: 'E6K79Mt'  // Boost for secondary goal 2
}
```

## Action IDs

### Funifier Actions
```typescript
ACTION_IDS: {
  ATIVIDADE: 'atividade',
  REAIS_POR_ATIVO: 'reais_por_ativo',
  FATURAMENTO: 'faturamento',
  MULTIMARCAS_POR_ATIVO: 'multimarcas_por_ativo'
}
```

## Business Logic by Team

### Carteira I (Bronze)
- **Points Logic**: Standard Funifier points system
- **Unlock Logic**: Points unlock when Atividade >= 100%
- **Data Priority**: Report data > Challenge progress > Default
- **Boost Logic**: Standard boost from catalog_items

### Carteira II (Prata) - Special Case
- **Points Logic**: Local calculation with boost multipliers
- **Unlock Logic**: Points unlock when Reais por Ativo >= 100%
- **Boost Multipliers**: +100% per active boost (max 200% with both)
- **Final Points**: `base_points × (1 + boost_multipliers)` only if unlocked
- **Data Priority**: Collection/report data > Challenge progress > Default

### Carteira III & IV (Ouro & VIP)
- **Points Logic**: Standard Funifier points system
- **Unlock Logic**: Points unlock when Faturamento >= 100%
- **Data Priority**: Challenge progress > Report data > Default
- **Boost Logic**: Standard boost from catalog_items

## Progress Bar System

### Color Logic
- **0-50%**: Red color (0-33% fill)
- **50-100%**: Yellow color (33-66% fill)
- **100-150%**: Green color (66-100% fill)

### Implementation
```typescript
calculateProgressBar(percentage: number): ProgressBarConfig {
  if (percentage <= 50) {
    return { percentage, color: 'red', fillPercentage: (percentage / 50) * 33.33 };
  } else if (percentage <= 100) {
    return { percentage, color: 'yellow', fillPercentage: 33.33 + ((percentage - 50) / 50) * 33.33 };
  } else {
    return { percentage, color: 'green', fillPercentage: 66.66 + ((Math.min(percentage, 150) - 100) / 50) * 33.34 };
  }
}
```

## Data Flow

### Player Status Data
1. **Team Detection**: Use `player.teams` array with actual team IDs
2. **Challenge Progress**: Extract from `player.challenge_progress` using challenge IDs
3. **Catalog Items**: Check boost/unlock status from `player.catalog_items`
4. **Points**: Use `player.total_points` as base for calculations

### Report Data (Fallback)
- Used when challenge progress is not available
- Contains percentage values for each goal type
- Includes cycle information (current day, total days)

## API Integration

### Key Endpoints
- `GET /v3/player/:id/status` - Get player status with challenge progress
- `GET /v3/challenge` - List all challenges
- `GET /v3/team` - List all teams
- `GET /v3/virtualgoods/item` - List catalog items

### Authentication
- Uses API key: `68a6737a6e1d0e2196db1b1e`
- Base URL: `https://service2.funifier.com/v3`

## Usage Examples

### Processing Player Data
```typescript
import { teamProcessorFactory, TeamType } from './services';

// Auto-detect team and process
const result = teamProcessorFactory.processPlayerDataAuto(playerData, reportData);

// Or specify team type
const metrics = teamProcessorFactory.processPlayerData(
  TeamType.CARTEIRA_II, 
  playerData, 
  reportData
);
```

### Team-Specific Processing
```typescript
import { carteiraIIProcessor } from './services';

// Get detailed analysis for Carteira II
const analysis = carteiraIIProcessor.analyzeCarteiraIIData(playerData, reportData);

// Simulate different boost scenarios
const scenarios = carteiraIIProcessor.simulateCarteiraIIScenarios(1000, 110);
```

## Configuration Validation

### Using FunifierConfigService
```typescript
import { funifierConfigService } from './services';

// Get comprehensive configuration report
const report = await funifierConfigService.getConfigurationReport();

// Verify team configuration
const teamVerification = await funifierConfigService.verifyTeamConfiguration();

// Generate challenge mapping suggestions
const suggestions = await funifierConfigService.generateChallengeMappingSuggestion();
```

This configuration is now fully integrated with your actual Funifier instance and ready for production use.
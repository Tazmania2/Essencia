# Technical Architecture Documentation

## 🏗️ System Architecture Overview

The Funifier Gamification Dashboard is built as a modern, scalable web application using Next.js 14 with a service-oriented architecture that integrates deeply with the Funifier platform.

## 🎯 Architecture Principles

### 1. **Separation of Concerns**
- **Presentation Layer**: React components with TypeScript
- **Business Logic Layer**: Service classes with domain-specific logic
- **Data Access Layer**: Funifier API integration services
- **Configuration Layer**: Dynamic dashboard configuration system

### 2. **Team-Specific Processing**
Each team type has its own processor implementing a common interface:
```typescript
interface TeamProcessor {
  processPlayerData(rawData: FunifierPlayerStatus, reportData?: EssenciaReportRecord): PlayerMetrics;
}
```

### 3. **Configuration-Driven Behavior**
The system uses a dynamic configuration system that allows runtime customization without code changes.

## 🔧 Core Services Architecture

### Service Layer Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Dashboard       │  │ Configuration   │  │ Report      │ │
│  │ Service         │  │ Service         │  │ Processing  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                     │                   │       │
│           ▼                     ▼                   ▼       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Team Processor  │  │ Funifier        │  │ CSV         │ │
│  │ Factory         │  │ Database        │  │ Processing  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                     │                   │       │
│           ▼                     ▼                   ▼       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Individual      │  │ Funifier API    │  │ Action Log  │ │
│  │ Team Processors │  │ Service         │  │ Service     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🎮 Team Processing Architecture

### Team Processor Pattern

Each team type implements specific business logic while sharing common interfaces:

```typescript
// Base Team Processor
abstract class BaseTeamProcessor implements TeamProcessor {
  protected calculatePointsLocked(catalogItems: Record<string, number>): boolean;
  protected calculateDisplayPoints(rawData: FunifierPlayerStatus, pointsLocked: boolean): number;
  protected getBoostStatus(catalogItems: Record<string, number>): BoostStatus;
  
  abstract processPlayerData(rawData: FunifierPlayerStatus, reportData?: EssenciaReportRecord): PlayerMetrics;
}

// Team-Specific Implementations
class Carteira0Processor extends BaseTeamProcessor { /* Conversões logic */ }
class CarteiraIProcessor extends BaseTeamProcessor { /* Activity logic */ }
class CarteiraIIProcessor extends BaseTeamProcessor { /* Local processing with multipliers */ }
class CarteiraIIIIVProcessor extends BaseTeamProcessor { /* Revenue focus logic */ }
class ERProcessor extends BaseTeamProcessor { /* Relationship team logic */ }
```

### Team Processor Factory

```typescript
class TeamProcessorFactory {
  static createProcessor(teamType: TeamType): TeamProcessor {
    switch (teamType) {
      case TeamType.CARTEIRA_0: return new Carteira0Processor();
      case TeamType.CARTEIRA_I: return new CarteiraIProcessor();
      case TeamType.CARTEIRA_II: return new CarteiraIIProcessor();
      case TeamType.CARTEIRA_III:
      case TeamType.CARTEIRA_IV: return new CarteiraIIIIVProcessor();
      case TeamType.ER: return new ERProcessor();
      default: throw new Error(`Unknown team type: ${teamType}`);
    }
  }
}
```

## 📊 Data Flow Architecture

### Dashboard Data Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Request  │───▶│ Authentication  │───▶│ Team Detection  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Dashboard       │◀───│ Configuration   │◀───│ Cache Check     │
│ Rendering       │    │ Loading         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                                              │
         │                                              ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Team Processor  │◀───│ Data Fetching   │◀───│ Funifier API    │
│ Execution       │    │ (Player Status) │    │ Call            │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Report Processing Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CSV Upload    │───▶│ File Validation │───▶│ Data Parsing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Action Log      │◀───│ Change          │◀───│ Data Storage    │
│ Generation      │    │ Comparison      │    │ (Database)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       ▲
         ▼                       │
┌─────────────────┐    ┌─────────────────┐
│ Funifier API    │───▶│ Aggregation     │
│ Submission      │    │ Pipeline Query  │
└─────────────────┘    └─────────────────┘
```

## 🔧 Configuration System Architecture

### Dynamic Configuration Pattern

```typescript
interface DashboardConfigurationRecord {
  _id?: string;
  version: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  configurations: {
    [key in TeamType]: DashboardConfig;
  };
}

interface DashboardConfig {
  teamType: TeamType;
  displayName: string;
  primaryGoal: GoalConfig;
  secondaryGoal1: GoalConfig;
  secondaryGoal2: GoalConfig;
  unlockConditions: UnlockConfig;
  specialProcessing?: SpecialProcessingConfig;
}
```

### Configuration Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Configuration Service                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Cache Layer     │  │ Validation      │  │ Default     │ │
│  │ (5 min TTL)     │  │ Service         │  │ Config      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                     │                   │       │
│           ▼                     ▼                   ▼       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            Funifier Database Service                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │         Funifier API (dashboard__c collection)         │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Security Architecture

### Authentication Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ User Login      │───▶│ Funifier Auth   │───▶│ Token           │
│ (Username/Pass) │    │ API             │    │ Generation      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Dashboard       │◀───│ Role Detection  │◀───│ JWT Token       │
│ Access          │    │ (Admin/Player)  │    │ Validation      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### API Security Layers

1. **Environment Variable Protection**: Sensitive keys stored securely
2. **Token-based Authentication**: JWT tokens for session management
3. **Role-based Authorization**: Admin vs. Player access control
4. **Input Validation**: Comprehensive data validation
5. **Error Handling**: Secure error messages without data exposure

## 📈 Caching Architecture

### Multi-Level Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Caching Layers                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Dashboard Data  │  │ Configuration   │  │ Player Data │ │
│  │ Cache           │  │ Cache           │  │ Cache       │ │
│  │ (5 min TTL)     │  │ (5 min TTL)     │  │ (2 min TTL) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                     │                   │       │
│           ▼                     ▼                   ▼       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Cache Service                              │ │
│  │  • Version-aware cache keys                             │ │
│  │  • TTL-based expiration                                 │ │
│  │  • Memory-based storage                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Cache Key Strategy

```typescript
class CacheKeys {
  static dashboardData(playerId: string, teamType: string): string {
    return `dashboard:${playerId}:${teamType}`;
  }
  
  static playerData(playerId: string): string {
    return `player:${playerId}`;
  }
  
  static configuration(version: string): string {
    return `config:${version}`;
  }
}
```

## 🔄 Data Processing Architecture

### CSV Processing Pipeline

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ File Upload     │───▶│ Format          │───▶│ Field           │
│                 │    │ Validation      │    │ Validation      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Action Log      │◀───│ Change          │◀───│ Data            │
│ Generation      │    │ Detection       │    │ Transformation  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       ▲                       │
         ▼                       │                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Funifier API    │    │ Aggregation     │    │ Database        │
│ Submission      │    │ Query           │    │ Storage         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Aggregation Pipeline Architecture

The system uses MongoDB-style aggregation pipelines for efficient data queries:

```typescript
// Example aggregation pipeline for latest player data
const pipeline = [
  {
    $match: { 
      cycleNumber: cycleNumber,
      status: "REGISTERED",
      time: { $exists: true }
    }
  },
  {
    $sort: { time: -1 } // Latest first
  },
  {
    $group: {
      _id: "$playerId",
      latestRecord: { $first: "$ROOT" } // Get latest for each player
    }
  },
  {
    $replaceRoot: { newRoot: "$latestRecord" }
  }
];
```

## 🚀 Performance Architecture

### Performance Optimization Strategies

1. **Lazy Loading**: Components loaded on demand
2. **Code Splitting**: Route-based code splitting
3. **Image Optimization**: Next.js Image component
4. **API Optimization**: Efficient data fetching patterns
5. **Caching**: Multi-level caching strategy

### Database Query Optimization

```typescript
// Optimized query patterns
class OptimizedQueries {
  // Use aggregation instead of simple filters
  static getLatestPlayerData(cycleNumber: number) {
    return aggregationPipeline; // More efficient than filter + sort
  }
  
  // Indexed queries for better performance
  static getPlayersByTeam(teamId: string) {
    return { teams: teamId }; // Assumes teams field is indexed
  }
}
```

## 🔧 Error Handling Architecture

### Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                 Error Handling Layers                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Component       │  │ Service Layer   │  │ API Layer   │ │
│  │ Error           │  │ Error           │  │ Error       │ │
│  │ Boundaries      │  │ Handling        │  │ Handling    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                     │                   │       │
│           ▼                     ▼                   ▼       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Error Handler Service                      │ │
│  │  • Centralized error processing                         │ │
│  │  • User-friendly error messages                         │ │
│  │  • Secure error logging                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Error Types and Handling

```typescript
enum ErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  FUNIFIER_API_ERROR = 'FUNIFIER_API_ERROR',
  DATA_PROCESSING_ERROR = 'DATA_PROCESSING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

class ApiError extends Error {
  public readonly type: ErrorType;
  public readonly details?: any;
  public readonly timestamp: Date;
}
```

## 📊 Monitoring and Observability

### Logging Architecture

```typescript
class SecureLogger {
  static log(message: string, data?: any): void {
    // Secure logging without sensitive data exposure
    console.log(`[${new Date().toISOString()}] ${message}`, 
      this.sanitizeData(data));
  }
  
  private static sanitizeData(data: any): any {
    // Remove sensitive information before logging
    return this.removeSensitiveFields(data);
  }
}
```

### Performance Monitoring

- **API Response Times**: Track API call performance
- **Component Render Times**: Monitor component performance
- **Cache Hit Rates**: Monitor caching effectiveness
- **Error Rates**: Track error frequency and types

## 🔮 Scalability Considerations

### Horizontal Scaling

1. **Stateless Services**: All services are stateless for easy scaling
2. **Database Scaling**: Funifier platform handles database scaling
3. **CDN Integration**: Static assets served via CDN
4. **Load Balancing**: Vercel handles load balancing automatically

### Vertical Scaling

1. **Memory Management**: Efficient memory usage patterns
2. **CPU Optimization**: Optimized algorithms and data structures
3. **I/O Optimization**: Efficient API calls and data processing

## 🛠️ Development Architecture

### Development Workflow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Local           │───▶│ Type Checking   │───▶│ Linting &       │
│ Development     │    │ (TypeScript)    │    │ Formatting      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Production      │◀───│ Build &         │◀───│ Testing         │
│ Deployment      │    │ Optimization    │    │ (Unit/E2E)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Code Organization Principles

1. **Domain-Driven Design**: Services organized by business domain
2. **Single Responsibility**: Each service has a single, well-defined purpose
3. **Dependency Injection**: Services depend on abstractions, not concretions
4. **Interface Segregation**: Small, focused interfaces
5. **Open/Closed Principle**: Open for extension, closed for modification

This technical architecture provides a solid foundation for the Funifier Gamification Dashboard, ensuring scalability, maintainability, and performance while integrating seamlessly with the Funifier platform.
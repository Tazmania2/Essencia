# API Documentation

## 🌐 Overview

The Funifier Gamification Dashboard provides a comprehensive REST API built on Next.js API routes that integrate with the Funifier platform. This documentation covers all available endpoints, request/response formats, and integration patterns.

## 🔐 Authentication

### Authentication Flow

All API endpoints require authentication via JWT tokens obtained through the login process.

```typescript
// Authentication header format
headers: {
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

### Login Endpoint

**POST** `/api/auth/login`

Authenticates a user and returns a JWT token.

```typescript
// Request
{
  "username": "user@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "player123",
    "name": "John Doe",
    "teams": ["E6F4sCh"],
    "role": {
      "isAdmin": false,
      "isPlayer": true
    }
  }
}
```

## 🎮 Player Dashboard APIs

### Get Dashboard Data

**GET** `/api/dashboard/[playerId]`

Returns complete dashboard data for a specific player.

**Parameters:**
- `playerId` (string): The player's unique identifier
- `teamType` (query, optional): Specific team type to load

```typescript
// Request
GET /api/dashboard/player123?teamType=CARTEIRA_I

// Response
{
  "success": true,
  "data": {
    "playerId": "player123",
    "playerName": "John Doe",
    "totalPoints": 15420,
    "pointsLocked": false,
    "currentCycleDay": 12,
    "totalCycleDays": 30,
    "isDataFromCollection": true,
    "primaryGoal": {
      "name": "Atividade",
      "percentage": 85,
      "description": "Meta principal de atividade",
      "emoji": "🎯",
      "target": 100,
      "current": 85,
      "unit": "pontos",
      "daysRemaining": 18
    },
    "secondaryGoal1": {
      "name": "Reais por Ativo",
      "percentage": 72,
      "description": "Meta secundária 1",
      "emoji": "💰",
      "hasBoost": true,
      "isBoostActive": true,
      "target": 1000,
      "current": 720,
      "unit": "R$",
      "daysRemaining": 18
    },
    "secondaryGoal2": {
      "name": "Faturamento",
      "percentage": 65,
      "description": "Meta secundária 2",
      "emoji": "📈",
      "hasBoost": true,
      "isBoostActive": false,
      "target": 50000,
      "current": 32500,
      "unit": "R$",
      "daysRemaining": 18
    },
    "goalDetails": [
      {
        "title": "Atividade",
        "items": [
          "Meta: 100 pontos",
          "Atual: 85 pontos",
          "Progresso: 85%"
        ],
        "bgColor": "bg-blue-100",
        "textColor": "text-blue-800"
      }
    ]
  }
}
```

### Get Player Status

**GET** `/api/player/status/[playerId]`

Returns raw Funifier player status data.

```typescript
// Response
{
  "success": true,
  "data": {
    "_id": "player123",
    "name": "John Doe",
    "total_points": 15420,
    "point_categories": {
      "pontos_da_temporada": 14200,
      "locked_points": 1220
    },
    "catalog_items": {
      "E6F0O5f": 1,  // Points unlocked
      "E6F0WGc": 0,  // Boost 1 inactive
      "E6K79Mt": 1   // Boost 2 active
    },
    "challenge_progress": [
      {
        "challenge": "E6FQIjs",
        "percent_completed": 85
      }
    ],
    "teams": ["E6F4sCh"],
    "time": 1696320000000
  }
}
```

### Get Player Teams

**GET** `/api/auth/teams/[playerId]`

Returns all teams a player belongs to.

```typescript
// Response
{
  "success": true,
  "teams": [
    {
      "id": "E6F4sCh",
      "name": "Carteira I",
      "type": "CARTEIRA_I",
      "isAdmin": false
    },
    {
      "id": "E6U1B1p",
      "name": "Admin",
      "type": "ADMIN",
      "isAdmin": true
    }
  ]
}
```

## 📊 History APIs

### Get Cycle History

**GET** `/api/history/[playerId]`

Returns historical cycle data for a player.

**Parameters:**
- `playerId` (string): The player's unique identifier
- `teamType` (query, optional): Filter by team type

```typescript
// Response
{
  "success": true,
  "data": [
    {
      "cycleNumber": 14,
      "startDate": "2024-01-01",
      "endDate": "2024-01-31",
      "totalDays": 31,
      "completionStatus": "completed",
      "finalMetrics": {
        "primaryGoal": {
          "name": "Atividade",
          "percentage": 95,
          "target": 100,
          "current": 95,
          "unit": "pontos",
          "boostActive": false
        },
        "secondaryGoal1": {
          "name": "Reais por Ativo",
          "percentage": 88,
          "target": 1000,
          "current": 880,
          "unit": "R$",
          "boostActive": true
        },
        "secondaryGoal2": {
          "name": "Faturamento",
          "percentage": 76,
          "target": 50000,
          "current": 38000,
          "unit": "R$",
          "boostActive": false
        }
      },
      "progressTimeline": [
        {
          "date": "2024-01-05",
          "dayInCycle": 5,
          "uploadSequence": 1,
          "metrics": {
            "primaryGoal": 25,
            "secondaryGoal1": 30,
            "secondaryGoal2": 20
          }
        }
      ]
    }
  ]
}
```

## 🛠️ Admin APIs

### Player Management

#### Get All Players

**GET** `/api/admin/players`

Returns all players with detailed information.

**Query Parameters:**
- `search` (string, optional): Search by name or ID
- `team` (string, optional): Filter by team ID
- `limit` (number, optional): Limit results (default: 50)
- `offset` (number, optional): Pagination offset

```typescript
// Response
{
  "success": true,
  "data": {
    "players": [
      {
        "_id": "player123",
        "name": "John Doe",
        "email": "john@example.com",
        "image": {
          "small": { "url": "https://..." },
          "medium": { "url": "https://..." }
        },
        "teams": [
          {
            "id": "E6F4sCh",
            "name": "Carteira I",
            "isAdmin": false
          }
        ],
        "status": {
          "total_points": 15420,
          "point_categories": {
            "pontos_da_temporada": 14200,
            "locked_points": 1220
          },
          "total_challenges": 5,
          "challenges_completed": 3,
          "total_catalog_items": 8,
          "last_activity": "2024-01-15T10:30:00Z"
        },
        "reportCount": 12
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### Create Player

**POST** `/api/admin/players`

Creates a new player in the Funifier platform.

```typescript
// Request
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "teams": ["E6F4sCh"],
  "extra": {
    "department": "Sales",
    "region": "North"
  }
}

// Response
{
  "success": true,
  "data": {
    "_id": "player456",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "teams": ["E6F4sCh"],
    "created": 1696320000000
  }
}
```

#### Update Player

**PUT** `/api/admin/players/[playerId]`

Updates an existing player.

```typescript
// Request
{
  "name": "Jane Smith",
  "teams": ["E6F4sCh", "E6F4O1b"],
  "extra": {
    "department": "Marketing"
  }
}

// Response
{
  "success": true,
  "data": {
    "_id": "player456",
    "name": "Jane Smith",
    "teams": ["E6F4sCh", "E6F4O1b"],
    "updated": 1696320060000
  }
}
```

#### Delete Player

**DELETE** `/api/admin/players/[playerId]`

Deletes a player from the Funifier platform.

```typescript
// Response
{
  "success": true,
  "message": "Player deleted successfully"
}
```

### Report Management

#### Upload CSV Report

**POST** `/api/reports/upload`

Processes a CSV report upload.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file`: CSV file
- `cycleNumber`: Cycle number (integer)
- `forceFirst`: Force first upload flag (boolean)

```typescript
// Response (Success)
{
  "success": true,
  "data": {
    "processedRecords": 25,
    "actionLogsGenerated": 48,
    "cycleNumber": 14,
    "uploadTime": "2024-01-15T10:30:00Z",
    "summary": {
      "newPlayers": 2,
      "updatedPlayers": 23,
      "errors": 0,
      "warnings": 1
    }
  }
}

// Response (Validation Error)
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "details": {
    "invalidRows": [
      {
        "row": 3,
        "playerId": "invalid_player",
        "errors": ["Player ID not found", "Invalid percentage value"]
      }
    ],
    "missingFields": ["Faturamento Meta", "Atividade Atual"],
    "suggestions": [
      "Verify player IDs exist in Funifier",
      "Check percentage values are between 0-100"
    ]
  }
}
```

#### Get Report History

**GET** `/api/reports/history`

Returns upload history and statistics.

**Query Parameters:**
- `cycleNumber` (number, optional): Filter by cycle
- `limit` (number, optional): Limit results
- `offset` (number, optional): Pagination offset

```typescript
// Response
{
  "success": true,
  "data": {
    "uploads": [
      {
        "id": "upload_123",
        "cycleNumber": 14,
        "uploadTime": "2024-01-15T10:30:00Z",
        "processedRecords": 25,
        "actionLogsGenerated": 48,
        "uploadedBy": "admin@example.com",
        "status": "completed"
      }
    ],
    "statistics": {
      "totalUploads": 15,
      "totalRecordsProcessed": 375,
      "totalActionLogs": 720,
      "averageProcessingTime": "2.3s"
    }
  }
}
```

### Configuration Management

#### Get Dashboard Configuration

**GET** `/api/admin/configuration`

Returns current dashboard configuration.

```typescript
// Response
{
  "success": true,
  "data": {
    "_id": "dashboard_config_v1",
    "version": "1.2.0",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "createdBy": "admin@example.com",
    "configurations": {
      "CARTEIRA_I": {
        "teamType": "CARTEIRA_I",
        "displayName": "Carteira I",
        "primaryGoal": {
          "name": "atividade",
          "displayName": "Atividade",
          "metric": "atividade",
          "challengeId": "E6FQIjs",
          "actionId": "atividade",
          "calculationType": "funifier_api",
          "emoji": "🎯",
          "unit": "pontos",
          "csvField": "atividade",
          "description": "Meta principal de atividade"
        },
        "secondaryGoal1": {
          "name": "reaisPorAtivo",
          "displayName": "Reais por Ativo",
          "metric": "reaisPorAtivo",
          "challengeId": "E6Gm8RI",
          "actionId": "reais_por_ativo",
          "calculationType": "funifier_api",
          "emoji": "💰",
          "unit": "R$",
          "csvField": "reaisPorAtivo",
          "description": "Meta secundária 1",
          "boost": {
            "catalogItemId": "E6F0WGc",
            "name": "Boost Meta Secundária 1",
            "description": "Boost para meta secundária 1"
          }
        },
        "secondaryGoal2": {
          "name": "faturamento",
          "displayName": "Faturamento",
          "metric": "faturamento",
          "challengeId": "E6GglPq",
          "actionId": "faturamento",
          "calculationType": "funifier_api",
          "emoji": "📈",
          "unit": "R$",
          "csvField": "faturamento",
          "description": "Meta secundária 2",
          "boost": {
            "catalogItemId": "E6K79Mt",
            "name": "Boost Meta Secundária 2",
            "description": "Boost para meta secundária 2"
          }
        },
        "unlockConditions": {
          "catalogItemId": "E6F0O5f",
          "description": "Desbloqueio de pontos"
        }
      }
    }
  }
}
```

#### Save Dashboard Configuration

**POST** `/api/admin/configuration`

Saves dashboard configuration.

```typescript
// Request
{
  "createdBy": "admin@example.com",
  "configurations": {
    "CARTEIRA_I": {
      // Configuration object as shown above
    }
  }
}

// Response
{
  "success": true,
  "data": {
    "_id": "dashboard_config_v2",
    "version": "1.3.0",
    "saved": true,
    "validationResult": {
      "isValid": true,
      "errors": [],
      "warnings": []
    }
  }
}
```

#### Export Configuration

**GET** `/api/admin/configuration/export`

Exports configuration as JSON file.

```typescript
// Response (File Download)
Content-Type: application/json
Content-Disposition: attachment; filename="dashboard-config-v1.2.0.json"

{
  // Complete configuration object
}
```

#### Import Configuration

**POST** `/api/admin/configuration/import`

Imports configuration from JSON file.

**Content-Type:** `multipart/form-data`

```typescript
// Response
{
  "success": true,
  "data": {
    "imported": true,
    "version": "1.4.0",
    "validationResult": {
      "isValid": true,
      "errors": [],
      "warnings": [
        "Challenge ID E6FQIjs not verified in Funifier"
      ]
    }
  }
}
```

### Cycle Management

#### Get Cycle Change Status

**GET** `/api/admin/cycle-change/status`

Returns current cycle change process status.

```typescript
// Response
{
  "success": true,
  "data": {
    "isRunning": false,
    "currentStep": null,
    "progress": 0,
    "lastExecution": {
      "startTime": "2024-01-01T00:00:00Z",
      "endTime": "2024-01-01T00:15:00Z",
      "status": "completed",
      "stepsCompleted": 4,
      "totalSteps": 4
    }
  }
}
```

#### Start Cycle Change

**POST** `/api/admin/cycle-change/start`

Initiates the cycle change process.

```typescript
// Response
{
  "success": true,
  "data": {
    "processId": "cycle_change_20240115",
    "started": true,
    "estimatedDuration": "10-15 minutes",
    "steps": [
      {
        "id": 1,
        "name": "Transferir pontos desbloqueados",
        "schedulerId": "68e7f93a06f77c5c2aad34f1",
        "status": "pending"
      },
      {
        "id": 2,
        "name": "Limpar pontos bloqueados",
        "schedulerId": "68e7f8be06f77c5c2aad34d5",
        "status": "pending"
      },
      {
        "id": 3,
        "name": "Resetar action logs",
        "schedulerId": "68de22de06f77c5c2aa9d2b6",
        "status": "pending"
      },
      {
        "id": 4,
        "name": "Limpar itens virtuais",
        "schedulerId": "68e803cf06f77c5c2aad37bc",
        "status": "pending"
      }
    ]
  }
}
```

#### Cancel Cycle Change

**POST** `/api/admin/cycle-change/cancel`

Cancels the running cycle change process.

```typescript
// Response
{
  "success": true,
  "data": {
    "cancelled": true,
    "message": "Cycle change process cancelled successfully"
  }
}
```

## 🔍 Health Check APIs

### System Health

**GET** `/api/health`

Returns system health status.

```typescript
// Response
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "funifier_api": {
      "status": "healthy",
      "responseTime": "150ms",
      "lastCheck": "2024-01-15T10:29:45Z"
    },
    "database": {
      "status": "healthy",
      "responseTime": "50ms",
      "lastCheck": "2024-01-15T10:29:45Z"
    },
    "cache": {
      "status": "healthy",
      "hitRate": "85%",
      "lastCheck": "2024-01-15T10:29:45Z"
    }
  },
  "version": "1.0.0",
  "environment": "production"
}
```

## 🚨 Error Handling

### Error Response Format

All API endpoints follow a consistent error response format:

```typescript
// Error Response
{
  "success": false,
  "error": "ERROR_TYPE",
  "message": "Human-readable error message",
  "details": {
    // Additional error details
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### Error Types

| Error Type | HTTP Status | Description |
|------------|-------------|-------------|
| `AUTHENTICATION_ERROR` | 401 | Invalid or expired token |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `NOT_FOUND` | 404 | Resource not found |
| `FUNIFIER_API_ERROR` | 502 | Funifier API error |
| `DATA_PROCESSING_ERROR` | 500 | Data processing failure |
| `NETWORK_ERROR` | 503 | Network connectivity issue |
| `RATE_LIMIT_ERROR` | 429 | Too many requests |

### Example Error Responses

```typescript
// Authentication Error
{
  "success": false,
  "error": "AUTHENTICATION_ERROR",
  "message": "Invalid or expired token",
  "details": {
    "tokenExpired": true,
    "expiredAt": "2024-01-15T09:30:00Z"
  }
}

// Validation Error
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": {
    "fields": [
      {
        "field": "cycleNumber",
        "message": "Must be a positive integer",
        "value": -1
      }
    ]
  }
}

// Funifier API Error
{
  "success": false,
  "error": "FUNIFIER_API_ERROR",
  "message": "Funifier API returned an error",
  "details": {
    "funifierError": "Player not found",
    "funifierCode": "PLAYER_NOT_FOUND",
    "endpoint": "/v3/player/invalid_id"
  }
}
```

## 📊 Rate Limiting

### Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|---------|
| Authentication | 10 requests | 1 minute |
| Dashboard Data | 60 requests | 1 minute |
| Admin Operations | 30 requests | 1 minute |
| File Uploads | 5 requests | 1 minute |
| Configuration | 20 requests | 1 minute |

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1696320060
```

## 🔧 SDK and Integration Examples

### JavaScript/TypeScript SDK Example

```typescript
class FunifierDashboardAPI {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async getDashboardData(playerId: string, teamType?: string) {
    const url = `${this.baseUrl}/api/dashboard/${playerId}${teamType ? `?teamType=${teamType}` : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  async uploadReport(file: File, cycleNumber: number, forceFirst: boolean = false) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cycleNumber', cycleNumber.toString());
    formData.append('forceFirst', forceFirst.toString());

    const response = await fetch(`${this.baseUrl}/api/reports/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
    return response.json();
  }
}

// Usage
const api = new FunifierDashboardAPI('https://your-domain.vercel.app', 'your-jwt-token');
const dashboardData = await api.getDashboardData('player123', 'CARTEIRA_I');
```

This API documentation provides comprehensive coverage of all available endpoints, request/response formats, and integration patterns for the Funifier Gamification Dashboard system.
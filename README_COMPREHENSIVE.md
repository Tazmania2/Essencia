# Funifier Gamification Dashboard - Complete System Documentation

## 🎯 Overview

The **Funifier Gamification Dashboard** is a comprehensive Next.js application designed for Grupo Essência (O Boticário distributor) that provides gamification management and visualization capabilities. The system integrates with the Funifier platform to deliver personalized dashboards for different team types and comprehensive administrative tools.

## 🏗️ System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                   │
├─────────────────────────────────────────────────────────────┤
│  • Player Dashboards (6 team types)                        │
│  • Admin Interface (Configuration, Reports, Players)       │
│  • Authentication & Team Selection                         │
│  • History & Analytics Views                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│  • Team Processors (Business Logic)                        │
│  • Dashboard Configuration Service                         │
│  • Report Processing & Comparison                          │
│  • CSV Data Processing                                     │
│  • Action Log Generation                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Funifier Platform                          │
├─────────────────────────────────────────────────────────────┤
│  • REST API v3 (Player Status, Teams, Challenges)         │
│  • Database Collections (Reports, Configuration)          │
│  • Authentication & Authorization                          │
│  • Action Logs & Challenge Progress                        │
└─────────────────────────────────────────────────────────────┘
```

## 🎮 Team Types & Configurations

The system supports 6 distinct team types, each with unique metrics and processing logic:

### 1. **Carteira 0** (New Customer Acquisition)
- **Primary Goal**: Conversões (Conversions)
- **Secondary Goals**: Reais por Ativo, Faturamento
- **Challenge ID**: `E82R5cQ` (Conversões)
- **Team ID**: `E6F5k30`
- **Processing**: Direct Funifier API integration

### 2. **Carteira I** (Activity-Based)
- **Primary Goal**: Atividade (Activity)
- **Secondary Goals**: Reais por Ativo, Faturamento
- **Challenge ID**: `E6FQIjs` (Atividade)
- **Team ID**: `E6F4sCh`
- **Processing**: Direct Funifier API integration

### 3. **Carteira II** (Revenue per Asset Focus)
- **Primary Goal**: Reais por Ativo (controls unlock)
- **Secondary Goals**: Atividade, Multimarcas por Ativo
- **Challenge ID**: `E6MTIIK` (Reais por Ativo)
- **Team ID**: `E6F4O1b`
- **Processing**: Local processing with multipliers

### 4. **Carteira III** (Revenue Focus)
- **Primary Goal**: Faturamento (Revenue)
- **Secondary Goals**: Reais por Ativo, Multimarcas por Ativo
- **Challenge ID**: `E6Gahd4` (Faturamento)
- **Team ID**: `E6F4Xf2`
- **Processing**: Direct Funifier API integration

### 5. **Carteira IV** (Revenue Focus)
- **Primary Goal**: Faturamento (Revenue)
- **Secondary Goals**: Reais por Ativo, Multimarcas por Ativo
- **Challenge ID**: `E6Gahd4` (Faturamento)
- **Team ID**: `E6F41Bb`
- **Processing**: Direct Funifier API integration

### 6. **ER** (Relationship Team)
- **Primary Goal**: Faturamento (Revenue)
- **Secondary Goals**: Reais por Ativo, UPA
- **Challenge ID**: `E6Gahd4` (Faturamento), `E62x2PW` (UPA)
- **Team ID**: `E500AbT`
- **Processing**: Direct Funifier API integration
- **Special Feature**: "Medalhas" button (Coming Soon)

## 🔧 Technical Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with O Boticário brand colors
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Forms**: React Hook Form

### Backend Services
- **API Routes**: Next.js serverless functions
- **Authentication**: Custom JWT-based system
- **File Processing**: Papa Parse (CSV), XLSX
- **Caching**: In-memory caching with TTL

### External Integrations
- **Funifier API**: REST API v3 integration
- **Database**: Funifier custom collections
- **Authentication**: Funifier Basic Auth tokens

## 📊 Key Features

### 🎯 Player Dashboards
- **Personalized Metrics**: Team-specific goal tracking
- **Real-time Data**: Live integration with Funifier API
- **Progress Visualization**: Interactive progress bars and cards
- **Boost Indicators**: Visual feedback for active boosts
- **Points Display**: Smart locked/unlocked points logic
- **Cycle Information**: Current cycle day and remaining time
- **History Access**: Complete cycle history with timeline

### 🛠️ Administrative Interface

#### Configuration Management
- **Dynamic Dashboard Configuration**: Customize goals, challenge IDs, and display names per team
- **CSV Field Mapping**: Configure which CSV fields map to which metrics
- **Challenge ID Management**: Update Funifier challenge IDs through UI
- **Unsaved Changes Protection**: Prevent accidental data loss
- **Export/Import**: Configuration backup and restore

#### Player Management
- **Complete Player Overview**: View all players with detailed information
- **Team Membership**: Visual team badges and admin status
- **Real-time Status**: Live points, challenges, and progress data
- **Advanced Filtering**: Search by name/ID and filter by team
- **Funifier Integration**: Direct API integration for player operations

#### Report Processing
- **CSV Upload**: Multi-player report processing
- **Data Validation**: Comprehensive validation with error reporting
- **Comparison Logic**: Intelligent duplicate detection
- **Action Log Generation**: Automatic Funifier action log creation
- **Progress Tracking**: Real-time upload progress

#### Cycle Management
- **Automated Cycle Change**: 4-step scheduler execution
- **Real-time Validation**: Step-by-step validation and progress tracking
- **Safety Features**: Process cancellation and error recovery
- **Comprehensive Logging**: Detailed execution logs for debugging

### 📈 Data Processing Pipeline

```
CSV Upload → Parsing → Validation → Storage → Comparison → Action Logs → Funifier API
     ↓           ↓          ↓          ↓           ↓            ↓            ↓
File Validation  Field     Business   Database   Change      Log          API
& Format Check   Mapping   Rules      Storage    Detection   Generation   Submission
```

#### Enhanced CSV Support
- **Backward Compatibility**: Existing CSV formats continue working
- **New Metrics**: Support for Conversões and UPA metrics
- **Flexible Validation**: Optional fields based on team type
- **Error Reporting**: Clear validation messages

#### Intelligent Comparison System
- **Aggregation Pipelines**: Uses Funifier-preferred aggregation queries
- **Latest Record Logic**: Compares against most recent data per player
- **Change Detection**: Identifies actual changes vs. duplicate uploads
- **Action Log Prevention**: Prevents duplicate action logs

## 🔐 Security & Authentication

### Authentication Flow
```
Login → Funifier API → Token Validation → Team Detection → Dashboard/Admin Access
```

### Security Features
- **JWT Tokens**: Secure token-based authentication
- **Role-based Access**: Admin vs. Player permissions
- **API Key Management**: Secure Funifier API key handling
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Secure error messages without data exposure

## 🚀 Deployment & Configuration

### Environment Variables
```bash
# Funifier API Configuration
FUNIFIER_API_KEY=your_funifier_api_key_here
FUNIFIER_BASE_URL=https://service2.funifier.com/v3
FUNIFIER_BASIC_TOKEN=your_basic_auth_token_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.vercel.app

# Environment
NODE_ENV=production
```

### Vercel Deployment
- **Automatic Deployments**: Git-based deployment pipeline
- **Environment Variables**: Secure configuration management
- **Serverless Functions**: Optimized API routes
- **Build Optimization**: Production-ready builds

## 📁 Project Structure

```
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin interface pages
│   │   ├── configuration/        # Dashboard configuration
│   │   ├── cycle-change/         # Cycle management
│   │   ├── players/              # Player management
│   │   └── reports/              # Report processing
│   ├── api/                      # API routes
│   ├── dashboard/                # Player dashboard
│   ├── history/                  # Cycle history
│   └── login/                    # Authentication
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   ├── auth/                     # Authentication components
│   ├── dashboard/                # Dashboard components
│   └── ui/                       # Reusable UI components
├── services/                     # Business logic services
│   ├── team processors/          # Team-specific logic
│   ├── funifier integration/     # API services
│   ├── data processing/          # CSV and report handling
│   └── configuration/            # Configuration management
├── types/                        # TypeScript definitions
├── utils/                        # Utility functions
└── contexts/                     # React contexts
```

## 🔄 Data Flow

### Player Dashboard Flow
```
User Login → Team Detection → Configuration Loading → Data Fetching → Dashboard Rendering
     ↓              ↓                ↓                    ↓               ↓
Authentication  Multi-team      Dashboard Config    Funifier API    Personalized
& Authorization  Detection      Service Cache       Player Status    Dashboard
```

### Admin Report Processing Flow
```
CSV Upload → Validation → Parsing → Storage → Comparison → Action Logs → Confirmation
     ↓           ↓          ↓         ↓          ↓            ↓            ↓
File Format   Field       Data      Database   Change       Funifier     Success
Validation    Mapping     Transform  Storage    Detection    API          Message
```

## 🧪 Testing & Quality Assurance

### Testing Strategy
- **Unit Tests**: Jest for service layer testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for user flow testing
- **Performance Tests**: Load testing for critical paths

### Quality Tools
- **TypeScript**: Static type checking
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality gates

## 📊 Performance Optimizations

### Caching Strategy
- **Dashboard Data**: 5-minute TTL for player data
- **Configuration**: 5-minute TTL for dashboard configurations
- **API Responses**: Intelligent caching with version keys
- **Static Assets**: CDN optimization

### Database Optimizations
- **Aggregation Pipelines**: Efficient data queries
- **Indexed Queries**: Optimized database access
- **Connection Pooling**: Efficient API connections
- **Data Pagination**: Large dataset handling

## 🔧 Development Workflow

### Getting Started
```bash
# Clone repository
git clone <repository-url>
cd funifier-gamification-dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run type-check   # TypeScript check
npm run test         # Run tests
npm run test:e2e     # E2E tests
```

## 🐛 Troubleshooting

### Common Issues

#### Authentication Problems
- **Symptom**: 401 Unauthorized errors
- **Solution**: Check `FUNIFIER_BASIC_TOKEN` configuration
- **Debug**: Verify token format includes "Basic " prefix

#### Dashboard Data Issues
- **Symptom**: Wrong player data displayed
- **Solution**: Clear cache and verify player ID
- **Debug**: Check console logs for API responses

#### CSV Upload Problems
- **Symptom**: Validation errors or processing failures
- **Solution**: Verify CSV format and required fields
- **Debug**: Check admin interface error messages

#### Configuration Not Loading
- **Symptom**: Default configuration always used
- **Solution**: Verify database connection and configuration storage
- **Debug**: Check console logs for configuration loading

## 📚 API Documentation

### Key Endpoints

#### Player Data
```typescript
GET /api/dashboard/[playerId]
// Returns complete dashboard data for player

GET /api/player/status/[playerId]
// Returns Funifier player status
```

#### Admin Operations
```typescript
POST /api/reports/upload
// Process CSV report upload

GET /api/admin/players
// Get all players with detailed information

POST /api/admin/configuration
// Save dashboard configuration
```

#### Authentication
```typescript
POST /api/auth/login
// Authenticate user and return token

GET /api/auth/teams/[playerId]
// Get player's team memberships
```

## 🔮 Future Enhancements

### Planned Features
- **Real-time Notifications**: WebSocket integration for live updates
- **Advanced Analytics**: Detailed performance analytics and reporting
- **Mobile App**: React Native mobile application
- **Batch Operations**: Bulk player and configuration management
- **Advanced Permissions**: Granular role-based access control

### Technical Improvements
- **Microservices**: Service decomposition for better scalability
- **GraphQL**: More efficient data fetching
- **Redis Caching**: Distributed caching layer
- **Monitoring**: Application performance monitoring
- **CI/CD Pipeline**: Automated testing and deployment

## 🤝 Contributing

### Development Guidelines
1. **Code Style**: Follow ESLint and Prettier configurations
2. **TypeScript**: Maintain strict type safety
3. **Testing**: Write tests for new features
4. **Documentation**: Update documentation for changes
5. **Security**: Follow security best practices

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation
4. Submit pull request with description
5. Code review and approval
6. Merge to `main`

## 📞 Support

### Documentation Resources
- **[Multi-Team Guide](./docs/MULTI_TEAM_GUIDE.md)**: Team selection and management
- **[CSV Format Guide](./docs/CSV_FORMAT_GUIDE.md)**: Complete CSV format documentation
- **[Security Guide](./docs/SECURITY.md)**: Security practices and guidelines
- **[Performance Guide](./docs/PERFORMANCE_TESTING.md)**: Performance optimization

### Contact Information
- **Development Team**: Game4u
- **Business Owner**: Game4u
- **Platform Support**: Funifier platform support

---

## 📄 License

This project is proprietary to Game4u and is intended for internal use only.

---

**Built with ❤️ for Grupo Essência using Next.js, TypeScript, Kiro and the Funifier Platform**
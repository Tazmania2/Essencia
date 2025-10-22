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

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd funifier-gamification-dashboard
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
FUNIFIER_API_KEY=your_funifier_api_key_here
FUNIFIER_BASE_URL=https://service2.funifier.com/v3
FUNIFIER_BASIC_TOKEN=your_basic_auth_token_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Access the application:**
Open [http://localhost:3000](http://localhost:3000) in your browser.

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

## 🔧 Available Scripts

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

## 🚀 Deployment

### Vercel (Recommended)

The project is optimized for Vercel deployment:

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy automatically** on push to main branch

#### Required Environment Variables
```env
FUNIFIER_API_KEY=[your_funifier_api_key]
FUNIFIER_BASE_URL=https://service2.funifier.com/v3
FUNIFIER_BASIC_TOKEN=[your_basic_auth_token]
NEXTAUTH_SECRET=[your_secure_random_string]
NEXTAUTH_URL=https://your-domain.vercel.app
NODE_ENV=production
```

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## 📚 Documentation

- **[Technical Architecture](./TECHNICAL_ARCHITECTURE.md)**: Deep technical documentation
- **[API Documentation](./API_DOCUMENTATION.md)**: Complete API reference
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)**: Production deployment instructions
- **[System Evolution](./SYSTEM_EVOLUTION.md)**: Development history and changelog

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

For questions or issues, contact the development team.

## 📄 License

This project is proprietary to Grupo Essência and is intended for internal use only.

---

**Built with ❤️ for Grupo Essência using Next.js, TypeScript, and the Funifier Platform**
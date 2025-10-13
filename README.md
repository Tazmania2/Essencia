# Funifier Gamification Dashboard

Dashboard de gamificação integrado com a plataforma Funifier para o grupo Essência (distribuidora do Boticário). O sistema oferece interfaces personalizadas para jogadores visualizarem suas métricas de gamificação e para administradores gerenciarem dados e sincronizarem informações.

## Funcionalidades

### Dashboard do Jogador
- Visualização personalizada de métricas por time (Carteira 0, Carteira I, II, III, IV, ER)
- Acompanhamento de pontos, metas e progresso do ciclo
- Interface responsiva com design O Boticário
- Indicadores visuais de boost e desbloqueio de pontos
- Seleção automática de time ou modal de seleção para usuários com múltiplos times

### Dashboard Administrativo
- Visualização de dados de todos os jogadores
- Upload e processamento de relatórios
- Sincronização automática com API Funifier
- Exportação de dados

## Tecnologias

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Code Quality**: ESLint, Prettier
- **Deployment**: Vercel

## Estrutura do Projeto

```
├── components/          # Componentes React reutilizáveis
│   ├── auth/           # Componentes de autenticação
│   ├── dashboard/      # Componentes do dashboard
│   ├── admin/          # Componentes administrativos
│   └── ui/             # Componentes de interface base
├── pages/              # Páginas Next.js
├── services/           # Serviços de integração com APIs
├── types/              # Definições TypeScript
├── utils/              # Utilitários e helpers
├── styles/             # Estilos globais
└── public/             # Assets estáticos
```

## Configuração do Ambiente

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Git

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd funifier-gamification-dashboard
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:
```env
FUNIFIER_API_KEY=your_api_key_here
FUNIFIER_BASE_URL=https://service2.funifier.com/v3
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Execute o projeto em desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

5. Acesse http://localhost:3000

## Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Gera build de produção
- `npm run start` - Executa build de produção
- `npm run lint` - Executa ESLint
- `npm run lint:fix` - Corrige problemas do ESLint automaticamente
- `npm run type-check` - Verifica tipos TypeScript
- `npm test` - Executa testes

## Integração com Funifier

O sistema integra com a API Funifier v3 para:
- Autenticação de usuários
- Recuperação de dados de jogadores
- Gerenciamento de collections customizadas
- Envio de action logs

### Configuração da API

A integração utiliza:
- **API Key**: `[configured_via_environment_variable]`
- **Base URL**: `https://service2.funifier.com/v3`
- **Collection**: `essencia_reports__c`

### Catalog Items Importantes
- `E6F0O5f`: Desbloqueio de pontos
- `E6F0WGc`: Boost meta secundária 1
- `E6K79Mt`: Boost meta secundária 2

### Challenge IDs por Métrica
- **Conversões**: `E82R5cQ` (Carteira 0)
- **UPA**: `E62x2PW` (ER)
- **Faturamento**: Reutiliza IDs existentes das Carteiras
- **Reais por Ativo**: Reutiliza IDs existentes das Carteiras

## Formato CSV Estendido

### Estrutura do Arquivo
O sistema suporta upload de arquivos CSV com as seguintes colunas:

**Colunas Obrigatórias:**
- Player ID, Dia do Ciclo, Total Dias Ciclo
- Faturamento Meta, Faturamento Atual, Faturamento %
- Reais por Ativo Meta, Reais por Ativo Atual, Reais por Ativo %
- Atividade Meta, Atividade Atual, Atividade %
- Multimarcas por Ativo Meta, Multimarcas por Ativo Atual, Multimarcas por Ativo %

**Colunas Opcionais (Novas Métricas):**
- Conversões Meta, Conversões Atual, Conversões % (para Carteira 0)
- UPA Meta, UPA Atual, UPA % (para ER)

### Compatibilidade
- **Retrocompatibilidade**: Arquivos CSV existentes continuam funcionando
- **Validação Flexível**: Novas métricas são opcionais e validadas conforme o tipo de time
- **Mensagens de Erro**: Indicações claras sobre campos ausentes ou inválidos

## Times e Processamento

### Carteira 0
- Meta principal: Conversões
- Metas secundárias: Reais por ativo, Faturamento
- Pontos diretos da Funifier
- Team ID: E6F5k30

### Carteira I
- Meta principal: Atividade
- Metas secundárias: Reais por ativo, Faturamento
- Pontos diretos da Funifier

### Carteira II
- Meta principal: Reais por ativo (controla desbloqueio)
- Metas secundárias: Atividade, Multimarcas por ativo
- Processamento local de pontos com multiplicadores

### Carteira III/IV
- Meta principal: Faturamento
- Metas secundárias: Reais por ativo, Multimarcas por ativo
- Pontos diretos da Funifier

### ER (Equipe de Relacionamento)
- Meta principal: Faturamento
- Metas secundárias: Reais por ativo, UPA
- Funcionalidade adicional: Botão Medalhas (Em Breve)
- Team ID: E500AbT

## Seleção de Times

### Fluxo de Autenticação
- **Time único**: Redirecionamento automático para o dashboard correspondente
- **Múltiplos times**: Modal de seleção apresenta todas as opções disponíveis
- **Acesso Admin**: Disponível através do modal de seleção para usuários com privilégios

### Times Suportados
- Carteira 0, I, II, III, IV, ER
- Admin (interface administrativa)

## Deploy

### Vercel (Recomendado)

O projeto está configurado para deploy automático no Vercel. Consulte o [Guia de Deploy](./DEPLOYMENT.md) para instruções detalhadas.

#### Configuração Rápida

1. **Conectar Repositório**: Importe o projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. **Configurar Variáveis**: Adicione as variáveis de ambiente necessárias
3. **Deploy Automático**: Push para `main` faz deploy automático

#### Variáveis de Ambiente Obrigatórias
```env
FUNIFIER_API_KEY=[your_funifier_api_key]
FUNIFIER_BASE_URL=https://service2.funifier.com/v3
NEXTAUTH_SECRET=your_secure_random_string
NEXTAUTH_URL=https://your-domain.vercel.app
NODE_ENV=production
```

#### Recursos Configurados
- ✅ **API Routes**: Serverless functions para backend
- ✅ **Automatic Deployments**: Deploy automático por branch
- ✅ **Preview Deployments**: Preview para todas as branches
- ✅ **Environment Variables**: Configuração segura de variáveis
- ✅ **Build Optimization**: Build otimizado para produção

Para instruções completas, consulte [DEPLOYMENT.md](./DEPLOYMENT.md).

## Contribuição

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto é propriedade do grupo Essência e destina-se ao uso interno.

## Documentação Adicional

- **[Guia Multi-Team](./docs/MULTI_TEAM_GUIDE.md)**: Funcionalidade de múltiplos times e seleção
- **[Formato CSV](./docs/CSV_FORMAT_GUIDE.md)**: Guia completo do formato CSV estendido
- **[Deploy](./DEPLOYMENT.md)**: Instruções detalhadas de deployment
- **[Segurança](./docs/SECURITY.md)**: Práticas de segurança
- **[Performance](./docs/PERFORMANCE_TESTING.md)**: Testes e otimização de performance

## Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
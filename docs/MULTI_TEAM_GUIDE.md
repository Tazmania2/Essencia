# Guia de Funcionalidade Multi-Time

Este guia explica como funciona o sistema de múltiplos times no dashboard Funifier e como os usuários podem navegar entre diferentes dashboards.

## Visão Geral

O sistema suporta usuários que pertencem a múltiplos times, oferecendo uma experiência personalizada baseada nas atribuições de cada usuário.

## Times Disponíveis

### Carteira 0
- **Meta Principal**: Conversões
- **Metas Secundárias**: Reais por Ativo, Faturamento
- **Características**: Dashboard individual com foco em métricas de conversão

### Carteira I
- **Meta Principal**: Atividade
- **Metas Secundárias**: Reais por Ativo, Faturamento
- **Características**: Dashboard individual com pontos diretos da Funifier

### Carteira II
- **Meta Principal**: Reais por Ativo
- **Metas Secundárias**: Atividade, Multimarcas por Ativo
- **Características**: Dashboard individual com processamento local de pontos

### Carteira III/IV
- **Meta Principal**: Faturamento
- **Metas Secundárias**: Reais por Ativo, Multimarcas por Ativo
- **Características**: Dashboard individual com pontos diretos da Funifier

### ER (Equipe de Relacionamento)
- **Meta Principal**: Faturamento
- **Metas Secundárias**: Reais por Ativo, UPA
- **Características**: Dashboard individual com botão Medalhas (funcionalidade em desenvolvimento)

### Admin
- **Funcionalidade**: Interface administrativa completa
- **Acesso**: Upload de relatórios, visualização de dados, exportação

## Fluxo de Login e Seleção

### Cenário 1: Usuário com Time Único
1. Usuário faz login com suas credenciais
2. Sistema identifica automaticamente o time do usuário
3. Redirecionamento automático para o dashboard correspondente
4. Não há necessidade de seleção manual

### Cenário 2: Usuário com Múltiplos Times
1. Usuário faz login com suas credenciais
2. Sistema detecta múltiplas atribuições de time
3. **Modal de Seleção** é apresentado automaticamente
4. Usuário escolhe o time desejado
5. Redirecionamento para o dashboard selecionado

### Cenário 3: Usuário Admin com Times
1. Usuário faz login com suas credenciais
2. Sistema detecta privilégios administrativos
3. **Modal de Seleção** inclui opção "Admin"
4. Usuário pode escolher entre times ou interface administrativa
5. Redirecionamento baseado na seleção

## Interface do Modal de Seleção

### Características
- **Design Consistente**: Segue o padrão visual do sistema
- **Responsivo**: Funciona em desktop e dispositivos móveis
- **Acessível**: Suporte a navegação por teclado e leitores de tela

### Elementos
- **Título**: "Selecione seu Time"
- **Lista de Times**: Todos os times disponíveis para o usuário
- **Opção Admin**: Quando aplicável
- **Botões de Ação**: Confirmar seleção
- **Botão Fechar**: Para cancelar (retorna ao login)

## Navegação Entre Dashboards

### Mudança de Time
- Usuários podem retornar ao login para acessar outro time
- Não há troca dinâmica entre dashboards na mesma sessão
- Cada seleção inicia uma nova sessão no dashboard escolhido

### Sessão Administrativa
- Acesso admin é tratado como seleção separada
- Interface administrativa completa com todas as funcionalidades
- Retorno aos dashboards de time requer novo login

## Métricas Específicas por Time

### Novas Métricas

#### Conversões (Carteira 0)
- **Definição**: Métrica de conversão de leads/oportunidades
- **Exibição**: Meta principal no dashboard
- **Cálculo**: Baseado em dados do CSV e API Funifier

#### UPA (ER)
- **Definição**: Unidades Por Ativo
- **Exibição**: Meta secundária no dashboard ER
- **Cálculo**: Baseado em dados específicos do time ER

### Funcionalidades Especiais

#### Botão Medalhas (ER)
- **Localização**: Dashboard ER, ao lado de Histórico e Ranking
- **Status Atual**: "Em Breve" (placeholder)
- **Funcionalidade Futura**: Sistema de medalhas e conquistas

## Administração e Upload de Dados

### Formato CSV Estendido
O sistema aceita arquivos CSV com as novas métricas:

```csv
Player ID,Dia do Ciclo,Total Dias Ciclo,
Faturamento Meta,Faturamento Atual,Faturamento %,
Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,
Atividade Meta,Atividade Atual,Atividade %,
Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %,
Conversões Meta,Conversões Atual,Conversões %,
UPA Meta,UPA Atual,UPA %
```

### Validação de Dados
- **Retrocompatibilidade**: CSVs antigos continuam funcionando
- **Validação Condicional**: Novas métricas validadas conforme necessidade do time
- **Mensagens Claras**: Erros específicos para cada tipo de problema

## Solução de Problemas

### Problemas Comuns

#### Modal não Aparece
- **Causa**: Usuário tem apenas um time
- **Solução**: Comportamento normal, redirecionamento automático

#### Time não Disponível
- **Causa**: Configuração incorreta no Funifier
- **Solução**: Verificar atribuições de time na plataforma Funifier

#### Erro de Validação CSV
- **Causa**: Formato incorreto ou métricas ausentes
- **Solução**: Verificar estrutura do arquivo e métricas obrigatórias

### Logs e Debugging
- Sistema registra todas as seleções de time
- Logs de erro específicos para problemas de identificação
- Monitoramento de performance do modal de seleção

## Configuração Técnica

### Variáveis de Ambiente
```env
# Team IDs configurados no sistema
CARTEIRA_0_TEAM_ID=E6F5k30
ER_TEAM_ID=E500AbT

# Challenge IDs para novas métricas
CONVERSOES_CHALLENGE_ID=E6GglPq
UPA_CHALLENGE_ID=E62x2PW
```

### Endpoints da API
- `/api/auth/identify-user`: Identificação de times do usuário
- `/api/dashboard/[teamType]`: Dados específicos por tipo de time
- `/api/admin/upload`: Upload de CSV com novas métricas

## Suporte

Para dúvidas sobre a funcionalidade multi-time:
1. Verifique se o usuário está configurado corretamente no Funifier
2. Confirme que os Team IDs estão corretos na configuração
3. Teste o upload de CSV com as novas métricas
4. Entre em contato com a equipe de desenvolvimento para problemas técnicos
# Requirements Document

## Introduction

Este projeto consiste em desenvolver um dashboard de gamificação que integra com a plataforma Funifier para o grupo Essência (distribuidora do Boticário). O sistema terá duas interfaces principais: uma para jogadores visualizarem suas métricas de gamificação e outra para administradores gerenciarem dados e sincronizarem informações com a Funifier através de relatórios.

## Requirements

### Requirement 1 - Autenticação e Identificação de Usuário

**User Story:** Como um usuário do sistema, eu quero fazer login para acessar minha interface específica (jogador ou admin), para que eu possa visualizar as informações relevantes ao meu perfil.

#### Acceptance Criteria

1. WHEN um usuário faz login THEN o sistema SHALL identificar se é jogador ou administrador
2. WHEN um jogador faz login THEN o sistema SHALL identificar seu time (Carteira I, II, III ou IV)
3. WHEN a identificação é concluída THEN o sistema SHALL redirecionar para o dashboard apropriado
4. IF o usuário não está autenticado THEN o sistema SHALL exibir tela de login

### Requirement 2 - Dashboard do Jogador - Informações Básicas

**User Story:** Como um jogador, eu quero visualizar minhas informações básicas de gamificação, para que eu possa acompanhar meu progresso.

#### Acceptance Criteria

1. WHEN um jogador acessa seu dashboard THEN o sistema SHALL exibir mensagem personalizada "Olá [Nome do Jogador]"
2. WHEN o dashboard carrega THEN o sistema SHALL exibir pontos totais do jogador
3. WHEN os pontos são exibidos THEN o sistema SHALL indicar se estão bloqueados ou desbloqueados
4. WHEN o dashboard carrega THEN o sistema SHALL exibir dia atual do ciclo
5. WHEN o dashboard carrega THEN o sistema SHALL exibir quantos dias restam para o fim do ciclo

### Requirement 3 - Dashboard do Jogador - Metas por Time

**User Story:** Como um jogador, eu quero visualizar as métricas específicas do meu time, para que eu possa entender meu desempenho nas metas corretas.

#### Acceptance Criteria

1. WHEN um jogador do time Carteira I acessa o dashboard THEN o sistema SHALL exibir pontos totais e status de bloqueio/desbloqueio vindos diretamente da Funifier
2. WHEN um jogador do time Carteira I acessa o dashboard THEN o sistema SHALL exibir meta principal "Atividade" com porcentagem alcançada
3. WHEN um jogador do time Carteira I acessa o dashboard THEN o sistema SHALL exibir meta secundária 1 "Reais por ativo" com porcentagem e status do boost
4. WHEN um jogador do time Carteira I acessa o dashboard THEN o sistema SHALL exibir meta secundária 2 "Faturamento" com porcentagem e status do boost
5. WHEN um jogador do time Carteira III ou IV acessa o dashboard THEN o sistema SHALL exibir pontos totais e status de bloqueio/desbloqueio vindos diretamente da Funifier
6. WHEN um jogador do time Carteira III ou IV acessa o dashboard THEN o sistema SHALL exibir meta principal "Faturamento" com porcentagem alcançada
7. WHEN um jogador do time Carteira III ou IV acessa o dashboard THEN o sistema SHALL exibir meta secundária 1 "Reais por ativo" com porcentagem e status do boost
8. WHEN um jogador do time Carteira III ou IV acessa o dashboard THEN o sistema SHALL exibir meta secundária 2 "Multimarcas por ativo" com porcentagem e status do boost

### Requirement 4 - Tratamento Especial Time Carteira II

**User Story:** Como um jogador do time Carteira II, eu quero visualizar minhas métricas calculadas localmente, para que eu tenha informações precisas considerando a volatilidade da minha meta principal.

#### Acceptance Criteria

1. WHEN um jogador do time Carteira II acessa o dashboard THEN o sistema SHALL obter pontos base da Funifier e processar localmente para calcular bloqueio/desbloqueio
2. WHEN um jogador do time Carteira II acessa o dashboard THEN o sistema SHALL calcular multiplicadores de boost localmente (não na Funifier)
3. WHEN um jogador do time Carteira II acessa o dashboard THEN o sistema SHALL exibir pontos totais processados localmente com status de bloqueio/desbloqueio calculado
4. WHEN um jogador do time Carteira II acessa o dashboard THEN o sistema SHALL exibir meta principal "Reais por ativo" com cálculos locais
5. WHEN um jogador do time Carteira II acessa o dashboard THEN o sistema SHALL exibir meta secundária 1 "Atividade" com porcentagem e status do boost
6. WHEN um jogador do time Carteira II acessa o dashboard THEN o sistema SHALL exibir meta secundária 2 "Multimarcas por ativo" com porcentagem e status do boost

### Requirement 5 - Dashboard Administrativo - Visualização de Dados

**User Story:** Como um administrador, eu quero visualizar dados de todos os jogadores, para que eu possa monitorar o desempenho geral da gamificação.

#### Acceptance Criteria

1. WHEN um administrador acessa o dashboard THEN o sistema SHALL exibir seletor de jogadores
2. WHEN um jogador é selecionado THEN o sistema SHALL exibir todos os dados daquele jogador
3. WHEN o administrador solicita THEN o sistema SHALL permitir exportar dados dos jogadores
4. WHEN dados são exportados THEN o sistema SHALL gerar arquivo com informações completas

### Requirement 6 - Dashboard Administrativo - Sincronização com Funifier

**User Story:** Como um administrador, eu quero fazer upload de relatórios para sincronizar dados com a Funifier, para que as informações sejam atualizadas automaticamente.

#### Acceptance Criteria

1. WHEN um administrador faz upload de relatório THEN o sistema SHALL comparar dados do relatório com dados atuais da Funifier
2. WHEN diferenças são identificadas THEN o sistema SHALL gerar action logs apropriados
3. WHEN action logs são gerados THEN o sistema SHALL enviar via API para a Funifier
4. WHEN diferenças são identificadas entre relatório e Funifier THEN o sistema SHALL calcular a diferença e enviar action log apropriado (exemplo: se Atividade está 35% na Funifier e 37% no relatório, enviar action log com diferença de 2%)
5. WHEN sincronização é concluída THEN o sistema SHALL exibir relatório de ações executadas

### Requirement 7 - Integração com API Funifier

**User Story:** Como sistema, eu preciso integrar com a API da Funifier, para que eu possa obter e atualizar dados de gamificação.

#### Acceptance Criteria

1. WHEN o sistema inicia THEN o sistema SHALL estabelecer conexão com api.funifier.com
2. WHEN dados são solicitados THEN o sistema SHALL fazer requisições autenticadas à API
3. WHEN dados são recebidos THEN o sistema SHALL processar e armazenar informações relevantes
4. WHEN action logs são enviados THEN o sistema SHALL usar endpoints apropriados da API Funifier
5. IF a API retorna erro THEN o sistema SHALL tratar e exibir mensagem apropriada ao usuário

### Requirement 8 - Gerenciamento de Cache e Atualização de Dados

**User Story:** Como usuário, eu quero que os dados sejam sempre atualizados e que eu possa forçar uma atualização quando necessário, para que eu tenha informações precisas e em tempo real.

#### Acceptance Criteria

1. WHEN o usuário faz refresh da página (F5 ou Ctrl+R) THEN o sistema SHALL buscar dados frescos da API Funifier ignorando cache
2. WHEN dados são mais antigos que 24 horas THEN o sistema SHALL automaticamente buscar dados frescos da API
3. WHEN o dashboard é carregado THEN o sistema SHALL exibir um botão "Atualizar" para refresh manual dos dados
4. WHEN o usuário clica no botão "Atualizar" THEN o sistema SHALL buscar dados frescos da API e atualizar o cache
5. WHEN dados estão sendo atualizados THEN o sistema SHALL exibir indicador de loading e desabilitar o botão de atualização
6. WHEN dados são atualizados com sucesso THEN o sistema SHALL exibir timestamp da última atualização
7. WHEN há erro na atualização de dados THEN o sistema SHALL manter dados em cache e exibir mensagem de erro com opção de tentar novamente
8. WHEN o sistema detecta que a página ficou inativa e depois volta ao foco THEN o sistema SHALL verificar se precisa atualizar dados automaticamente

### Requirement 9 - Interface Responsiva e Usabilidade

**User Story:** Como usuário, eu quero uma interface intuitiva e responsiva, para que eu possa acessar o sistema de qualquer dispositivo.

#### Acceptance Criteria

1. WHEN o sistema é acessado THEN a interface SHALL ser responsiva para desktop, tablet e mobile
2. WHEN dados são carregados THEN o sistema SHALL exibir indicadores de loading
3. WHEN erros ocorrem THEN o sistema SHALL exibir mensagens claras ao usuário
4. WHEN o usuário navega THEN a interface SHALL ser intuitiva e fácil de usar
5. WHEN dados são atualizados THEN o sistema SHALL fornecer feedback visual da ação

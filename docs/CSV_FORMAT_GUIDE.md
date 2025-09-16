# Guia de Formato CSV - Novas Métricas

Este documento descreve o formato CSV estendido que suporta as novas métricas para os dashboards Carteira 0 e ER.

## Visão Geral

O sistema foi atualizado para suportar duas novas métricas:
- **Conversões**: Para o dashboard Carteira 0
- **UPA (Unidades Por Ativo)**: Para o dashboard ER

O formato CSV mantém retrocompatibilidade total com arquivos existentes.

## Estrutura do Arquivo CSV

### Formato Completo (Com Novas Métricas)

```csv
Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Atividade Meta,Atividade Atual,Atividade %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %,Conversões Meta,Conversões Atual,Conversões %,UPA Meta,UPA Atual,UPA %
12345,15,30,50000.00,35000.00,70.00,1000.00,850.00,85.00,100,75,75.00,50,40,80.00,25,20,80.00,15,12,80.00
67890,15,30,60000.00,45000.00,75.00,1200.00,1000.00,83.33,120,90,75.00,60,50,83.33,30,25,83.33,18,15,83.33
```

### Colunas Obrigatórias (Existentes)

| Coluna | Descrição | Tipo | Exemplo |
|--------|-----------|------|---------|
| Player ID | Identificador único do jogador | String | "12345" |
| Dia do Ciclo | Dia atual do ciclo | Integer | 15 |
| Total Dias Ciclo | Total de dias no ciclo | Integer | 30 |
| Faturamento Meta | Meta de faturamento | Decimal | 50000.00 |
| Faturamento Atual | Faturamento atual | Decimal | 35000.00 |
| Faturamento % | Percentual de faturamento | Decimal | 70.00 |
| Reais por Ativo Meta | Meta de reais por ativo | Decimal | 1000.00 |
| Reais por Ativo Atual | Reais por ativo atual | Decimal | 850.00 |
| Reais por Ativo % | Percentual de reais por ativo | Decimal | 85.00 |
| Atividade Meta | Meta de atividade | Integer | 100 |
| Atividade Atual | Atividade atual | Integer | 75 |
| Atividade % | Percentual de atividade | Decimal | 75.00 |
| Multimarcas por Ativo Meta | Meta de multimarcas | Integer | 50 |
| Multimarcas por Ativo Atual | Multimarcas atual | Integer | 40 |
| Multimarcas por Ativo % | Percentual de multimarcas | Decimal | 80.00 |

### Colunas Opcionais (Novas Métricas)

| Coluna | Descrição | Tipo | Usado Por | Exemplo |
|--------|-----------|------|-----------|---------|
| Conversões Meta | Meta de conversões | Integer | Carteira 0 | 25 |
| Conversões Atual | Conversões atuais | Integer | Carteira 0 | 20 |
| Conversões % | Percentual de conversões | Decimal | Carteira 0 | 80.00 |
| UPA Meta | Meta de UPA | Integer | ER | 15 |
| UPA Atual | UPA atual | Integer | ER | 12 |
| UPA % | Percentual de UPA | Decimal | ER | 80.00 |

## Regras de Validação

### Validação Geral
- **Encoding**: UTF-8
- **Separador**: Vírgula (,)
- **Decimal**: Ponto (.) como separador decimal
- **Header**: Primeira linha deve conter os nomes das colunas

### Validação por Tipo de Dados
- **Player ID**: Obrigatório, não pode estar vazio
- **Integers**: Números inteiros positivos ou zero
- **Decimals**: Números decimais com até 2 casas decimais
- **Percentuais**: Valores entre 0.00 e 100.00

### Validação Condicional
- **Conversões**: Validadas apenas se presentes no arquivo
- **UPA**: Validadas apenas se presentes no arquivo
- **Retrocompatibilidade**: Arquivos sem novas métricas são aceitos

## Exemplos de Uso

### Exemplo 1: Arquivo Tradicional (Sem Novas Métricas)
```csv
Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Atividade Meta,Atividade Atual,Atividade %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %
12345,15,30,50000.00,35000.00,70.00,1000.00,850.00,85.00,100,75,75.00,50,40,80.00
```
**Status**: ✅ Aceito - Retrocompatibilidade total

### Exemplo 2: Arquivo com Conversões (Carteira 0)
```csv
Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Atividade Meta,Atividade Atual,Atividade %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %,Conversões Meta,Conversões Atual,Conversões %
12345,15,30,50000.00,35000.00,70.00,1000.00,850.00,85.00,100,75,75.00,50,40,80.00,25,20,80.00
```
**Status**: ✅ Aceito - Suporte a Conversões

### Exemplo 3: Arquivo com UPA (ER)
```csv
Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Atividade Meta,Atividade Atual,Atividade %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %,UPA Meta,UPA Atual,UPA %
12345,15,30,50000.00,35000.00,70.00,1000.00,850.00,85.00,100,75,75.00,50,40,80.00,15,12,80.00
```
**Status**: ✅ Aceito - Suporte a UPA

### Exemplo 4: Arquivo Completo (Todas as Métricas)
```csv
Player ID,Dia do Ciclo,Total Dias Ciclo,Faturamento Meta,Faturamento Atual,Faturamento %,Reais por Ativo Meta,Reais por Ativo Atual,Reais por Ativo %,Atividade Meta,Atividade Atual,Atividade %,Multimarcas por Ativo Meta,Multimarcas por Ativo Atual,Multimarcas por Ativo %,Conversões Meta,Conversões Atual,Conversões %,UPA Meta,UPA Atual,UPA %
12345,15,30,50000.00,35000.00,70.00,1000.00,850.00,85.00,100,75,75.00,50,40,80.00,25,20,80.00,15,12,80.00
```
**Status**: ✅ Aceito - Formato completo

## Mensagens de Erro

### Erros de Estrutura
- **"Cabeçalho CSV inválido"**: Colunas obrigatórias ausentes
- **"Formato de arquivo inválido"**: Arquivo não é CSV válido
- **"Encoding inválido"**: Arquivo não está em UTF-8

### Erros de Dados
- **"Player ID obrigatório na linha X"**: Player ID vazio ou ausente
- **"Valor numérico inválido na linha X, coluna Y"**: Formato numérico incorreto
- **"Percentual fora do intervalo na linha X"**: Valor percentual > 100 ou < 0

### Erros de Métricas Específicas
- **"Conversões: valor inválido na linha X"**: Dados de conversão incorretos
- **"UPA: valor inválido na linha X"**: Dados de UPA incorretos
- **"Métrica incompleta na linha X"**: Meta, Atual ou % ausente para uma métrica

## Processamento no Sistema

### Fluxo de Upload
1. **Validação de Formato**: Verificação da estrutura do CSV
2. **Validação de Dados**: Verificação de tipos e valores
3. **Processamento de Métricas**: Extração das métricas por tipo de time
4. **Armazenamento**: Persistência dos dados validados
5. **Confirmação**: Feedback de sucesso ou erro detalhado

### Integração com Dashboards
- **Carteira 0**: Utiliza dados de Conversões quando disponíveis
- **ER**: Utiliza dados de UPA quando disponíveis
- **Outros Times**: Ignoram novas métricas, mantêm comportamento existente

### Performance
- **Processamento em Lote**: Arquivos grandes processados em chunks
- **Validação Otimizada**: Validação paralela de linhas
- **Cache de Resultados**: Resultados de processamento são cacheados

## Migração e Compatibilidade

### Estratégia de Migração
1. **Fase 1**: Sistema aceita ambos os formatos (atual)
2. **Fase 2**: Incentivo ao uso do novo formato
3. **Fase 3**: Formato antigo mantido indefinidamente (retrocompatibilidade)

### Testes de Compatibilidade
- ✅ Arquivos CSV existentes continuam funcionando
- ✅ Novos arquivos com métricas adicionais são processados
- ✅ Arquivos parciais (só Conversões ou só UPA) funcionam
- ✅ Validação não quebra com colunas extras

## Ferramentas e Utilitários

### Geração de CSV de Exemplo
O sistema inclui utilitário para gerar CSVs de exemplo:

```bash
# Gerar CSV tradicional
npm run generate-csv -- --type=traditional

# Gerar CSV com Conversões
npm run generate-csv -- --type=carteira0

# Gerar CSV com UPA
npm run generate-csv -- --type=er

# Gerar CSV completo
npm run generate-csv -- --type=complete
```

### Validação Local
```bash
# Validar arquivo CSV antes do upload
npm run validate-csv -- path/to/file.csv
```

## Suporte e Troubleshooting

### Problemas Comuns

#### "Arquivo não processado"
- **Causa**: Formato CSV inválido
- **Solução**: Verificar encoding UTF-8 e separadores

#### "Métricas não aparecem no dashboard"
- **Causa**: Colunas de métricas ausentes ou inválidas
- **Solução**: Verificar nomes exatos das colunas

#### "Erro de validação em lote"
- **Causa**: Múltiplas linhas com dados inválidos
- **Solução**: Verificar tipos de dados e valores obrigatórios

### Contato para Suporte
- **Erros de Upload**: Verificar logs no painel administrativo
- **Problemas de Formato**: Consultar exemplos neste documento
- **Suporte Técnico**: Contatar equipe de desenvolvimento

## Changelog

### Versão 2.0 (Atual)
- ✅ Adicionado suporte a métricas Conversões
- ✅ Adicionado suporte a métricas UPA
- ✅ Mantida retrocompatibilidade total
- ✅ Validação condicional por tipo de métrica

### Versão 1.0 (Anterior)
- ✅ Formato CSV básico com métricas tradicionais
- ✅ Validação de estrutura e dados
- ✅ Processamento em lote
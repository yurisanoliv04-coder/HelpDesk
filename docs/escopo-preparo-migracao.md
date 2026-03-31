# Escopo de Preparo do HelpDesk para Receber os Bancos SDI e GPI

## Objetivo

Preparar o HelpDesk para absorver dados legados de dois sistemas grandes, sem recadastro manual:

- `SDI`: mais de 1200 chamados com descricoes, datas, tempos de espera, categorias e historico operacional.
- `GPI`: mais de 550 ativos, cerca de 100 usuarios, imagens, anotacoes, historicos, identificadores patrimoniais e diversos campos especificos.

O foco deste documento e definir o que o sistema deve possuir antes da migracao e quais capacidades sao necessarias para que a entrada desses dados seja segura, auditavel e escalavel.

## Principios de migracao

- Nao recadastrar manualmente.
- Nao importar direto para as tabelas finais sem validacao.
- Preservar rastreabilidade do sistema de origem.
- Permitir reprocessamento sem duplicacao.
- Separar dado legado bruto de dado normalizado.
- Garantir que anexos, imagens, historicos e notas sejam tratados como dados de primeira classe.

## Escopo minimo de preparo

### 1. Identidade legada

Cada entidade principal do HelpDesk deve aceitar metadados de origem:

- `legacySource`: sistema de origem, por exemplo `SDI` ou `GPI`
- `legacyId`: identificador unico no sistema de origem
- `legacyRawData`: payload bruto, ou referencia para staging
- `importBatchId`: lote de importacao
- `importedAt`: data da importacao

Isso deve existir, no minimo, para:

- chamados
- ativos
- usuarios
- categorias
- notas/historicos relevantes

### 2. Camada de staging

Antes de gravar o dado final, o sistema deve suportar uma camada de staging com estas capacidades:

- armazenamento do dado exatamente como veio do legado
- controle por lote de importacao
- status de processamento por registro
- log de erros de mapeamento
- marcacao de conflitos
- reprocessamento de registros falhos

Essa camada evita contaminar o banco principal com dados inconsistentes.

### 3. Mapeamento de entidades

O projeto deve possuir um mapa claro de correspondencia entre os sistemas legados e o modelo final do HelpDesk.

#### SDI -> HelpDesk

- chamado legado -> ticket
- categoria antiga -> categoria nova
- prioridade antiga -> prioridade do sistema
- status antigo -> status atual
- solicitante antigo -> usuario do HelpDesk
- tecnico antigo -> assignee ou colaborador do ticket
- observacoes antigas -> mensagens, eventos, notas ou historico

#### GPI -> HelpDesk

- item patrimonial -> ativo
- numero patrimonial -> tag/identificador unico
- modelo/equipamento -> categoria/modelo
- responsavel atual -> usuario vinculado
- fotos -> arquivos do ativo
- observacoes/anotacoes -> notas
- movimentacoes/historico -> eventos/historico do ativo
- campos especificos do legado -> atributos customizados

### 4. Campos customizados e estrutura flexivel

O GPI aparenta ter alta variabilidade de dados. O HelpDesk deve suportar:

- campos customizados por categoria de ativo
- modelos com especificacoes tecnicas
- anexos e imagens em volume
- notas e historicos extensos
- relacionamento de ativos com usuarios, localizacoes e eventos

Se houver campos que nao cabem no modelo relacional principal, o sistema deve permitir:

- armazenamento controlado em `Json`
- tabelas auxiliares de atributos
- configuracao de campos dinamicos por categoria

### 5. Preservacao de historico

A migracao nao pode levar apenas o estado atual.

O sistema deve conseguir absorver:

- data original de criacao
- data de fechamento ou baixa
- alteracoes historicas relevantes
- comentarios e anotacoes
- eventos de movimentacao
- autoria quando disponivel

Mesmo quando o modelo novo nao representar perfeitamente o legado, deve existir um modo de preservar o contexto historico, nem que seja como evento ou nota importada.

### 6. Importacao de arquivos e imagens

Para o GPI, o sistema deve prever:

- importacao em lote de imagens
- relacionamento confiavel entre arquivo e ativo
- nomes unicos ou hashing para evitar colisoes
- metadados de origem do arquivo
- storage preparado para volume maior

Capacidades desejadas:

- validacao de tipo e tamanho
- thumbnails ou preview
- organizacao por ativo/usuario/lote
- marcacao de upload legado

### 7. Conciliacao de usuarios

Usuarios do legado precisam ser reconciliados com usuarios do HelpDesk.

O sistema deve permitir conciliar por:

- email
- matricula
- login de dominio
- nome normalizado
- identificador legado

Tambem deve existir uma politica para:

- usuario encontrado automaticamente
- usuario com conflito
- usuario inexistente no HelpDesk
- usuario inativo mas historicamente relevante

### 8. Importacao idempotente

Os importadores devem poder rodar novamente sem duplicar registros.

Para isso, o sistema deve suportar:

- chaves unicas por `legacySource + legacyId`
- update controlado em vez de insert cego
- reprocessamento de lotes
- logs por execucao
- comparacao entre dado atual e dado importado

### 9. Validacao e qualidade de dados

Antes da carga final, o sistema deve conseguir validar:

- campos obrigatorios ausentes
- datas invalidas
- categorias nao mapeadas
- usuarios nao encontrados
- tags patrimoniais duplicadas
- imagens sem entidade destino
- status antigos sem correspondencia

Saida esperada da validacao:

- registros validos
- registros com alerta
- registros bloqueados
- relatorio final por lote

### 10. Operacao da migracao

A migracao deve ser tratada como processo controlado e nao como acao manual isolada.

O sistema deve apoiar:

- migracao piloto
- homologacao com amostra real
- carga por lotes
- rollback logico quando possivel
- relatorio de sucesso e falha
- rastreabilidade por lote

## Features que o HelpDesk deve ter para suportar a migracao

### Features obrigatorias

- identificacao de origem legada por registro
- staging de importacao
- reconciliacao de usuarios
- reconciliacao de categorias
- reconciliacao de status e prioridades
- importacao de historicos e notas
- importacao de imagens e anexos
- suporte a campos customizados
- importacao idempotente
- painel de erros de migracao
- logs por lote

### Features desejaveis

- preview antes da carga final
- simulacao de migracao
- dashboard de progresso por lote
- comparativo legado x HelpDesk
- reprocessamento seletivo
- bloqueio de registros com conflito
- ferramenta de merge de usuarios/ativos duplicados

## Escopo especifico por legado

### SDI

O HelpDesk deve estar pronto para receber:

- tickets com descricao longa
- datas originais de abertura e fechamento
- SLA ou tempo de espera legado
- categorias especificas
- responsavel antigo
- observacoes e interacoes
- status historico quando existir

### GPI

O HelpDesk deve estar pronto para receber:

- ativos com numero patrimonial unico
- modelos e categorias detalhadas
- imagens
- notas e historicos
- relacao com usuarios
- localizacao
- status patrimonial
- atributos tecnicos e variaveis customizadas
- descartaveis e outros itens que talvez exijam modelagem complementar

## Riscos que precisam ser considerados

- duplicidade de usuarios
- duplicidade de ativos
- perda de historico por simplificacao de modelo
- imagens sem vinculo correto
- categorias antigas sem equivalencia clara
- dados livres demais para o schema atual
- seeds e testes ficarem incoerentes com a nova estrutura
- impacto de performance se tudo for importado sem indices e sem estrategia de lote

## Recomendacao de estrategia

### Fase 1. Descoberta

- inventariar tabelas, arquivos e relacionamentos do SDI
- inventariar tabelas, arquivos e relacionamentos do GPI
- classificar campos obrigatorios, importantes e opcionais

### Fase 2. Preparacao do modelo

- ajustar schema para legado e campos customizados
- criar staging
- criar chaves de conciliacao
- preparar storage de imagens/anexos

### Fase 3. Mapeamento

- definir tabela de equivalencia de categorias
- definir tabela de equivalencia de usuarios
- definir mapa de status/prioridades

### Fase 4. Piloto

- importar amostra pequena
- validar visualmente e funcionalmente
- corrigir conflitos de modelagem

### Fase 5. Carga completa

- importar em lotes
- registrar erros
- validar consistencia
- liberar consulta operacional

### Fase 6. Pos-migracao

- validar contagens
- revisar duplicidades
- auditar amostras
- decidir se o legado sera descontinuado ou sincronizado

## Conclusao

Para receber SDI e GPI, o HelpDesk precisa ser preparado como plataforma de migracao, nao apenas como sistema de cadastro.

O sistema deve possuir:

- compatibilidade com IDs legados
- staging
- importacao em lote
- campos customizados
- suporte robusto a historico, notas, anexos e imagens
- conciliacao de entidades
- validacao e rastreabilidade

Sem isso, a importacao pode ate entrar, mas o resultado tende a ser inconsistente, dificil de auditar e caro de manter.

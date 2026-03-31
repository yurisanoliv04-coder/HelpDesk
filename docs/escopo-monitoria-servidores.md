# Escopo de Features para Monitoria de Servidores no HelpDesk

## Objetivo

Definir o escopo funcional e tecnico para que o HelpDesk possa futuramente exibir, na area de `reports`, a saude de servidores e sistemas externos.

O objetivo nao e transformar o HelpDesk em uma plataforma completa de observabilidade, mas sim permitir que ele:

- visualize o status dos servidores
- identifique lentidao ou indisponibilidade
- consolide incidentes operacionais
- relacione falhas de infraestrutura com chamados

## Pergunta central

O que o HelpDesk deve ter para implementar um sistema de monitoria de servidores?

Resposta curta:

- coleta
- armazenamento
- avaliacao de saude
- exibicao em reports
- alertas
- integracao com chamados

## Escopo funcional

### 1. Cadastro de alvos monitorados

O sistema deve permitir cadastrar o que sera monitorado:

- servidores
- aplicacoes web
- bancos de dados
- APIs
- equipamentos de rede
- servicos internos

Cada alvo monitorado deve ter:

- nome amigavel
- tipo
- ambiente (`producao`, `homologacao`, `teste`)
- endereco IP ou hostname
- porta
- URL quando aplicavel
- area responsavel
- criticidade
- observacoes

### 2. Tipos de checagem

O sistema deve suportar, no minimo:

- `ping` ou reachability
- `HTTP/HTTPS`
- `TCP`
- tempo de resposta
- disponibilidade

Checagens desejaveis em fase seguinte:

- validade de certificado SSL
- espaco em disco
- uso de CPU
- uso de memoria
- status de processo/servico
- conectividade com banco
- health endpoint de aplicacoes

### 3. Politica de saude

Cada alvo deve ter regras de classificacao de saude:

- `saudavel`
- `degradado`
- `indisponivel`
- `desconhecido`

Exemplos de criterio:

- ping acima de X ms = degradado
- timeout ou falha de conexao = indisponivel
- endpoint responde 200 mas lento = degradado
- endpoint responde 5xx = indisponivel

### 4. Historico de medições

O sistema deve armazenar historico suficiente para:

- mostrar tendencia
- detectar intermitencia
- gerar grafico de performance
- diferenciar incidente momentaneo de problema recorrente

Campos minimos de historico:

- alvo monitorado
- tipo de checagem
- status resultante
- latencia
- codigo de resposta quando houver
- mensagem de erro
- timestamp da medicao

### 5. Painel na pagina de reports

A pagina de `reports` deve conseguir exibir:

- resumo geral do ambiente
- quantidade de servidores saudaveis
- quantidade de servidores degradados
- quantidade de servidores indisponiveis
- lista dos incidentes ativos
- historico recente de falhas
- ranking de maiores tempos de resposta
- graficos de tendencia

Visualizacoes desejadas:

- cards de status
- tabela por servidor
- timeline de incidentes
- grafico de latencia
- filtros por ambiente, sistema e criticidade

### 6. Alertas

O sistema deve poder gerar alertas quando ocorrer:

- indisponibilidade
- lentidao acima do limite
- oscilacao frequente
- degradacao prolongada

Saidas possiveis:

- alerta visual no reports
- notificacao interna
- abertura automatica de chamado
- webhook
- envio para email, chat corporativo ou outro canal

### 7. Integracao com chamados

Esse e o maior ganho de usar monitoria dentro do HelpDesk.

Quando um alvo falhar, o sistema deve poder:

- abrir chamado automaticamente
- anexar evidencias tecnicas ao chamado
- evitar duplicacao de incidentes iguais
- vincular o servidor ao ticket
- registrar horario de inicio e normalizacao

Isso cria um fluxo operacional mais forte:

- monitor detecta
- HelpDesk registra
- equipe atua
- resolucao fica auditada

## Escopo tecnico

### 1. Camada de coleta

O HelpDesk precisa de uma forma de executar checagens periodicas.

Isso pode ser feito de 2 maneiras:

#### Opcao A. Coleta interna

O proprio HelpDesk executa checagens.

Necessita:

- agendador
- worker/background jobs
- controle de timeout
- logs de execucao

#### Opcao B. Integracao externa

Uma ferramenta dedicada monitora os servidores e o HelpDesk apenas consome os resultados.

Exemplos:

- Zabbix
- Grafana/Prometheus
- Uptime Kuma
- PRTG
- Datadog

Necessita:

- consumo de API
- webhooks
- normalizacao dos eventos recebidos

### 2. Modelo de dados

O sistema deve ter entidades como:

- `MonitoredTarget`
- `HealthCheck`
- `HealthMetric`
- `Incident`
- `IncidentEvent`
- `IncidentTicketLink`

Capacidades desejadas do modelo:

- multiplos checks por alvo
- historico de medicao
- incidente agrupando varias falhas seguidas
- relacao opcional com ticket

### 3. Armazenamento de series temporais

Para monitoria basica, PostgreSQL pode suportar bem.

Mas, se o volume crescer muito, pode ser necessario:

- agregacao por periodo
- retencao de historico
- arquivamento
- ou uso de ferramenta especializada para metricas

Para fase inicial, PostgreSQL basta se:

- o intervalo de coleta for controlado
- houver indices adequados
- o historico bruto nao crescer sem politica de retencao

### 4. Frequencia de checagem

O sistema deve permitir configurar por alvo:

- intervalo de coleta
- timeout
- numero de tentativas
- janela para confirmar falha

Exemplo:

- checar a cada 1 minuto
- considerar indisponivel apos 3 falhas consecutivas
- considerar degradado se latencia exceder 2 segundos

### 5. Seguranca e acesso

A monitoria nao deve expor infraestrutura sensivel a todos os perfis.

O sistema deve suportar:

- permissao por perfil
- mascaramento de informacoes sensiveis
- segregacao por ambiente
- controle sobre credenciais e endpoints internos

## Features obrigatorias

- cadastro de servidores e servicos monitorados
- checks de disponibilidade e latencia
- historico de medições
- painel na pagina de reports
- classificacao de saude
- incidentes ativos e resolvidos
- alertas
- integracao com chamados
- filtros por ambiente/sistema/criticidade

## Features desejaveis

- integracao com ferramenta externa de monitoramento
- SSL/certificado
- CPU, memoria e disco
- janelas de manutencao
- dependencia entre servicos
- notificacao por canais externos
- SLO/SLA tecnico
- comparacao entre periodos

## Recomendacao de estrategia

### Estrategia mais segura

Usar o HelpDesk como painel operacional e de incidentes, mas integrar a coleta a uma ferramenta externa especializada.

Motivos:

- menor risco tecnico
- menor acoplamento
- melhor escalabilidade
- observabilidade mais madura
- o HelpDesk fica responsavel pela experiencia operacional, nao por toda a telemetria

### Quando faz sentido coleta interna

Coleta interna faz sentido se a necessidade inicial for simples:

- poucos servidores
- checagens basicas
- foco em disponibilidade e lentidao
- sem necessidade de observabilidade profunda

## Roadmap sugerido

### Fase 1. Visibilidade basica

- cadastro de alvos
- checks simples
- cards e tabela em reports
- status atual
- historico curto

### Fase 2. Incidentes

- abertura automatica de chamado
- timeline de falhas
- consolidacao por incidente
- notificacao

### Fase 3. Integracao externa

- leitura de API/webhook de ferramenta dedicada
- sincronizacao de eventos
- enriquecimento dos chamados

### Fase 4. Maturidade operacional

- dashboards executivos
- SLO/SLA tecnico
- manutencoes planejadas
- dependencia entre sistemas

## Conclusao

Para que o HelpDesk tenha monitoria de servidores de forma util, a pagina de `reports` deve evoluir de relatorio estatico para um painel operacional de saude.

O sistema deve ter:

- alvos monitorados
- checks
- historico
- classificacao de saude
- incidentes
- alertas
- vinculo com chamados

O melhor desenho, no medio prazo, e:

- monitoramento especializado fazendo coleta
- HelpDesk centralizando visibilidade, incidentes e acao operacional

Assim o produto ganha valor real sem assumir responsabilidade excessiva de observabilidade profunda desde o primeiro momento.

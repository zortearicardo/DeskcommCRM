---
impacto: nada_mudou
secao: corrigido
titulo: A recusa do Google na renovação diz o status HTTP, e a recusa sem motivo vira conexão quebrada
---

Quando a renovação do token de uma agenda do Google falhava, a frase gravada dizia "sem resposta" mesmo quando o Google tinha respondido — quem lê procurava problema de rede para um acesso revogado. Agora a frase nomeia o status (`HTTP 400 (invalid_grant: ...)`), e a recusa que o Google respondeu com erro (não-2xx) sem motivo reconhecido marca a conexão como quebrada (`error`), em vez de ficar saudável repetindo para sempre. Queda de rede continua transitória, sem mexer na conexão — tanto a que acontece antes da resposta quanto a que corta o corpo no meio da leitura de uma resposta 200. Uma resposta 200 sem `access_token` também não conta como recusa e não mexe na conexão.

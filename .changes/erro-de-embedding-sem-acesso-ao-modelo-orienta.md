---
impacto: nada_mudou
secao: corrigido
titulo: O erro "não entrou na base de conhecimento" por modelo sem acesso agora orienta o que fazer
---

Quando a chave da OpenAI cadastrada é de um projeto sem o modelo de embedding
liberado, o cartão do material na base de conhecimento mostrava só o texto
cru da API: `Project proj_... does not have access to model
text-embedding-3-small`, sem nenhuma pista do que fazer.

A mensagem em "Por que não entrou" agora explica, em português, onde
verificar (platform.openai.com › Settings › Projects › Limits) — mantendo o
detalhe original da OpenAI logo depois, para quem for depurar.

Crédito: @zortearicardo

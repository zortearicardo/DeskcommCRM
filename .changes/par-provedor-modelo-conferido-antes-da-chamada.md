---
impacto: nada_mudou
secao: corrigido
titulo: A IA confere o par provedor e modelo antes de chamar, e um Claude não vai mais para a OpenAI
---

Antes de cada chamada de IA (atendimento, agente, mídia, base de conhecimento e classificação), o sistema confere se o modelo é do provedor que vai receber o pedido. Um par trocado, como um modelo Claude enviado para a OpenAI, é recusado antes de sair, com o motivo no log, em vez de virar um erro do provedor no meio da fila. A classificação de clima de uma empresa que usa OpenAI, Google ou DeepSeek passa a usar o modelo da própria empresa; sem par próprio que funcione, segue com o modelo padrão de antes. Agentes e respostas automáticas continuam respondendo como antes, sem nada a configurar. Crédito: @webtecnica, a partir do relato de @Fabricio-Point-Machine.

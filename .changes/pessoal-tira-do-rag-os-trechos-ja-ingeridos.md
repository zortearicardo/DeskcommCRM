---
impacto: nada_mudou
secao: corrigido
titulo: Marcar um contato como pessoal tira do RAG os trechos já ingeridos
---

Marcar um contato como pessoal já impedia que as conversas dele entrassem em ingestões futuras, mas os trechos que já estavam no acervo continuavam alcançáveis pelo agente como conhecimento. Agora a marcação também remove esses trechos, e a auditoria registra quantos saíram. Desmarcar não reingere: a conversa volta à vista e só volta ao acervo quando alguém a marcar de novo como útil para o RAG.

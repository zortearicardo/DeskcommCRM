---
impacto: nada_mudou
secao: corrigido
titulo: A audiência da campanha lê até o fim, e a prévia avisa quando bate o teto de 20.000
---

As três leituras que montam a audiência de uma campanha (contatos do recorte, contatos sem filtro de negócio e o negócio mais novo de cada contato) paginavam por `range` e encerravam na primeira página "curta". Numa instalação com o `max_rows` do PostgREST abaixo de 1.000 isso parava a leitura cedo, e a campanha saía com menos gente do que o filtro pedia — em silêncio; um negócio criado ou movido no meio da leitura também deslocava o `offset`. Agora a paginação é por keyset em (`created_at`, `id`) e só a página vazia encerra. E quando o recorte de negócio bate o teto de 20.000 linhas, a prévia avisa que a lista pode estar incompleta, em vez de cortar calada.

---
impacto: nada_mudou
secao: corrigido
titulo: Campanha com funil de mais de 1.000 negócios prepara a audiência inteira
---

A consulta que escolhe os contatos pelo negócio (funil, etapa, responsável ou situação) lia no máximo 1.000 linhas: o PostgREST corta toda resposta nesse teto e a consulta não paginava. Uma campanha filtrada por um funil maior preparava uma audiência parcial, em silêncio — sem erro e sem aviso na prévia. A consulta agora pagina em blocos até o teto de 20.000 linhas (o teto que já existia, e que antes nunca era alcançado por causa do corte). Nenhuma ação é necessária.

---
impacto: nada_mudou
secao: corrigido
titulo: Campanha com filtro de funil grande volta a preparar (a URL não estoura mais)
---

Na preparação de uma campanha, o filtro de funil (ou de etapa, responsável ou situação) punha todos os contatos do recorte numa única URL; acima de ~200 contatos o gateway devolvia `414 URI too long` e a preparação inteira caía. A consulta agora é fatiada em lotes que cabem na URL, com a ordem e o corte feitos uma única vez no fim (a ordem e o corte são os mesmos; com limite acima de 1.000 a campanha agora respeita o limite escolhido, antes cortado em 1.000 pelo servidor), a lista de excluídos saiu da URL (é aplicada antes do corte) e os incluídos à mão também vão em lotes. Nenhuma ação é necessária.

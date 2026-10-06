---
impacto: capacidade_nova
secao: adicionado
titulo: Pausar todas e Retomar todas — a pausa em lote chega à Central de Conexões
---

A Central de Conexões ganha os botões **Pausar todas** e **Retomar todas**, com a contagem ao lado: uma só ação leva todos os números da empresa ao estado escolhido, no lugar de um clique por canal durante a janela de manutenção do rodízio. A ação usa exatamente o mesmo caminho da pausa individual — um registro de auditoria por canal, com quem fez —, então nada muda no efeito: pausado continua pausado e o que era recusado continua recusado. Repetir é seguro: canais que já estavam no estado escolhido não são gravados de novo nem enchem o histórico de eventos. Os excluídos ficam de fora da operação, sem virar erro, e se algum número não sair o aviso lista quais canais não saíram — nunca um sucesso pintado no que falhou.

Contribuição de @webtecnica (#2405).

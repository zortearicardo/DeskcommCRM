---
impacto: nada_mudou
secao: corrigido
titulo: A agenda do Google volta a pedir reconexão quando o Google revoga o acesso
---

Quando o Google recusava a renovação do acesso e mandava uma explicação junto (por exemplo "Token has been expired or revoked."), a conexão seguia aparecendo como conectada e a renovação falhava em silêncio a cada 10 minutos, sem ninguém ser avisado. Agora essa recusa é reconhecida: a agenda passa a mostrar que é preciso reconectar, e depois de reconectar a agenda volta a funcionar como antes. Um app do Google mal configurado na instalação também deixa de ser tentado de novo sem fim: a agenda passa a mostrar que o Google recusou o acesso, com o motivo que ele mandou. Não há nada a configurar. Crédito: @webtecnica, a partir do relato de @marcelovolei15.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { processRagIndexer } from "@/workers/rag-indexer";
import { createAdminClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/ai/embed";
import { resolverChaveDeEmbedding } from "@/lib/ai/embeddings/chave";
import { acquireDebounce } from "@/lib/ai/rag/debounce";
import { createKnowledgeVersion, markVersionFailed } from "@/lib/ai/rag/version";

/**
 * "Project proj_... does not have access to model text-embedding-3-small" é o
 * texto CRU que a OpenAI devolve quando a chave existe mas o projeto dela não
 * tem o modelo liberado (Settings › Project › Limits, ou billing ausente) —
 * um erro de configuração do lado do cliente, não do produto. Sem tradução,
 * era tudo que o operador leigo via em "Por que não entrou", sem nenhuma
 * pista do que fazer — diferente de "sem_credencial", que já orienta
 * ("Cadastre uma em IA › Credenciais"). Este teste prova que a mesma
 * orientação acionável chega tanto a `last_index_error` quanto ao aviso da
 * Central, sem perder o detalhe original (precisa pra depurar).
 */

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/ai/embed", () => ({
  embedText: vi.fn(),
  SemChaveDeEmbeddingError: class SemChaveDeEmbeddingError extends Error {},
}));
vi.mock("@/lib/ai/embeddings/chave", () => ({ resolverChaveDeEmbedding: vi.fn() }));
vi.mock("@/lib/ai/rag/debounce", () => ({ acquireDebounce: vi.fn() }));
vi.mock("@/lib/ai/rag/version", () => ({
  createKnowledgeVersion: vi.fn(),
  markVersionReady: vi.fn(),
  markVersionFailed: vi.fn(),
  activateVersion: vi.fn(),
}));

const FONTE = {
  id: "ks-faq",
  organization_id: "org-1",
  agent_id: null,
  source_type: "faq",
  name: "Perguntas frequentes",
  status: "ready",
  is_active: true,
  source_metadata: {},
};

const ITEM_DA_FAQ = { question: "Vocês entregam aos domingos?", answer: "Sim, das 9h às 18h." };

const EVENTO = {
  id: "ev-1",
  organization_id: "org-1",
  event_type: "knowledge_source.updated",
  entity_kind: "ai_knowledge_source",
  entity_id: "ks-faq",
  payload: { knowledge_source_id: "ks-faq" },
  metadata: {},
  created_at: new Date().toISOString(),
};

const ERRO_OPENAI =
  "Project `proj_9UmJb0z0dLH2fmCCjrGWkgju` does not have access to model `text-embedding-3-small`";

let carimbos: Array<Record<string, unknown>> = [];
let avisos: Array<Record<string, unknown>> = [];

beforeEach(() => {
  vi.clearAllMocks();
  carimbos = [];
  avisos = [];

  vi.mocked(createAdminClient).mockReturnValue({
    from: (tabela: string) => {
      if (tabela === "ai_knowledge_sources") {
        const leitura = {
          select: () => leitura,
          eq: () => leitura,
          maybeSingle: () => Promise.resolve({ data: FONTE, error: null }),
        };
        return {
          ...leitura,
          update: (campos: Record<string, unknown>) => {
            carimbos.push(campos);
            const escrita = { eq: () => escrita, then: (ok: (v: unknown) => void) => ok({ error: null }) };
            return escrita;
          },
        };
      }
      if (tabela === "ai_faq_items") {
        const leitura = {
          select: () => leitura,
          eq: () => leitura,
          order: () => Promise.resolve({ data: [ITEM_DA_FAQ], error: null }),
        };
        return leitura;
      }
      if (tabela === "agent_inbox_items") {
        const leitura = {
          select: () => leitura,
          eq: () => leitura,
          is: () => leitura,
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        };
        return {
          ...leitura,
          insert: (linha: Record<string, unknown>) => {
            avisos.push(linha);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`tabela não dublada no teste: ${tabela}`);
    },
  } as never);

  vi.mocked(acquireDebounce).mockResolvedValue(true as never);
  vi.mocked(resolverChaveDeEmbedding).mockResolvedValue({ origem: "org" } as never);
  vi.mocked(createKnowledgeVersion).mockResolvedValue({
    versionId: "v-1",
    versionNumber: 1,
  } as never);
  vi.mocked(embedText).mockRejectedValue(new Error(ERRO_OPENAI));
});

describe("rag-indexer — traduz erro de modelo sem acesso", () => {
  it("last_index_error e o aviso da Central trazem orientação, sem perder o detalhe original", async () => {
    const resultado = await processRagIndexer(EVENTO as never);

    expect(resultado.status).toBe("error");
    expect(vi.mocked(markVersionFailed)).toHaveBeenCalledTimes(1);

    const falha = carimbos.find((c) => c["last_index_status"] === "failed");
    expect(falha, "a fonte precisa ser carimbada como failed").toBeDefined();
    const erroGravado = String(falha!["last_index_error"]);
    expect(erroGravado).toContain("platform.openai.com");
    expect(erroGravado).toContain(ERRO_OPENAI);

    expect(avisos).toHaveLength(1);
    const corpoDoAviso = String(avisos[0]!["body"]);
    expect(corpoDoAviso).toContain("platform.openai.com");
    expect(corpoDoAviso).toContain(ERRO_OPENAI);
  });
});

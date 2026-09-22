import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";

import {
  acordarJobsAdiadosPorJanela,
  RAZAO_ADIAMENTO_POR_JANELA,
} from "@/lib/agent-engine/pacing/aviso-de-janela";

/**
 * MUDAR A JANELA TEM DE ACORDAR QUEM DORMIA NELA.
 *
 * ─── O defeito que este arquivo existe para ter pegado ─────────────────────
 *
 * `rescheduleJob` (queue.ts) grava, no `inbound_turn` adiado por janela
 * fechada, um `run_after` CONGELADO — calculado com a janela vigente no
 * INSTANTE do adiamento. `claimJobs` só reclama o job quando esse timestamp
 * vence. Salvar uma janela nova em Conexões › Anti-ban (`PUT
 * /api/v1/ai/pacing`) fazia upsert em `channel_knobs` e NUNCA tocava
 * `job_queue` — então ampliar/adiantar a janela não acordava quem já
 * dormia com o `run_after` da janela velha. Sintoma relatado por um
 * operador real: "mudei a janela de resposta e ainda não enviou".
 *
 * Invariante e não unidade porque o que decide é a semântica do
 * `payload->>'channel_session_id'` e do `least()` contra linhas de verdade —
 * um dublê de `Queryable` provaria só que a string do SQL foi chamada, nunca
 * que o filtro casa a linha certa e poupa a errada.
 *
 * Roda contra o Postgres efêmero do `scripts/test-db.sh`, com o
 * `baseline.sql` aplicado.
 */
const container = process.env.TEST_DB_CONTAINER;
if (!container) {
  throw new Error("TEST_DB_CONTAINER not set — rode via `pnpm test:db` (scripts/test-db.sh)");
}

const PORT = Number(process.env.TEST_DB_PORT ?? 54329);
const pool = new pg.Pool({
  connectionString: `postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres`,
  max: 2,
});

const ORG = "ac0da4a0-0000-4000-8000-000000000201";
const ORG_VIZINHA = "ac0da4a0-0000-4000-8000-000000000202";
const CONTATO = "ac0da4a0-0000-4000-8000-000000000203";
const CANAL = "ac0da4a0-0000-4000-8000-000000000204";
const CANAL_VIZINHO = "ac0da4a0-0000-4000-8000-000000000205";

const DAQUI_A_UM_DIA = new Date(Date.now() + 24 * 3_600_000);
const DAQUI_A_UMA_HORA = new Date(Date.now() + 3_600_000);

async function enfileirar(opts: {
  org?: string;
  channelSessionId?: string;
  lastError?: string | null;
  status?: "pending" | "running" | "done";
  runAfter?: Date;
}): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `insert into job_queue (organization_id, contact_id, kind, payload, status, run_after, last_error)
     values ($1, $2, 'inbound_turn', jsonb_build_object('channel_session_id', $3::text), $4, $5, $6)
     returning id`,
    [
      opts.org ?? ORG,
      CONTATO,
      opts.channelSessionId ?? CANAL,
      opts.status ?? "pending",
      opts.runAfter ?? DAQUI_A_UM_DIA,
      opts.lastError === undefined ? RAZAO_ADIAMENTO_POR_JANELA : opts.lastError,
    ],
  );
  return rows[0]!.id;
}

async function runAfterDe(jobId: string): Promise<Date> {
  const { rows } = await pool.query<{ run_after: Date }>(
    `select run_after from job_queue where id = $1`,
    [jobId],
  );
  return rows[0]!.run_after;
}

beforeAll(async () => {
  for (const [id, slug] of [
    [ORG, "org-acordar-janela"],
    [ORG_VIZINHA, "org-acordar-janela-vizinha"],
  ] as const) {
    await pool.query(
      `insert into organizations (id, slug, legal_name, display_name)
       values ($1, $2, 'Org Acordar LTDA', 'Org Acordar') on conflict (id) do nothing`,
      [id, slug],
    );
  }
  await pool.query(
    `insert into contacts (id, organization_id, name, phone_number)
     values ($1, $2, 'Lead do Acordar', '+5511900000201') on conflict (id) do nothing`,
    [CONTATO, ORG],
  );
});

afterEach(async () => {
  await pool.query("delete from job_queue where organization_id = any($1::uuid[])", [
    [ORG, ORG_VIZINHA],
  ]);
});

afterAll(async () => {
  await pool.query("delete from job_queue where organization_id = any($1::uuid[])", [
    [ORG, ORG_VIZINHA],
  ]);
  await pool.query("delete from contacts where id = $1", [CONTATO]);
  await pool.query("delete from organizations where id = any($1::uuid[])", [[ORG, ORG_VIZINHA]]);
  await pool.end();
});

describe("acordarJobsAdiadosPorJanela, contra o banco real", () => {
  it("adianta o run_after congelado do job represado pela janela antiga", async () => {
    const job = await enfileirar({ runAfter: DAQUI_A_UM_DIA });

    const acordados = await acordarJobsAdiadosPorJanela(pool, {
      tenantId: ORG,
      channelSessionId: CANAL,
      novaAbertura: DAQUI_A_UMA_HORA,
    });

    expect(acordados).toBe(1);
    expect((await runAfterDe(job)).getTime()).toBe(DAQUI_A_UMA_HORA.getTime());
  });

  it("não mexe em job adiado por outro motivo (ex.: sessão fora do ar)", async () => {
    const job = await enfileirar({
      lastError: "sessão fora do ar — turno adiado",
      runAfter: DAQUI_A_UM_DIA,
    });

    const acordados = await acordarJobsAdiadosPorJanela(pool, {
      tenantId: ORG,
      channelSessionId: CANAL,
      novaAbertura: DAQUI_A_UMA_HORA,
    });

    expect(acordados).toBe(0);
    expect((await runAfterDe(job)).getTime()).toBe(DAQUI_A_UM_DIA.getTime());
  });

  it("não mexe em job que não está 'pending' (já rodando, por exemplo)", async () => {
    const job = await enfileirar({ status: "running", runAfter: DAQUI_A_UM_DIA });

    const acordados = await acordarJobsAdiadosPorJanela(pool, {
      tenantId: ORG,
      channelSessionId: CANAL,
      novaAbertura: DAQUI_A_UMA_HORA,
    });

    expect(acordados).toBe(0);
    expect((await runAfterDe(job)).getTime()).toBe(DAQUI_A_UM_DIA.getTime());
  });

  it("não mexe em job de outro canal, mesma organização", async () => {
    const job = await enfileirar({ channelSessionId: CANAL_VIZINHO, runAfter: DAQUI_A_UM_DIA });

    const acordados = await acordarJobsAdiadosPorJanela(pool, {
      tenantId: ORG,
      channelSessionId: CANAL,
      novaAbertura: DAQUI_A_UMA_HORA,
    });

    expect(acordados).toBe(0);
    expect((await runAfterDe(job)).getTime()).toBe(DAQUI_A_UM_DIA.getTime());
  });

  it("não mexe em job de outra organização, mesmo channel_session_id", async () => {
    const job = await enfileirar({ org: ORG_VIZINHA, runAfter: DAQUI_A_UM_DIA });

    const acordados = await acordarJobsAdiadosPorJanela(pool, {
      tenantId: ORG,
      channelSessionId: CANAL,
      novaAbertura: DAQUI_A_UMA_HORA,
    });

    expect(acordados).toBe(0);
    expect((await runAfterDe(job)).getTime()).toBe(DAQUI_A_UM_DIA.getTime());
  });

  it("só ADIANTA — janela mais estrita não empurra job já represado pra mais tarde", async () => {
    const job = await enfileirar({ runAfter: DAQUI_A_UMA_HORA });

    const acordados = await acordarJobsAdiadosPorJanela(pool, {
      tenantId: ORG,
      channelSessionId: CANAL,
      novaAbertura: DAQUI_A_UM_DIA,
    });

    // least(run_after, novaAbertura): o menor dos dois vence, e o job continua
    // valendo a hora mais cedo que já tinha — o worker reavalia a janela no
    // claim e reagenda de novo se ainda estiver fechada.
    expect(acordados).toBe(1);
    expect((await runAfterDe(job)).getTime()).toBe(DAQUI_A_UMA_HORA.getTime());
  });
});

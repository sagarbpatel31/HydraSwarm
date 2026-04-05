import { HydraDBClient } from "@hydra_db/node";
import { TENANT_ID } from "./config";

// --- Singleton client ---

let _client: HydraDBClient | null = null;

function getClient(): HydraDBClient {
  if (!_client) {
    _client = new HydraDBClient({
      token: process.env.HYDRADB_API_KEY!,
    });
  }
  return _client;
}

// --- Types ---

export interface RecallItem {
  id: string;
  title: string;
  content: string;
  score: number;
  sourceType?: string;
  metadata?: Record<string, unknown>;
}

export interface RecallBundle {
  knowledge: RecallItem[];
  roleMemory: RecallItem[];
  sharedMemory: RecallItem[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
}

// --- Sub-tenant helpers ---

function agentSubTenant(role: string): string {
  return `agent-${role}`;
}

const SHARED_SUB_TENANT = "shared";

// --- Tenant management ---

export async function ensureTenant(): Promise<void> {
  const client = getClient();
  try {
    await client.tenant.create({ tenant_id: TENANT_ID });
  } catch (err: unknown) {
    // Ignore already-exists errors
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("already exists") ||
      message.includes("409") ||
      message.includes("Conflict") ||
      message.includes("Plan limit") ||
      message.includes("403")
    ) {
      // Tenant already exists or plan limit reached (tenant was created before)
      return;
    }
    throw err;
  }
}

export async function checkConnection(): Promise<boolean> {
  const client = getClient();
  try {
    await client.tenant.getInfraStatus({ tenant_id: TENANT_ID });
    return true;
  } catch {
    // Tenant may not exist yet; try creating it
    try {
      await ensureTenant();
      return true;
    } catch {
      return false;
    }
  }
}

// --- Knowledge ingestion ---

export async function uploadKnowledge(params: {
  content: string;
  filename: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const client = getClient();
  const blob = new Blob([params.content], { type: "text/markdown" });
  const file = new File([blob], params.filename, { type: "text/markdown" });

  const fileMetadata = params.metadata
    ? JSON.stringify([{ metadata: params.metadata }])
    : undefined;

  await client.upload.knowledge({
    tenant_id: TENANT_ID,
    files: [file],
    file_metadata: fileMetadata,
    upsert: true,
  });
}

// --- Memory ingestion ---

export async function addAgentMemory(params: {
  role: string;
  text: string;
  title?: string;
  sourceId?: string;
}): Promise<void> {
  const client = getClient();
  await client.upload.addMemory({
    memories: [
      {
        source_id: params.sourceId,
        title: params.title,
        text: params.text,
        is_markdown: true,
        infer: true,
      },
    ],
    tenant_id: TENANT_ID,
    sub_tenant_id: agentSubTenant(params.role),
    upsert: true,
  });
}

export async function addSharedMemory(params: {
  text: string;
  title?: string;
  sourceId?: string;
}): Promise<void> {
  const client = getClient();
  await client.upload.addMemory({
    memories: [
      {
        source_id: params.sourceId,
        title: params.title,
        text: params.text,
        is_markdown: true,
        infer: true,
      },
    ],
    tenant_id: TENANT_ID,
    sub_tenant_id: SHARED_SUB_TENANT,
    upsert: true,
  });
}

// --- Recall ---

export async function recallKnowledge(
  query: string,
  maxResults = 5
): Promise<RecallItem[]> {
  const client = getClient();
  const result = await client.recall.fullRecall({
    tenant_id: TENANT_ID,
    query,
    max_results: maxResults,
    alpha: 0.7,
    recency_bias: 0.3,
    graph_context: true,
  });
  return normalizeChunks(result);
}

export async function recallAgentMemory(
  role: string,
  query: string,
  maxResults = 5
): Promise<RecallItem[]> {
  const client = getClient();
  const result = await client.recall.recallPreferences({
    tenant_id: TENANT_ID,
    sub_tenant_id: agentSubTenant(role),
    query,
    max_results: maxResults,
  });
  return normalizeChunks(result);
}

export async function recallSharedMemory(
  query: string,
  maxResults = 5
): Promise<RecallItem[]> {
  const client = getClient();
  const result = await client.recall.recallPreferences({
    tenant_id: TENANT_ID,
    sub_tenant_id: SHARED_SUB_TENANT,
    query,
    max_results: maxResults,
  });
  return normalizeChunks(result);
}

/**
 * Combined recall for an agent stage: knowledge + role memory + shared memory in parallel.
 */
export async function agentRecall(
  role: string,
  query: string
): Promise<RecallBundle> {
  const [knowledge, roleMemory, sharedMemory] = await Promise.all([
    recallKnowledge(query).catch(() => [] as RecallItem[]),
    recallAgentMemory(role, query).catch(() => [] as RecallItem[]),
    recallSharedMemory(query).catch(() => [] as RecallItem[]),
  ]);
  return { knowledge, roleMemory, sharedMemory };
}

// --- Artifact storage ---

/**
 * Store an agent artifact: upload as knowledge doc + summary as agent memory.
 */
export async function storeArtifact(params: {
  artifactId: string;
  runId: string;
  role: string;
  artifactType: string;
  title: string;
  content: string;
}): Promise<void> {
  const filename = `${params.runId}-${params.role}-${params.artifactType}.md`;
  const summary = params.content.slice(0, 300);

  await Promise.all([
    uploadKnowledge({
      content: params.content,
      filename,
      metadata: {
        run_id: params.runId,
        agent_role: params.role,
        artifact_type: params.artifactType,
        title: params.title,
      },
    }).catch((err) => {
      console.error(`Failed to upload knowledge for ${filename}:`, err);
    }),
    addAgentMemory({
      role: params.role,
      text: `[${params.artifactType}] ${params.title}: ${summary}`,
      title: params.title,
      sourceId: params.artifactId,
    }).catch((err) => {
      console.error(`Failed to store agent memory for ${params.role}:`, err);
    }),
  ]);
}

/**
 * Store a lesson as shared memory so all future agents can recall it.
 */
export async function storeLesson(params: {
  lessonId: string;
  title: string;
  content: string;
}): Promise<void> {
  await addSharedMemory({
    text: `[LESSON] ${params.title}: ${params.content}`,
    title: params.title,
    sourceId: params.lessonId,
  });
}

// --- Graph relations ---

export async function getGraphRelations(
  sourceId: string
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const client = getClient();
  try {
    const result = await client.fetch.graphRelationsBySourceId({
      source_id: sourceId,
      tenant_id: TENANT_ID,
    });
    return transformGraphResponse(result);
  } catch {
    return { nodes: [], edges: [] };
  }
}

// --- Helpers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeChunks(body: any): RecallItem[] {
  if (!body?.chunks) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return body.chunks.map((c: any) => {
    // Derive a meaningful title from source_title, source_id, or content
    let title = c.source_title ?? "";
    if (!title || title === "untitled") {
      title = c.source_id ?? "";
    }
    if (!title) {
      // Extract first heading or first line from content
      const content = c.chunk_content ?? "";
      const headingMatch = content.match(/^#+ (.+)/m);
      title = headingMatch ? headingMatch[1].slice(0, 60) : content.slice(0, 60).split("\n")[0] || "Memory item";
    }
    return {
      id: c.chunk_uuid ?? c.source_id ?? "unknown",
      title,
      content: c.chunk_content ?? "",
      score: c.relevancy_score ?? 0,
      sourceType: c.source_type,
      metadata: c.document_metadata,
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformGraphResponse(body: any): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const relations = body?.relations ?? body?.triplets ?? [];
  if (!relations.length) return { nodes: [], edges: [] };

  for (const relation of relations) {
    const triplets = relation.triplets ?? [relation];
    for (const t of triplets) {
      const subject = t.subject ?? t.head ?? "unknown";
      const object = t.object ?? t.tail ?? "unknown";
      const predicate = t.predicate ?? t.relation ?? "related_to";

      if (!nodeMap.has(subject)) {
        nodeMap.set(subject, { id: subject, label: subject, type: "entity" });
      }
      if (!nodeMap.has(object)) {
        nodeMap.set(object, { id: object, label: object, type: "entity" });
      }
      edges.push({ source: subject, target: object, relation: predicate });
    }
  }

  return { nodes: Array.from(nodeMap.values()), edges };
}

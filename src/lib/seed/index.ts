import {
  ensureTenant,
  uploadKnowledge,
  addAgentMemory,
  addSharedMemory,
} from "@/lib/hydra";
import { SEED_KNOWLEDGE } from "./knowledge";
import { SEED_AGENT_MEMORIES, SEED_SHARED_MEMORIES } from "./memories";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runSeed(): Promise<{
  success: boolean;
  knowledgeCount: number;
  memoryCount: number;
  sharedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];

  // Step 1: Ensure tenant exists
  await ensureTenant();

  // Step 2: Upload knowledge docs (with delay between uploads for rate limits)
  let knowledgeCount = 0;
  for (const doc of SEED_KNOWLEDGE) {
    try {
      await uploadKnowledge({
        content: doc.content,
        filename: doc.filename,
        metadata: doc.metadata,
      });
      knowledgeCount++;
    } catch (err) {
      const msg = `Knowledge upload failed for ${doc.filename}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(msg);
    }
    await delay(500);
  }

  // Step 3: Upload agent memories (batch per agent)
  let memoryCount = 0;
  for (const mem of SEED_AGENT_MEMORIES) {
    try {
      await addAgentMemory({
        role: mem.role,
        text: mem.text,
        title: mem.title,
      });
      memoryCount++;
    } catch (err) {
      const msg = `Agent memory failed for ${mem.role}/${mem.title}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(msg);
    }
  }

  // Step 4: Upload shared memories
  let sharedCount = 0;
  for (const mem of SEED_SHARED_MEMORIES) {
    try {
      await addSharedMemory({
        text: mem.text,
        title: mem.title,
      });
      sharedCount++;
    } catch (err) {
      const msg = `Shared memory failed for ${mem.title}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(msg);
    }
  }

  return {
    success: errors.length === 0,
    knowledgeCount,
    memoryCount,
    sharedCount,
    errors,
  };
}

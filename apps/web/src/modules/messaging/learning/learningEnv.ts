export function isSelfLearningRoutingEnabled(): boolean {
  return process.env.AI_SELF_LEARNING_ROUTING_ENABLED === "1";
}

export function isTemplateExperimentsEnabled(): boolean {
  return process.env.AI_TEMPLATE_EXPERIMENTS_ENABLED === "1";
}

export function templateMinSampleSize(): number {
  return Math.max(1, Number(process.env.AI_TEMPLATE_MIN_SAMPLE_SIZE ?? 10));
}

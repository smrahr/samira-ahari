// Brain settings. These move to the model_config / embedding_config tables when the admin panel exists.

// Free chat models, tried in order: OpenRouter falls back when one is down or rate-limited.
// Model ids: https://openrouter.ai/models
export const CHAT_MODELS = ['google/gemma-4-31b-it:free', 'nvidia/nemotron-3-super-120b-a12b:free'];
export const TEMPERATURE = 0.3;
// Generous because some free models spend tokens on hidden reasoning before the reply
export const MAX_TOKENS = 1500;

// Must match the chunks.embedding column (halfvec(2048)). Changing it means re-embedding the whole KB.
export const EMBED_MODEL = 'nvidia/nemotron-3-embed-1b:free';

export const CHUNK_CHARS = 1600; // ≈ 400 tokens
export const CHUNK_OVERLAP_CHARS = 200; // ≈ 50 tokens
export const TOP_K = 5;
export const MAX_CHUNKS_PER_DOC = 2;
// Calibrated for nemotron-3-embed: on-topic questions score ≈0.2–0.5, off-topic ones < 0.05
export const SIMILARITY_THRESHOLD = 0.15;

export const CONTACT = { email: 'samira.ahari@icloud.com', phone: '+98 936 960 0448' };

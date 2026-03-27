export interface IngestionJobPayload {
  taskId: string;
  documentId: string;
}

export interface ParsedDocumentArtifact extends IngestionJobPayload {
  artifactDir: string;
  parsedPath: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  textLength: number;
}

export interface ChunkRecord {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadataJson: Record<string, unknown>;
}

export interface SplitChunksArtifact extends IngestionJobPayload {
  artifactDir: string;
  chunksPath: string;
  chunkCount: number;
  fileName: string;
}

export interface EmbeddedChunk extends ChunkRecord {
  pointId: string;
  embedding: number[];
}

export interface EmbeddedChunksArtifact extends IngestionJobPayload {
  artifactDir: string;
  embeddingsPath: string;
  chunkCount: number;
  fileName: string;
}

export interface UpsertedVectorsArtifact extends IngestionJobPayload {
  artifactDir: string;
  vectorCount: number;
  fileName: string;
}

// src/lib/rag/vectorStore.ts
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class VectorStore {
  private pinecone: Pinecone;
  private indexName: string;
  private embeddingModel: any;
  private embeddingDimension: number;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    this.indexName = process.env.PINECONE_INDEX_NAME || 'study-space-rag';
    this.embeddingDimension = parseInt(process.env.EMBEDDING_DIMENSION || '1024');
    this.embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  }

  // Tạo embedding bằng Gemini
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.embeddingModel.embedContent({
        content: { parts: [{ text }] },
        taskType: TaskType.RETRIEVAL_DOCUMENT, // Hoặc RETRIEVAL_QUERY cho query
        outputDimensionality: this.embeddingDimension, // ✅ SET DIMENSION Ở ĐÂY
      });
      
      return result.embedding.values;
    } catch (error) {
      console.error('Embedding error:', error);
      throw error;
    }
  }

  // Batch embeddings cho hiệu suất tốt hơn
  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(
      texts.map(text => this.generateEmbedding(text))
    );
    return embeddings;
  }

  // Embed và lưu documents vào Pinecone
  async addDocuments(documents: Array<{
    id: string;
    content: string;
    metadata: Record<string, any>;
  }>) {
    const index = this.pinecone.index(this.indexName);
    
    // Tạo embeddings cho tất cả documents
    const contents = documents.map(doc => doc.content);
    const embeddings = await this.generateEmbeddings(contents);
    
    // Prepare vectors cho Pinecone
    const vectors = documents.map((doc, i) => ({
      id: doc.id,
      values: embeddings[i],
      metadata: {
        content: doc.content,
        ...doc.metadata,
        timestamp: Date.now(),
      },
    }));

    // Upsert theo batch (Pinecone recommends batches of 100)
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }
    
    return { 
      success: true, 
      count: vectors.length,
      dimension: embeddings[0]?.length || 0
    };
  }

  // Tìm kiếm similar documents
  async similaritySearch(
    query: string, 
    topK: number = 5,
    filter?: Record<string, any>
  ) {
    const index = this.pinecone.index(this.indexName);
    
    // Tạo embedding cho query
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Search trong Pinecone
    const results = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter, // Optional: filter by metadata
    });

    return results.matches?.map(match => ({
      id: match.id,
      score: match.score,
      content: match.metadata?.content as string,
      metadata: match.metadata,
    })) || [];
  }

  // Update document metadata
  async updateMetadata(id: string, metadata: Record<string, any>) {
    const index = this.pinecone.index(this.indexName);
    await index.update({
      id,
      metadata,
    });
    return { success: true };
  }

  // Xóa documents
  async deleteDocuments(ids: string[]) {
    const index = this.pinecone.index(this.indexName);
    await index.deleteMany(ids);
    return { success: true };
  }

  // Xóa tất cả documents theo filter
  async deleteByFilter(filter: Record<string, any>) {
    const index = this.pinecone.index(this.indexName);
    await index.deleteMany({ filter });
    return { success: true };
  }

  // Get stats về index
  async getStats() {
    const index = this.pinecone.index(this.indexName);
    const stats = await index.describeIndexStats();
    return stats;
  }
}

export const vectorStore = new VectorStore();
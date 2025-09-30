// src/lib/rag/chatbot.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { vectorStore } from './vectorStore';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ChatMessage {
  role: 'user' | 'model'; // Gemini uses 'model' instead of 'assistant'
  parts: string;
}

export class RAGChatbot {
  private model: any;
  private systemInstruction: string;

  constructor() {
    this.systemInstruction = `Bạn là trợ lý AI hỗ trợ sinh viên trên nền tảng mentoring "Study Space" của HCMUT.

Nhiệm vụ của bạn:
- Giúp sinh viên tìm mentor phù hợp
- Trả lời câu hỏi về nền tảng
- Cung cấp thông tin về mentors, khóa học, sự kiện
- Hỗ trợ kỹ thuật và hướng dẫn sử dụng

Quy tắc:
- Luôn lịch sự, thân thiện và chuyên nghiệp
- Sử dụng thông tin từ context để trả lời chính xác
- Nếu không biết câu trả lời, hãy thừa nhận một cách trung thực
- Trả lời bằng tiếng Việt trừ khi được yêu cầu khác
- Đưa ra gợi ý cụ thể và hữu ích`;

    // Gemini 1.5 Pro - best for RAG tasks
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-lite',
      systemInstruction: this.systemInstruction,
    });
  }

  // Main chat function
  async chat(
    userMessage: string, 
    conversationHistory: ChatMessage[] = [],
    options?: {
      temperature?: number;
      maxTokens?: number;
      topK?: number;
      filter?: Record<string, any>;
    }
  ) {
    const { 
      temperature = 0.7, 
      maxTokens = 2048,
      topK = 5,
      filter 
    } = options || {};

    try {
      // 1. Retrieve relevant documents from Pinecone
      const relevantDocs = await vectorStore.similaritySearch(
        userMessage, 
        topK,
        filter
      );
      
      // 2. Build context from retrieved documents
      const context = this.buildContext(relevantDocs);

      // 3. Prepare chat history for Gemini
      const chatHistory = conversationHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts }],
      }));

      // 4. Start chat session
      const chat = this.model.startChat({
        history: chatHistory,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          topP: 0.95,
          topK: 40,
        },
      });

      // 5. Send message with context
      const prompt = this.constructPrompt(userMessage, context);
      const result = await chat.sendMessage(prompt);
      const response = result.response;
      
      return {
        message: response.text(),
        sources: relevantDocs.map(doc => ({
          id: doc.id,
          score: doc.score,
          metadata: doc.metadata,
          snippet: doc.content.slice(0, 200),
        })),
        usage: {
          promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
          completionTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (error: any) {
      console.error('RAG Chat error:', error);
      throw new Error(`Chat failed: ${error.message}`);
    }
  }

  // Streaming response
  async chatStream(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    onChunk?: (text: string) => void
  ) {
    try {
      const relevantDocs = await vectorStore.similaritySearch(userMessage, 5);
      const context = this.buildContext(relevantDocs);

      const chatHistory = conversationHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts }],
      }));

      const chat = this.model.startChat({
        history: chatHistory,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      });

      const prompt = this.constructPrompt(userMessage, context);
      const result = await chat.sendMessageStream(prompt);

      let fullText = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        if (onChunk) {
          onChunk(chunkText);
        }
      }

      return {
        message: fullText,
        sources: relevantDocs,
      };
    } catch (error: any) {
      console.error('Stream error:', error);
      throw new Error(`Stream failed: ${error.message}`);
    }
  }

  // Helper: Build context from retrieved docs
  private buildContext(docs: any[]): string {
    if (docs.length === 0) {
      return 'Không tìm thấy thông tin liên quan trong cơ sở dữ liệu.';
    }

    const contextParts = docs.map((doc, index) => {
      const score = doc.score ? `(Độ liên quan: ${(doc.score * 100).toFixed(1)}%)` : '';
      return `[Nguồn ${index + 1}] ${score}\n${doc.content}`;
    });

    return `Thông tin liên quan từ cơ sở dữ liệu:\n\n${contextParts.join('\n\n---\n\n')}`;
  }

  // Helper: Construct final prompt
  private constructPrompt(userMessage: string, context: string): string {
    return `${context}

---

Dựa trên thông tin trên, hãy trả lời câu hỏi sau một cách chính xác và hữu ích:

${userMessage}`;
  }

  // Generate follow-up questions
  async generateFollowUpQuestions(conversation: ChatMessage[]): Promise<string[]> {
    try {
      const lastMessages = conversation.slice(-4);
      const conversationText = lastMessages
        .map(msg => `${msg.role}: ${msg.parts}`)
        .join('\n');

      const prompt = `Dựa trên đoạn hội thoại sau, hãy tạo 3 câu hỏi follow-up phù hợp mà người dùng có thể quan tâm:

${conversationText}

Trả về danh sách 3 câu hỏi, mỗi câu trên một dòng, không đánh số.`;

      const result = await this.model.generateContent(prompt);
      const questions = result.response.text().split('\n').filter((q: string) => q.trim());
      
      return questions.slice(0, 3);
    } catch (error) {
      console.error('Generate questions error:', error);
      return [];
    }
  }
}

export const ragChatbot = new RAGChatbot();
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  content: string;
  sources?: Array<{
    id: string;
    score?: number;
    metadata?: any;
    snippet?: string;
  }>;
  followUpQuestions?: string[];
}

interface ChatInterfaceProps {
  conversationId?: string | null;
}

export default function ChatInterface({ conversationId: initialConvId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(initialConvId || null);
  const [streaming, setStreaming] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Regular chat (non-streaming)
  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setFollowUpQuestions([]);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: 'model',
        content: data.message,
        sources: data.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setFollowUpQuestions(data.followUpQuestions || []);
      
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'model',
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Streaming chat
  const handleStreamSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || streaming) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setStreaming(true);
    setFollowUpQuestions([]);

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'model', content: '' }]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chatbot/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Stream failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            try {
              const data = JSON.parse(jsonStr);
              
              if (data.chunk) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg.role === 'model') {
                    lastMsg.content += data.chunk;
                  }
                  return newMessages;
                });
              }

              if (data.done && data.conversationId && !conversationId) {
                setConversationId(data.conversationId);
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Stream error:', error);
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === 'model' && !lastMsg.content) {
            lastMsg.content = 'Xin lỗi, đã có lỗi xảy ra.';
          }
          return newMessages;
        });
      }
    } finally {
      setStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStreamSend(); // Use streaming by default
    }
  };

  const handleFeedback = async (messageIndex: number, isPositive: boolean) => {
    // TODO: Implement feedback API
    console.log('Feedback:', messageIndex, isPositive);
  };

  return (
    <div className="flex flex-col h-[700px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-white flex items-center gap-2">
              Study Space AI Assistant
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                Powered by Gemini
              </span>
            </h2>
            <p className="text-sm text-white/90">
              Hỏi tôi về mentors, khóa học, hoặc bất cứ điều gì!
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Chào mừng đến với Study Space AI!</h3>
            <p className="text-sm">Tôi có thể giúp bạn:</p>
            <div className="mt-4 space-y-2 max-w-md mx-auto text-left">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                <p className="text-sm">🎓 Tìm mentor phù hợp với chuyên ngành</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                <p className="text-sm">💬 Trả lời câu hỏi về nền tảng</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                <p className="text-sm">📚 Hỗ trợ học tập và nghiên cứu</p>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-lg p-4 shadow-md ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              
              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                  <p className="text-xs font-semibold opacity-75 mb-2">📚 Nguồn tham khảo:</p>
                  <div className="space-y-2">
                    {msg.sources.slice(0, 3).map((source, i) => (
                      <div key={i} className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">
                            {source.metadata?.type === 'mentor' && '👨‍🏫 Mentor'}
                            {source.metadata?.type === 'post' && '📝 Bài đăng'}
                            {source.metadata?.type === 'general' && '💡 FAQ'}
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {source.score ? `${(source.score * 100).toFixed(0)}%` : ''}
                          </span>
                        </div>
                        {source.snippet && (
                          <p className="opacity-75 line-clamp-2">{source.snippet}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback buttons for assistant messages */}
              {msg.role === 'model' && msg.content && idx === messages.length - 1 && !streaming && (
                <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600 flex gap-2">
                  <button
                    onClick={() => handleFeedback(idx, true)}
                    className="text-xs flex items-center gap-1 text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    Hữu ích
                  </button>
                  <button
                    onClick={() => handleFeedback(idx, false)}
                    className="text-xs flex items-center gap-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <ThumbsDown className="w-3 h-3" />
                    Chưa tốt
                  </button>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {streaming && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Follow-up questions */}
        {followUpQuestions.length > 0 && !streaming && !loading && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              💭 Câu hỏi gợi ý:
            </p>
            {followUpQuestions.map((question, i) => (
              <button
                key={i}
                onClick={() => handleStreamSend(question)}
                className="w-full text-left text-sm bg-white dark:bg-gray-800 p-3 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500"
              >
                {question}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
            disabled={loading || streaming}
            rows={1}
            className="flex-1 px-4 py-3 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 resize-none max-h-32"
            style={{ minHeight: '50px' }}
          />
          <button
            onClick={() => handleStreamSend()}
            disabled={loading || streaming || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          AI có thể mắc lỗi. Vui lòng kiểm tra thông tin quan trọng.
        </p>
      </div>
    </div>
  );
}
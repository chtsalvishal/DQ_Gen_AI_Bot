import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Issue } from '../types';
import { BotIcon, ChatIcon, SendIcon, XIcon } from './icons';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface ChatViewProps {
  issues: Issue[];
  isOpen: boolean;
  onClose: () => void;
}

const getShortTableName = (fullName: string): string => {
  if (!fullName) return 'Unnamed Table';
  const cleanedName = fullName.replace(/[`"\[\]]/g, '');
  const parts = cleanedName.split('.');
  return parts[parts.length - 1];
};

const generateDynamicSuggestions = (
    issues: Issue[],
    history: ChatMessage[],
    alreadyShown: Set<string>
): string[] => {
    const potentialSuggestions = new Set<string>();
    const lastUserMessage = [...history].reverse().find(m => m.role === 'user')?.text.toLowerCase();
    const lastModelResponse = [...history].reverse().find(m => m.role === 'model')?.text.toLowerCase();

    potentialSuggestions.add("What's the most critical issue I should focus on?");
    if (issues.some(i => i.severity === 'High')) {
        potentialSuggestions.add("Summarize all high-severity issues.");
    }
    if (issues.some(i => i.type === 'Business Rule Violation')) {
        potentialSuggestions.add("List all business rule violations.");
    }

    const allTableNames = [...new Set(issues.map(i => i.table_name))];
    if (allTableNames.length > 0) {
        const issuesByTable = allTableNames.reduce((acc, name) => {
            acc[getShortTableName(name)] = issues.filter(i => i.table_name === name).length;
            return acc;
        }, {} as Record<string, number>);

        const mostAffectedTable = Object.entries(issuesByTable).sort((a, b) => b[1] - a[1])[0];
        if (mostAffectedTable) {
            potentialSuggestions.add(`Summarize the issues in the ${mostAffectedTable[0]} table.`);
        }
    }
    
    if (lastUserMessage || lastModelResponse) {
        const mentionedTables = allTableNames.filter(tableName => {
            const shortName = getShortTableName(tableName).toLowerCase();
            return (lastUserMessage && lastUserMessage.includes(shortName)) || (lastModelResponse && lastModelResponse.includes(shortName));
        });

        if (mentionedTables.length > 0) {
            const table = mentionedTables[0];
            potentialSuggestions.add(`What are the recommendations for the "${getShortTableName(table)}" table?`);
            if (issues.some(i => i.table_name === table && i.severity === 'High')) {
                potentialSuggestions.add(`Tell me more about the high-severity issues in "${getShortTableName(table)}".`);
            }
        }
        
        const allIssueTypes = [...new Set(issues.map(i => i.type))];
        const mentionedTypes = allIssueTypes.filter(type => {
            const lowerType = type.toLowerCase();
            return (lastUserMessage && lastUserMessage.includes(lowerType)) || (lastModelResponse && lastModelResponse.includes(lowerType));
        });
        if(mentionedTypes.length > 0) {
            const type = mentionedTypes[0];
            potentialSuggestions.add(`Which tables have "${type}" issues?`);
        }
    }
    
    potentialSuggestions.add("Which issue type is most common?");
    if (allTableNames.length > 1) {
        potentialSuggestions.add("Can you compare the health of two tables?");
    }

    const finalSuggestions = Array.from(potentialSuggestions)
      .filter(s => !alreadyShown.has(s) && s.toLowerCase() !== lastUserMessage);

    return finalSuggestions.slice(0, 4);
};

const stripMarkdown = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/^(### |## |# )/gm, '')      // Headers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
    .replace(/(\*|_)(.*?)\1/g, '$2')   // Italic
    .replace(/^(\* |- |\d+\.) /gm, '')    // List items
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/\n{2,}/g, '\n') // Replace multiple newlines with one
    .trim();
};

const ChatView: React.FC<ChatViewProps> = ({ issues, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shownSuggestionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && issues && issues.length > 0 && !chatRef.current) {
      if (!process.env.API_KEY) {
        console.error("API_KEY environment variable is not set.");
        return;
      }
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = `You are a data quality assistant. Your answers must be based SOLELY on the provided data quality report. Be extremely concise and to the point. Do not use any markdown formatting (like lists, bolding, or headers). If you cannot answer a question from the provided data, say "I cannot answer that based on the provided data quality report.". Here is the full data quality report in JSON format:\n\n${JSON.stringify(issues, null, 2)}`;
        
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: systemInstruction,
          },
        });
        
        const initialMessages: ChatMessage[] = [
          { role: 'model', text: "Hello! How can I help you with this data quality report? Ask me anything, or try one of the suggestions to get started." }
        ];
        setMessages(initialMessages);

        shownSuggestionsRef.current.clear();
        const initialSuggestions = generateDynamicSuggestions(issues, initialMessages, shownSuggestionsRef.current);
        initialSuggestions.forEach(s => shownSuggestionsRef.current.add(s));
        setSuggestions(initialSuggestions);

      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setMessages([{ role: 'model', text: "Sorry, I couldn't initialize the chat session." }]);
      }
    } else if (!isOpen) {
        // Reset chat when closed to ensure a fresh start
        chatRef.current = null;
        setMessages([]);
        setSuggestions([]);
    }
  }, [issues, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, suggestions]);

  const sendMessage = async (messageText: string) => {
    if (isLoading || !chatRef.current) return;

    const userMessage: ChatMessage = { role: 'user', text: messageText };
    setMessages(prev => [...prev, userMessage]);
    setSuggestions([]);
    setIsLoading(true);

    try {
      const result = await chatRef.current.sendMessage({ message: messageText });
      const cleanedText = stripMarkdown(result.text);
      const modelMessage: ChatMessage = { role: 'model', text: cleanedText };

      setMessages(prevMessages => {
          const newHistory = [...prevMessages, modelMessage];
          const newSuggestions = generateDynamicSuggestions(issues, newHistory, shownSuggestionsRef.current);
          newSuggestions.forEach(s => shownSuggestionsRef.current.add(s));
          setSuggestions(newSuggestions);
          return newHistory;
      });

    } catch (error) {
      console.error("Error sending chat message:", error);
      const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  if (!issues || issues.length === 0) {
    return null;
  }
  
  return (
    <>
      <div className={`fixed bottom-0 right-0 sm:right-8 w-full sm:w-[440px] h-[70vh] max-h-[600px] flex flex-col bg-white dark:bg-slate-900 shadow-2xl rounded-t-lg sm:rounded-lg transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`} role="dialog" aria-modal="true" aria-labelledby="chat-heading" aria-hidden={!isOpen}>
        <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 rounded-t-lg backdrop-blur-sm flex-shrink-0">
          <h2 id="chat-heading" className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
            <ChatIcon className="w-6 h-6 mr-2 text-brand-primary dark:text-brand-secondary" />
            Ask about Results
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            aria-label="Close chat"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((msg, index) => (
                <div key={index} className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <BotIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                  )}
                  <div className={`max-w-[85%] p-3 text-sm rounded-2xl ${msg.role === 'user' ? 'bg-brand-secondary text-white rounded-br-lg' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-lg'}`}>
                    <p style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{msg.text}</p>
                  </div>
                </div>
            ))}
            
            {isLoading && (
              <div className="flex items-end gap-2.5 justify-start">
                 <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <BotIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="max-w-[80%] p-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-lg">
                  <div className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && suggestions.length > 0 && (
                <div className="pt-2 pl-12">
                    <div className="flex flex-wrap justify-start gap-2">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="px-3 py-1.5 text-xs text-brand-primary dark:text-brand-secondary bg-sky-100/60 dark:bg-sky-900/40 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-1 dark:focus:ring-offset-slate-900"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleFormSubmit} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up..."
              className="flex-1 block w-full px-4 py-2 text-slate-900 bg-white border border-slate-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-brand-primary text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 dark:bg-brand-secondary dark:hover:bg-sky-600 dark:focus:ring-offset-slate-900 disabled:bg-slate-400 disabled:cursor-not-allowed flex-shrink-0"
              aria-label="Send message"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChatView;

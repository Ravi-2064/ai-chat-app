import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '../apiClient';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  summary?: string;
}

interface ChatContextType {
  // Conversations
  conversations: Conversation[];
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation | null) => void;
  createNewConversation: () => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  
  // Messages
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  isSending: boolean;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: any[];
  isSearching: boolean;
  
  // Loading states
  isLoading: boolean;
  error: Error | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch conversations
  const { 
    data: conversations = [], 
    isLoading, 
    error 
  } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations/');
      return data;
    },
  });

  // Search messages
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['search', searchQuery, currentConversation?.id],
    queryFn: async () => {
      if (!searchQuery.trim() || !currentConversation?.id) return [];
      const { data } = await api.post('/chat/', {
        search_query: searchQuery,
        conversation_id: currentConversation.id,
      });
      return data.search_results || [];
    },
    enabled: !!searchQuery.trim() && !!currentConversation?.id,
  });

  // Create a new conversation
  const createNewConversation = useCallback(async (): Promise<Conversation> => {
    const { data } = await api.post('/chat/conversations/', {
      title: 'New Conversation',
    });
    
    // Invalidate and refetch conversations list
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    return data;
  }, [queryClient]);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    await api.delete(`/chat/conversations/${id}/`);
    
    // If the deleted conversation is the current one, clear it
    if (currentConversation?.id === id) {
      setCurrentConversation(null);
    }
    
    // Invalidate and refetch conversations list
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }, [currentConversation, queryClient]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !currentConversation?.id) return;
    
    setIsSending(true);
    try {
      const { data } = await api.post('/chat/', {
        content: content.trim(),
        conversation_id: currentConversation.id,
      });
      
      // Update the current conversation with the new message
      if (data.response) {
        setCurrentConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [
              ...prev.messages,
              { 
                id: Date.now().toString(), 
                content: content.trim(), 
                role: 'user',
                timestamp: new Date().toISOString() 
              },
              { 
                id: (Date.now() + 1).toString(), 
                content: data.response, 
                role: 'assistant',
                timestamp: new Date().toISOString() 
              },
            ],
          };
        });
      }
      
      // Refresh conversations list to update the last message preview
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [currentConversation, queryClient]);

  // Load a conversation when currentConversation changes
  useEffect(() => {
    const loadConversation = async (id: string) => {
      try {
        const { data } = await api.get(`/conversations/${id}/`);
        setCurrentConversation(data);
      } catch (error) {
        console.error('Error loading conversation:', error);
        toast.error('Failed to load conversation');
      }
    };

    if (currentConversation?.id) {
      loadConversation(currentConversation.id);
    }
  }, [currentConversation?.id]);

  const value = {
    // Conversations
    conversations,
    currentConversation,
    setCurrentConversation,
    createNewConversation,
    deleteConversation,
    
    // Messages
    messages: currentConversation?.messages || [],
    sendMessage,
    isSending,
    
    // Search
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    
    // Loading states
    isLoading,
    error: error as Error,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;

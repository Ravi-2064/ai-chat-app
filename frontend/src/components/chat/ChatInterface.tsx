import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  SparklesIcon, 
  UserIcon, 
  SunIcon,
  MoonIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ConversationList from './ConversationList';
import Button from '../common/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export const ChatInterface: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    messages, 
    currentConversation, 
    conversations,
    createNewConversation, 
    deleteConversation,
    searchQuery, 
    setSearchQuery,
    searchResults,
    isSearching,
    isLoading,
    isSending,
    sendMessage,
    setCurrentConversation
  } = useChat();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isScrolledToBottom = scrollHeight - scrollTop <= clientHeight + 100;
      
      if (isScrolledToBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  const handleNewChat = async () => {
    try {
      await createNewConversation();
      setSearchQuery('');
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      toast.error('Failed to create a new conversation');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSelectConversation = (conversation: any) => {
    setCurrentConversation(conversation);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed left-4 top-4 z-20 rounded-md bg-white p-2 text-gray-700 shadow-md dark:bg-gray-800 dark:text-gray-200 md:hidden"
      >
        {isSidebarOpen ? (
          <span className="text-lg">✕</span>
        ) : (
          <span className="text-lg">☰</span>
        )}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 z-10 flex w-72 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:relative md:z-0"
          >
            {/* Sidebar header */}
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Icon 
                  icon={SparklesIcon} 
                  size="lg" 
                  className="text-indigo-500"
                  withBackground
                />
                <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">AI Chat</h1>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              >
                <Icon icon={XMarkIcon} size="md" />
              </button>
            </div>

            {/* New chat button */}
            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
              <Button
                onClick={handleNewChat}
                className="w-full justify-center"
                variant="primary"
                icon={<PlusIcon className="h-5 w-5" />}
              >
                New Chat
              </Button>
            </div>

            {/* Search */}
            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-lg border-0 bg-gray-100 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="Search conversations"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              <ConversationList 
                conversations={conversations}
                currentConversationId={currentConversation?.id}
                onSelectConversation={handleSelectConversation}
                onDeleteConversation={deleteConversation}
                isLoading={isLoading}
              />
            </div>

            {/* User profile */}
            <div className="border-t border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Icon 
                    icon={UserIcon} 
                    size="lg" 
                    className="mr-3 text-indigo-600 dark:text-indigo-400"
                    withBackground
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {user?.username || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  title="Logout"
                >
                  <Icon 
                    icon={ArrowLeftOnRectangleIcon} 
                    size="md" 
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <Icon icon={Bars3Icon} size="lg" />
          </button>
          <div className="flex items-center space-x-2">
            <Icon 
              icon={SparklesIcon} 
              size="md" 
              className="text-indigo-500"
              withBackground
            />
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">AI Chat</h1>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <Icon icon={SunIcon} size="md" />
            ) : (
              <Icon icon={MoonIcon} size="md" />
            )}
          </button>
        </div>

        {/* Chat header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 md:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              <span>☰</span>
            </button>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              {currentConversation?.title || 'New Chat'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {isSearching && (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <SparklesIcon className="mr-1 h-4 w-4 animate-pulse" />
                <span>Searching...</span>
              </div>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4"
        >
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-indigo-100 p-4 dark:bg-indigo-900/30">
                <SparklesIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Start a new conversation
              </h3>
              <p className="max-w-md text-gray-500 dark:text-gray-400">
                Ask me anything or share your thoughts. I'm here to help with any questions you have.
              </p>
              <Button
                onClick={handleNewChat}
                className="mt-6"
                variant="primary"
                icon={<PlusIcon className="h-5 w-5" />}
              >
                New Chat
              </Button>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  className={message.role === 'user' ? 'ml-auto' : 'mr-auto'}
                />
              ))}
              {isSending && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <SparklesIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                      <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse delay-75"></div>
                      <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat input */}
        <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto max-w-3xl">
            <ChatInput 
              onSendMessage={sendMessage} 
              isSending={isSending}
              placeholder="Type your message here..."
            />
            <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

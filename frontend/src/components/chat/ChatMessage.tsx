import React, { useState, useRef, useEffect } from 'react';
import Icon from '../common/Icon';
import { 
  UserIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import 'highlight.js/styles/github-dark.css';

// Type assertion for rehypeHighlight to work with ReactMarkdown
const rehypePlugins: any[] = [rehypeHighlight];
const remarkPlugins: any[] = [remarkGfm];

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
}

interface ChatMessageProps {
  message: Message;
  className?: string;
  onEdit?: (id: string, newContent: string) => void;
  onDelete?: (id: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  className = '',
  onEdit,
  onDelete
}) => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // Auto-resize textarea when editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`;
    }
  }, [isEditing, editedContent]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onEdit) {
      onEdit(message.id, editedContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
  };

  const formatMessageContent = (content: string) => {
    return content.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
      return `\`\`\`${lang || ''}\n${code}\n\`\`\``;
    });
  };

  const timestamp = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  if (isEditing) {
    return (
      <form 
        onSubmit={handleSaveEdit} 
        className={`group relative my-2 flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}
      >
        <div className={`max-w-3xl rounded-lg px-4 py-2 ${isUser ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isUser ? (user?.username || 'You') : 'AI Assistant'}
            </span>
            <span className="text-xs text-gray-400">{timestamp}</span>
          </div>
          <div className="flex items-start">
            <textarea
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full resize-none bg-transparent text-gray-900 outline-none dark:text-white"
              rows={1}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit(e);
                } else if (e.key === 'Escape') {
                  handleCancelEdit();
                }
              }}
            />
          </div>
          <div className="mt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    );
  }

  if (isSystem) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-2">
        <div className="rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/30">
          <div className="flex">
            <div className="flex-shrink-0">
              <Icon icon={ExclamationTriangleIcon} size="sm" className="text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {message.content}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: message.status === 'sending' ? 0.8 : 1,
        y: 0 
      }}
      transition={{ duration: 0.2 }}
      className={`group relative my-2 flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex max-w-3xl ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          {isUser ? (
            <Icon icon={UserIcon} size="sm" className="text-blue-500" />
          ) : (
            <Icon icon={SparklesIcon} size="sm" className="text-purple-500" />
          )}
        </div>

        {/* Message content */}
        <div 
          className={`relative rounded-lg px-4 py-2 ${isUser 
            ? 'rounded-tr-none bg-indigo-100 dark:bg-indigo-900/50' 
            : 'rounded-tl-none border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}`}
        >
          {/* Message header */}
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isUser ? (user?.username || 'You') : 'AI Assistant'}
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">{timestamp}</span>
              <button 
                aria-label="actions"
                onClick={() => setShowActions(!showActions)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <Icon 
  icon={EllipsisVerticalIcon} 
  size="sm" 
  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
  withBackground
  rounded
/>
              </button>
            </div>
          </div>

          {/* Message body */}
          <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:rounded-md prose-pre:bg-gray-900 prose-pre:p-3 prose-code:before:hidden prose-code:after:hidden">
            <ReactMarkdown
              rehypePlugins={rehypePlugins}
              remarkPlugins={remarkPlugins}
              components={{
                code({ node, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !className || !match;
                  
                  if (isInline) {
                    return (
                      <code className="rounded bg-gray-100 px-1 py-0.5 text-sm font-mono text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {children}
                      </code>
                    );
                  }
                  
                  return (
                    <div className="relative">
                      <div className="absolute right-2 top-2">
                        <button
                          type="button"
                          onClick={() => {
                            const code = String(children).replace(/\n$/, '');
                            navigator.clipboard.writeText(code);
                            // TODO: Show copied toast
                          }}
                          className="rounded bg-gray-800/80 px-2 py-1 text-xs text-white hover:bg-gray-700/80"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className={className}>
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  );
                },
              }}
            >
              {formatMessageContent(message.content)}
            </ReactMarkdown>
          </div>

          {/* Message actions */}
          <AnimatePresence>
            {(isHovered || showActions) && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className={`absolute -top-3 flex space-x-1 rounded-full bg-white px-1.5 py-0.5 shadow-md ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700 ${
                  isUser ? '-right-2' : '-left-2'
                }`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setShowActions(false)}
              >
                {isUser && onEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditedContent(message.content);
                        setIsEditing(true);
                        setShowActions(false);
                      }}
                      className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-indigo-400"
                      title="Edit message"
                    >
                      <Icon 
  icon={PencilIcon} 
  size="xs" 
  className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
/>
                    </button>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          handleDelete();
                          setShowActions(false);
                        }}
                        className="rounded-full p-1 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-500"
                        title="Delete message"
                      >
                        <Icon 
  icon={TrashIcon} 
  size="xs" 
  className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500"
/>
                      </button>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(message.content);
                    // TODO: Show copied toast
                    setShowActions(false);
                  }}
                  className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-indigo-400"
                  title="Copy to clipboard"
                >
                  <Icon 
  icon={DocumentDuplicateIcon} 
  size="xs" 
  className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
/>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;

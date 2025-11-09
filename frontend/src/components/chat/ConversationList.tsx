import React, { useState } from 'react';
import { TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { Conversation } from '../../types';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (id: string) => Promise<void>;
  isLoading: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  isLoading,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleStartEdit = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleSaveEdit = async (e: React.FormEvent, id: string) => {
    e.stopPropagation();
    // TODO: Implement update conversation title API call
    setEditingId(null);
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await onDeleteConversation(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-gray-500">
        <p>No conversations yet</p>
        <p className="mt-1 text-sm">Start by creating a new chat</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 overflow-y-auto dark:divide-gray-700">
      <AnimatePresence>
        {conversations.map((conversation) => (
          <motion.li
            key={conversation.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className={`group relative flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              currentConversationId === conversation.id
                ? 'bg-indigo-50 dark:bg-gray-700'
                : ''
            }`}
            onClick={() => onSelectConversation(conversation)}
          >
            {editingId === conversation.id ? (
              <form
                onSubmit={(e) => handleSaveEdit(e, conversation.id)}
                className="flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-md border-0 bg-white py-1.5 pl-2 pr-8 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-gray-800 dark:text-white dark:ring-gray-600"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="submit"
                    className="absolute right-12 rounded p-1 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-gray-600"
                    title="Save"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="absolute right-4 rounded p-1 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600"
                    onClick={() => setEditingId(null)}
                    title="Cancel"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {conversation.title || 'New Chat'}
                  </p>
                  {conversation.updatedAt && (
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {new Date(conversation.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(conversation);
                    }}
                    title="Rename"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-500"
                    onClick={(e) => handleDeleteClick(e, conversation.id)}
                    disabled={deletingId === conversation.id}
                    title="Delete"
                  >
                    {deletingId === conversation.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
};

export default ConversationList;

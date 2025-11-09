import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isSending,
  placeholder = 'Type your message...',
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;
    
    const msg = message.trim();
    setMessage('');
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    await onSendMessage(msg);
  };

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 px-4 pt-4 pb-2">
      <div className="flex items-end rounded-lg border border-gray-300 bg-white shadow-sm">
        <div className="flex-1 overflow-hidden rounded-lg">
          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={placeholder}
            className="block w-full resize-none border-0 py-3 pl-4 pr-12 focus:ring-0 sm:text-sm"
            disabled={isSending}
          />
        </div>
        <div className="flex-shrink-0 p-2">
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className={`inline-flex items-center rounded-full p-2 ${
              message.trim() && !isSending
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
          >
            {isSending ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <PaperAirplaneIcon className="h-5 w-5" aria-hidden="true" />
            )}
            <span className="sr-only">Send message</span>
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-gray-500">
        Press Enter to send, Shift+Enter for a new line
      </p>
    </form>
  );
};

export default ChatInput;

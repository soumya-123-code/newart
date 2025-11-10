'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import styles from './ChatUI.module.scss';
import { usePathname } from 'next/navigation';

export interface Message {
  commentId: string;          // stable unique id for the comment
  id?: string;                // optional backend id (fallback)
  reviewer?: { fullName?: string };
  comment: string;
  createDate: string;
}

interface ChatUIProps {
  messages?: Message[];
  onAddMessage: (text: string) => void;
  onDeleteMessage: (messageId: string) => void;
  placeholder?: string;
  currentUserName?: string;
  emptyStateMessage?: string;
  renderMessageActions?: (message: Message) => ReactNode;
  isLoading?: boolean;
  className?:any;
  inputDisabled?: boolean;
}

const ChatUI: React.FC<ChatUIProps> = ({
  messages = [],
  onAddMessage,
  onDeleteMessage,
  placeholder = 'Add your comment',
  emptyStateMessage = 'No messages yet',
  renderMessageActions,
  inputDisabled,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);
  const messagesListRef = useRef<HTMLDivElement>(null);
  const deleteButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const pathname = usePathname();

  // Normalize and set display messages
  useEffect(() => {
    const normalized = (messages ?? []).map((m) => ({
      ...m,
      // prefer commentId; if absent, fallback to id
      commentId: m.commentId ?? m.id ?? '',
    })) as Message[];
    setDisplayMessages(normalized);
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesListRef.current) {
      messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
    }
  }, [displayMessages]);

  const handleAddMessage = () => {
    if (!newMessage.trim()) return;
    onAddMessage(newMessage.trim());
    setNewMessage('');
  };

  const handleDeleteMessage = (messageId: string) => {
    onDeleteMessage(messageId);
    setShowDeleteConfirm(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newMessage.trim()) {
      handleAddMessage();
    }
  };

  const canAdd = Boolean(pathname && pathname.includes('reviewer'));

  return (
    <div className={styles.chatContainer} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 170px)' }}>
      <div
        className={styles.messagesList}
        ref={messagesListRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {displayMessages.length === 0 ? (
          <div className={styles.emptyState}>{emptyStateMessage}</div>
        ) : (
          displayMessages.map((message) => {
            const id = message.commentId ;
            return (
              <div key={id} className={styles.message} style={{ padding: '12px', borderRadius: '8px' }}>
                <div className={styles.messageHeader}>
                  <span className={styles.userName}>{message.reviewer?.fullName || ''}</span>
                  <div className={styles.messageMeta}>
                    <span className={styles.timestamp}>{message.createDate}</span>
                    {renderMessageActions ? (
                      renderMessageActions(message)
                    ) : (
                      <button
                        ref={(el) => {
                          if (el) deleteButtonRefs.current[id] = el;
                        }}
                        className={styles.deleteMessageButton}
                        onClick={() => setShowDeleteConfirm(id)}
                        aria-label="Delete message"
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.5 5H4.16667H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M15.8333 5V16.6667C15.8333 17.1087 15.6577 17.5326 15.3452 17.8452C15.0326 18.1577 14.6087 18.3333 14.1667 18.3333H5.83333C5.39131 18.3333 4.96738 18.1577 4.65482 17.8452C4.34226 17.5326 4.16667 17.1087 4.16667 16.6667V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M6.66663 5V3.33333C6.66663 2.89131 6.84222 2.46738 7.15478 2.15482C7.46734 1.84226 7.89127 1.66667 8.33329 1.66667H11.6666C12.1087 1.66667 12.5326 1.84226 12.8451 2.15482C13.1577 2.46738 13.3333 2.89131 13.3333 3.33333V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.messageText}>{message.comment}</div>

                {showDeleteConfirm === id && (
                  <>
                    <div
                      className={styles.deleteConfirmOverlay}
                      onClick={() => setShowDeleteConfirm(null)}
                    />
                    <div
                      key={id} 
                      className={styles.deleteConfirm}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className={styles.deleteWarning}>
                        Are you sure you want to delete this comment? Once you delete the comment, the action cannot be undone.
                      </p>
                      <div className={styles.deleteActions}>
                        <button
                          className={styles.deleteConfirmButton}
                          onClick={() => handleDeleteMessage(id)}
                        >
                          Delete
                        </button>
                        <button
                          className={styles.deleteConfirmCancel}
                          onClick={() => setShowDeleteConfirm(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {canAdd && (
        <div className={styles.addMessageSection}>
          <div className={styles.inputWrapper} style={{ display: 'flex', gap: '8px', padding: '16px' }}>
            <input
              type="text"
              className={styles.messageInput}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={inputDisabled}
            />
            {newMessage.trim() && (
              <button className={styles.addButton} onClick={handleAddMessage}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 3.33333V12.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3.33337 8H12.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Add
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatUI;

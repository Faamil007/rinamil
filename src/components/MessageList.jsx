import React, { useEffect, useRef } from 'react';
import Message from './Message';

const MessageList = ({ messages, currentUser, otherUser }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map(message => (
        <Message 
          key={message.id} 
          message={message} 
          isOwn={message.sender_id === currentUser.id} 
          currentUser={currentUser}
          otherUser={otherUser}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
import React from 'react';

const Message = ({ message, isOwn }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`message ${isOwn ? 'own-message' : 'other-message'}`}>
      <div className="message-content">
        <p>{message.text}</p>
        <span className="message-time">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
};

export default Message;
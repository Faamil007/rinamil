import React, { useState, useCallback } from 'react';
import { debounce } from 'lodash';

const Composer = ({ onSendMessage, onTyping }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const debouncedTyping = useCallback(
    debounce((typing) => {
      onTyping(typing);
      setIsTyping(typing);
    }, 500),
    [onTyping]
  );

  const handleChange = (e) => {
    const text = e.target.value;
    setMessage(text);
    
    if (text.length > 0 && !isTyping) {
      debouncedTyping(true);
    } else if (text.length === 0 && isTyping) {
      debouncedTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      debouncedTyping(false);
      setIsTyping(false);
    }
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <input
        type="text"
        value={message}
        onChange={handleChange}
        placeholder="Type a message..."
        maxLength={2000}
      />
      <button type="submit" disabled={!message.trim()}>
        Send
      </button>
    </form>
  );
};

export default Composer;
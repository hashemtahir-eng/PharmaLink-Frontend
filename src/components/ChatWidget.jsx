import React, { useEffect, useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import { Icon } from './UI';
import { chatbotReply } from '../mockData/logic';
export default function ChatWidget() {
  const { data } = useData();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const messageList = useRef(null);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hi, I’m your PharmaLink assistant. How can I help with your procurement today?',
    },
  ]);
  useEffect(() => {
    if (messageList.current) messageList.current.scrollTop = messageList.current.scrollHeight;
  }, [messages, open]);
  function send(e, text = message) {
    e?.preventDefault();
    if (!text.trim()) return;
    setMessages([
      ...messages,
      { sender: 'you', text },
      {
        sender: 'bot',
        text: chatbotReply(text, data.rules),
      },
    ]);
    setMessage('');
  }
  return (
    <div className="chat-container">
      {open && (
        <section className="chat-panel">
          <header>
            <div>
              <strong>PharmaLink assistant</strong>
              <small>Rule-based support · Always here</small>
            </div>
            <button
              className="icon-button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              <Icon name="close" />
            </button>
          </header>
          <div className="messages" aria-live="polite" ref={messageList}>
            {messages.map((m, i) => (
              <div key={i} className={'message ' + m.sender}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="chat-suggestions">
            {['How are bids scored?', 'Escrow payments'].map((t) => (
              <button key={t} onClick={() => send(null, t)}>
                {t}
              </button>
            ))}
          </div>
          <form onSubmit={send}>
            <input
              aria-label="Message assistant"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question…"
              maxLength={500}
            />
            <button className="icon-button" aria-label="Send message">
              <Icon name="arrow" />
            </button>
          </form>
        </section>
      )}
      <button
        className="chat-launch"
        onClick={() => setOpen(!open)}
        aria-label="Toggle support assistant"
      >
        <Icon name={open ? 'close' : 'chat'} size={23} />
        {!open && <span>Ask PharmaLink</span>}
      </button>
    </div>
  );
}

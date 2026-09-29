import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendMessageToRag } from '../rag_controllers/chatController';

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hello! I am the TimeBankV2 Policy Assistant. How can I help you today?' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    const answer = await sendMessageToRag(userMessage);

    setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    setIsLoading(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="btn-primary shadow-lg"
          style={{ width: '60px', height: '60px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
        >
          <svg style={{ width: '28px', height: '28px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
        </button>
      )}

      {isOpen && (
        <div className="card shadow-lg" style={{ width: '360px', height: '520px', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white', borderRadius: '12px' }}>
          <div style={{ background: 'var(--primary)', color: 'white', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>TimeBank Assistant</h3>
            <button onClick={() => setIsOpen(false)} style={{ color: 'white', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', background: 'var(--gray-50)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                maxWidth: '85%', 
                padding: '0.75rem 1rem', 
                fontSize: '0.9rem',
                lineHeight: '1.5',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'var(--primary-100)' : 'white',
                color: msg.role === 'user' ? 'var(--primary-900)' : 'var(--gray-800)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--gray-200)',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
                borderBottomLeftRadius: msg.role === 'user' ? '12px' : '0',
                borderBottomRightRadius: msg.role === 'user' ? '0' : '12px',
                overflowWrap: 'break-word'
              }}>
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => <p style={{ margin: '0 0 0.5rem 0' }} {...props} />,
                    ul: ({node, ...props}) => <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', listStyleType: 'disc' }} {...props} />,
                    ol: ({node, ...props}) => <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', listStyleType: 'decimal' }} {...props} />,
                    li: ({node, ...props}) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
                    strong: ({node, ...props}) => <strong style={{ fontWeight: 600 }} {...props} />,
                    em: ({node, ...props}) => <em style={{ fontStyle: 'italic' }} {...props} />,
                    h1: ({node, ...props}) => <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0.75rem 0 0.5rem 0' }} {...props} />,
                    h2: ({node, ...props}) => <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0.75rem 0 0.5rem 0' }} {...props} />,
                    h3: ({node, ...props}) => <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0.75rem 0 0.5rem 0' }} {...props} />,
                    a: ({node, ...props}) => <a style={{ color: 'var(--primary)', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" {...props} />
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            ))}
            {isLoading && (
              <div style={{ background: 'white', border: '1px solid var(--gray-200)', padding: '0.75rem 1rem', borderRadius: '12px', borderBottomLeftRadius: '0', fontSize: '0.9rem', color: 'var(--gray-500)', alignSelf: 'flex-start' }}>
                <span style={{ display: 'inline-block', animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} style={{ padding: '1rem', background: 'white', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about our policies..." 
              disabled={isLoading}
              style={{ flex: 1, padding: '0.6rem 0.8rem', border: '1px solid var(--gray-300)', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="btn-primary" style={{ padding: '0.6rem 1.25rem', borderRadius: '6px', fontSize: '0.9rem', cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer', opacity: (isLoading || !input.trim()) ? 0.6 : 1 }}>Send</button>
          </form>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState } from "react";

const ChatDisplay = ({ messages }) => {
  const containerRef = useRef(null);
  const lastMessageRef = useRef(null); // Reference for the last message
  const [keywordsData, setKeywordsData] = useState({});

  useEffect(() => {
    fetch("/keywords.json")
      .then((res) => res.json())
      .then((data) => {
        console.log("Keywords data loaded in ChatDisplay:", data); // Debugging
        setKeywordsData(data);
      })
      .catch((err) => console.error("Failed to load keywords.json:", err));
  }, []);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" }); // Scroll to the last message
    }
  }, [messages]); // Trigger whenever messages change

  const getExtraBlocks = (text) => {
    const blocks = [];
    console.log("Processing message text for keywords:", text);

    Object.entries(keywordsData).forEach(([keyword, data]) => {
      if (data.target !== "chat") return;
      const { text: extraText, image } = data;
     if (text.toLowerCase().includes(keyword)) {
        console.log(`Keyword matched in ChatDisplay: ${keyword}`);
        blocks.push(
          <div key={keyword} className="mt-2 p-2 bg-yellow-100 rounded-md border">
            <p className="text-sm text-gray-700">{extraText}</p>
            {image && (
              <img
                src={`${image.startsWith("/") ? "" : "/"}${image}`}
                alt={keyword}
                className="mt-2 max-h-32 rounded-md shadow"
              />
            )}
          </div>
        );
      }
    });

    return blocks;
  };

  return (
    <div
      ref={containerRef}
      className="chat-container bg-white bg-opacity-20 backdrop-blur-md border border-gray-300 rounded-lg shadow-md overflow-y-auto flex flex-col p-2 h-56 sm:h-auto lg:h-[calc(100vh-260px)]"
      style={{
        scrollbarWidth: "none", // For Firefox
        msOverflowStyle: "none", // For IE and Edge
      }}
    >
      <style>
        {`
          .chat-container::-webkit-scrollbar {
            display: none; /* For Chrome, Safari, and Opera */
          }
        `}
      </style>
      {messages.length === 0 ? (
        <div className="text-white text-center my-8">Je suis Agathe, votre assistante IA, je suis là pour répondre à toutes vos questions sur neemba.com</div>
      ) : (
        messages.map((msg, index) => (
          <div
            key={index}
            ref={index === messages.length - 1 ? lastMessageRef : null} // Attach ref to the last message
            className={`message-container ${
              msg.isUser ? "self-end bg-gray-100 bg-opacity-50" : "self-start bg-gray-100 bg-opacity-20"
            } p-2 rounded-md  max-w-[80%] mb-4 mx-1.5`}
          >
            <p className="text-sm text-black">{msg.text}</p>
            {!msg.isUser && getExtraBlocks(msg.text)} {/* Render extra blocks for bot messages */}
          </div>
        ))
      )}
    </div>
  );
};

export default ChatDisplay;

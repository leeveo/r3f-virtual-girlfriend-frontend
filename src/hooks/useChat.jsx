import { createContext, useContext, useEffect, useState } from "react";

const rawBackendUrl = import.meta.env.VITE_API_URL || (window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : "https://web-production-8340.up.railway.app");

// 🔧 On enlève les `/` à la fin pour éviter `//chat`
const backendUrl = rawBackendUrl.replace(/\/+$/, "");

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);

  const chat = async (message) => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("❌ Backend error:", errText);
        return;
      }

      const resp = await res.json();
      setMessages((prev) => [...prev, ...(resp.messages || [])]);
    } catch (error) {
      console.error("❌ Error fetching chat response:", error);
    } finally {
      setLoading(false);
    }
  };

  const onMessagePlayed = () => {
    setMessages((msgs) => msgs.slice(1));
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[messages.length - 1]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  // 🌐 Vérifie si le backend répond
  useEffect(() => {
    fetch(`${backendUrl}/`)
      .then((res) => {
        if (!res.ok) {
          console.error("🚨 Backend inaccessible à /");
        }
      })
      .catch((err) => {
        console.error("❌ Erreur de connexion backend :", err);
      });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        loading,
        cameraZoomed,
        setCameraZoomed,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

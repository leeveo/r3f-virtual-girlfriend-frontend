import { createContext, useContext, useEffect, useState } from "react";

// ✅ Nettoyage de l'URL de backend
const rawBackendUrl = import.meta.env.VITE_API_URL || (
  window.location.hostname === "localhost"
    ? "http://localhost:8080"
    : "https://0a34-172-189-56-91.ngrok-free.app"
);
const backendUrl = rawBackendUrl.replace(/\/+$/, ""); // 🔧 Supprime les `/` finaux

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);

  // 🎯 Fonction de chat principale
  const chat = async (message) => {
    if (!message) return;

    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("❌ Backend error:", errText);
        return;
      }

      const resp = await res.json();
      const newMessages = resp?.messages || [];

      setMessages((prev) => [...prev, ...newMessages]);
    } catch (err) {
      console.error("❌ Network/chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Marquer un message comme "joué"
  const onMessagePlayed = () => {
    setMessages((msgs) => msgs.slice(1));
  };

  // 🧠 Mise à jour du message actuel
  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[messages.length - 1]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  // ✅ Vérifie si le backend est joignable
  useEffect(() => {
    fetch(`${backendUrl}/`)
      .then((res) => {
        if (!res.ok) {
          console.error("🚨 Backend live mais renvoie erreur / !");
        }
      })
      .catch((err) => {
        console.error("❌ Connexion au backend échouée :", err);
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

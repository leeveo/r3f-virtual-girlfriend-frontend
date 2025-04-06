import React, { useEffect, useState } from "react";

const Carousel = ({ messages }) => {
  const [keywordsData, setKeywordsData] = useState({});
  const [carouselImages, setCarouselImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Charger le JSON de mots-clés au montage
  useEffect(() => {
    fetch("/keywords.json")
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Keywords loaded:", data);
        setKeywordsData(data);
      })
      .catch((err) => console.error("❌ Erreur keywords.json:", err));
  }, []);

  // Analyse du dernier message IA et sélection d'images
  useEffect(() => {
    if (!messages || messages.length === 0 || Object.keys(keywordsData).length === 0) {
      setCarouselImages(["/images/technologies/technologies1.jpg", "/images/technologies/technologies2.jpg", "/images/technologies/technologies3.jpg", "/images/technologies/technologies4.jpg"]);
      return;
    }

    const lastBotMessage = [...messages].reverse().find((msg) => !msg.isUser);
    const lastText = lastBotMessage?.text || "";

    if (!lastText) {
      setCarouselImages(["/images/technologies/technologies1.jpg", "/images/technologies/technologies2.jpg", "/images/technologies/technologies3.jpg", "/images/technologies/technologies4.jpg"]);
      return;
    }

    const matchedKeyword = Object.entries(keywordsData).find(
      ([keyword, data]) =>
        data.target === "carousel" &&
        lastText.toLowerCase().includes(keyword.toLowerCase())
    );

    if (matchedKeyword) {
      const [keyword, keywordData] = matchedKeyword;
      console.log("🟡 Mot-clé détecté dans la réponse IA:", keyword);

      if (keywordData.folder && Array.isArray(keywordData.images)) {
        // ✅ Format multiple images
        const imagePaths = keywordData.images.map((img) => `${keywordData.folder}/${img}`);
        setCarouselImages(imagePaths);
      } else if (keywordData.image) {
        // ✅ Format simple image
        setCarouselImages([keywordData.image]);
      } else {
        setCarouselImages(["/images/technologies/technologies1.jpg", "/images/technologies/technologies2.jpg", "/images/technologies/technologies3.jpg", "/images/technologies/technologies4.jpg"]);
      }

      setCurrentImageIndex(0);
    } else {
      setCarouselImages(["/images/technologies/technologies1.jpg", "/images/technologies/technologies1.jpg", "/images/technologies/technologies3.jpg", "/images/technologies/technologies4.jpg"]);
    }
  }, [messages, keywordsData]);

  const handleDotClick = (index) => {
    setCurrentImageIndex(index);
  };

  // Rendu du carousel
  if (!carouselImages || carouselImages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Aucune image à afficher
      </div>
    );
  }

  return (
    <div className="h-full rounded-lg backdrop-blur-md bg-white bg-opacity-50 overflow-hidden relative">
      <img
        src={carouselImages[currentImageIndex]}
        alt={`Image ${currentImageIndex + 1}`}
        className="w-full h-full object-cover rounded-lg"
      />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {carouselImages.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-3 h-3 rounded-full ${
              currentImageIndex === index ? "bg-blue-500" : "bg-gray-300"
            }`}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default Carousel;

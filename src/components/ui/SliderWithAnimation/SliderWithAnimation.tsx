// Could this slider with animation have oilfields on them and be selectable?

import React, { useEffect, useRef, useState } from "react";
import "./SliderWithAnimation.css";
import { Slider, useRadioCardStyles } from "@chakra-ui/react";

const flavors = [
  {
    name: ["Chai", "Vanilla"],
    color: "#4A90E2",
    image:
      "/home/rolf/Kode/React/ChakraUiPlayground/chakra-ui-playground/assets/2025-06-30-19-04-20.png",
    nutrition: ["20g", "13g", "15", "1.8g", "1B"],
  },
  {
    name: ["Maple", "Peanut"],
    color: "#E94B4B",
    image:
      "https://raw.githubusercontent.com/nidal1111/storage/master/assets/milkShake_caffe%CC%80.png",
    nutrition: ["35g", "10g", "10", "1.5g", "2B"],
  },
  {
    name: ["Cacao", "Coconut"],
    color: "#F4D03F",
    image:
      "https://raw.githubusercontent.com/nidal1111/storage/master/assets/milkShake_fragole.png",
    nutrition: ["40g", "25g", "22", "2.2g", "1B"],
  },
  {
    name: ["Berry", "Blend"],
    color: "#8E44AD",
    image:
      "https://raw.githubusercontent.com/nidal1111/storage/master/assets/milkshake_banana.png",
    nutrition: ["28g", "18g", "25", "2.0g", "3B"],
  },
];

const SliderWithAnimation = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const flavor = flavors[currentIndex];

  useEffect(() => {
    if (timeoutRef.current) clearInterval(timeoutRef.current);
    timeoutRef.current = setInterval(() => {
      if (!isAnimating) {
        setCurrentIndex((prev) => (prev + 1) % flavors.length);
      }
    }, 4000);
    return () => clearInterval(timeoutRef.current!);
  }, [isAnimating]);

  const handleDotClick = (index: number) => {
    if (index !== currentIndex && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsAnimating(false);
      }, 600);
    }
  };

  return (
    <div className="slider-container" style={{ background: flavor.color }}>
      <div className="color-overlay slide-down" />
      <div className="content">
        <div className="product-name">
          <span className="word-part first-word">{flavor.name[0]}</span>
          <span className="word-part second-word">{flavor.name[1]}</span>
        </div>
        <img className="milkshake-image" src={flavor.image} alt="Milkshake" />
        <div className="nutrition-panel">
          {[
            "Plant Protein",
            "of Fiber",
            "Vitamins",
            "Omega-3",
            "CFU Probiotics",
          ].map((label, idx) => (
            <div className="nutrition-item" key={label}>
              <div className="nutrition-value">{flavor.nutrition[idx]}</div>
              <div className="nutrition-label">{label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="controls">
        {flavors.map((_, i) => (
          <div
            key={i}
            className={`control-dot ${i === currentIndex ? "active" : ""}`}
            onClick={() => handleDotClick(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default SliderWithAnimation;

import React, { useState, useRef, useEffect } from "react";
import "./carousel.css";

interface CarouselProps {
  items: (string | number)[];
  initialActive?: number;
}

interface ItemProps {
  id: string | number;
  level: number;
}

const Item: React.FC<ItemProps> = ({ id, level }) => {
  return <div className={`item level${level}`}>{id}</div>;
};

const Carousel: React.FC<CarouselProps> = ({ items, initialActive = 0 }) => {
  const [active, setActive] = useState(initialActive);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const carouselRef = useRef<HTMLDivElement>(null);

  const moveLeft = () => {
    setActive((prev) => (prev - 1 + items.length) % items.length);
    setDirection("left");
  };

  const moveRight = () => {
    setActive((prev) => (prev + 1) % items.length);
    setDirection("right");
  };

  const handleSwipe = () => {
    let startX = 0;
    let endX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      endX = e.changedTouches[0].clientX;
      const diff = startX - endX;

      if (Math.abs(diff) > 50) {
        if (diff > 0) moveRight();
        else moveLeft();
      }
    };

    const node = carouselRef.current;
    if (node) {
      node.addEventListener("touchstart", handleTouchStart);
      node.addEventListener("touchend", handleTouchEnd);
      return () => {
        node.removeEventListener("touchstart", handleTouchStart);
        node.removeEventListener("touchend", handleTouchEnd);
      };
    }
  };

  useEffect(() => {
    return handleSwipe();
  }, [active]);

  const generateItems = () => {
    return [...Array(5)].map((_, i) => {
      const index = (active - 2 + i + items.length) % items.length;
      const level = active - (active - 2 + i);
      return (
        <Item
          key={`${index}-${items[index]}`}
          id={items[index]}
          level={level}
        />
      );
    });
  };

  return (
    <div id="carousel" className="noselect" ref={carouselRef}>
      <div className="arrow arrow-left" onClick={moveLeft}>
        ‹
      </div>
      <div className={`carousel-items ${direction}`}>{generateItems()}</div>
      <div className="arrow arrow-right" onClick={moveRight}>
        ›
      </div>
    </div>
  );
};

export default Carousel;

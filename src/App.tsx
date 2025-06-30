import React from "react";
import Demo from "./components/ui/Demo";
import Carousel from "./components/ui/carousel/carousel";

const items = [1, 2, 3, 4, 5, 6, 7, 8];

const App = () => {
  return (
    <>
      <Demo />
      <Carousel items={items} />
      {/* <h1>Welcome to App</h1> */}
    </>
  );
};

export default App;

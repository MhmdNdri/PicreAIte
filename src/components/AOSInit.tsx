"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css"; // Import AOS styles

export const AOSInit = () => {
  useEffect(() => {
    AOS.init({
      duration: 750, // values from 0 to 3000, with step 50ms
      easing: "ease-in-out", // default easing for AOS animations
      once: true, // whether animation should happen only once - while scrolling down
      mirror: false, // whether elements should animate out while scrolling past them
      anchorPlacement: "top-bottom", // defines which position of the element regarding to window should trigger the animation
    });
  }, []);

  return null; // This component doesn't render anything
};

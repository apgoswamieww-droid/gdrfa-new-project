import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollContext = createContext<{
  scrollToId: string | null;
  setScrollToId: (id: string | null) => void;
}>({
  scrollToId: null,
  setScrollToId: () => {},
});

export const ScrollProvider = ({ children }: { children: React.ReactNode }) => {
  const [scrollToId, setScrollToId] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (scrollToId && location.pathname === "/") {
      // Run AFTER React paints the page
      const timer = setTimeout(() => {
        const section = document.getElementById(scrollToId);
        if (section) {
          const offsetTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          const windowHeight = window.innerHeight;
          const scrollY = offsetTop - windowHeight / 2 + sectionHeight / 2;

          window.scrollTo({
            top: scrollY,
            behavior: "smooth",
          });
        }
        setScrollToId(null); // reset after scroll
      }, 100); // small delay ensures DOM is mounted

      return () => clearTimeout(timer);
    }
  }, [location, scrollToId]);

  return (
    <ScrollContext.Provider value={{ scrollToId, setScrollToId }}>
      {children}
    </ScrollContext.Provider>
  );
};

export const useScroll = () => useContext(ScrollContext);

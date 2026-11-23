"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Lenis smooth scrolling for the landing page.
 * Mount once on the page; it cleans itself up on unmount so app routes keep native scroll.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      // Smoothly scroll in-page anchor links (#features, #how…), clearing the sticky header.
      anchors: { offset: -84 },
    });

    return () => lenis.destroy();
  }, []);

  return null;
}

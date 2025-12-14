import { useState, useEffect, useRef } from "react";

export default function useLazySection() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );

    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return [ref, visible];
}

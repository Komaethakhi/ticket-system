import { useEffect, useState } from "react";

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= breakpoint
  );

  useEffect(() => {
    const getIsMobile = () => window.innerWidth <= breakpoint;
    const handleResize = () => setIsMobile(getIsMobile());

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

export default useIsMobile;

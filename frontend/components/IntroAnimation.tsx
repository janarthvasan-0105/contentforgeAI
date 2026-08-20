"use client";
import { useEffect, useState } from "react";
import TextPressure from "./TextPressure";

interface Props {
  onDone?: () => void;
}

export default function IntroAnimation({ onDone }: Props) {
  const [exit, setExit] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setExit(true), 2500);
    const t2 = setTimeout(() => onDone && onDone(), 3100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className="intro-stage flex flex-col justify-center"
      data-testid="intro-animation"
      style={exit ? { opacity: 0, transition: "opacity 600ms ease" } : { transition: "opacity 600ms ease" }}
    >
      <div style={{ position: 'relative', height: '400px', width: '90%', maxWidth: '1200px', margin: '0 auto' }}>
        <TextPressure
          text="WELCOME BACK"
          flex
          alpha={false}
          stroke={false}
          width
          weight
          italic
          textColor="#d4a24c"
          strokeColor="#000000"
          minFontSize={36}
        />
      </div>
    </div>
  );
}

"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const lightBalls = [
  { x: -40, y: 0,   color: "#2b66ff" },
  { x: 80,  y: 120, color: "#2b66ff" },
  { x: 140, y: -40, color: "#2b66ff" },
  { x: 300, y: 20,  color: "#8b38ff" },
  { x: 400, y: 100, color: "#8b38ff" },
];

const darkBalls = [
  { x: -40, y: 0,   color: "#518dd0" },
  { x: 80,  y: 120, color: "#518dd0" },
  { x: 140, y: -40, color: "#518dd0" },
  { x: 300, y: 20,  color: "#f3a627" },
  { x: 400, y: 100, color: "#f3a627" },
];

const roadColors = {
  light: { outer: "#4e86c2", inner: "#7acff0", dash: "#1a3a5c" },
  dark:  { outer: "#6c3fa0", inner: "#a855f7", dash: "#e2d4f0" },
};

const radius = 35 / 2;

function buildRoadPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      const cornerX = p2.x;
      const cornerY = p1.y;
      const tension = Math.min(Math.abs(dx), Math.abs(dy)) * 0.4;
      d += ` L ${cornerX - Math.sign(dx) * tension} ${p1.y}`;
      d += ` Q ${cornerX} ${cornerY} ${cornerX} ${cornerY + Math.sign(dy) * tension}`;
      d += ` L ${p2.x} ${p2.y}`;
    } else {
      const cornerX = p1.x;
      const cornerY = p2.y;
      const tension = Math.min(Math.abs(dx), Math.abs(dy)) * 0.4;
      d += ` L ${p1.x} ${cornerY - Math.sign(dy) * tension}`;
      d += ` Q ${cornerX} ${cornerY} ${cornerX + Math.sign(dx) * tension} ${cornerY}`;
      d += ` L ${p2.x} ${p2.y}`;
    }
  }
  return d;
}

const DURATION = 4;
const pathAnimation = {
  pathLength: [0, 1, 1, 1],
  pathOffset: [0, 0, 0, 1],
  opacity: [0, 1, 1, 0],
};
const pathTransition = {
  duration: DURATION,
  times: [0, 0.4, 0.75, 1],
  ease: "easeInOut" as const,
  repeat: Infinity,
  repeatDelay: 0.5,
};

export function AnimatedComponent() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const checkDark = () =>
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    setDark(checkDark());

    const observer = new MutationObserver(() => setDark(checkDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => setDark(checkDark());
    media.addEventListener("change", listener);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", listener);
    };
  }, []);

  const colors = dark ? roadColors.dark : roadColors.light;
  const balls = dark ? darkBalls : lightBalls;

  const minX = Math.min(...balls.map((b) => b.x));
  const minY = Math.min(...balls.map((b) => b.y));
  const offsetX = minX < 0 ? -minX : 0;
  const offsetY = minY < 0 ? -minY : 0;
  const padding = 20;
  const vbWidth  = Math.max(...balls.map((b) => b.x)) + offsetX + radius * 2 + padding;
  const vbHeight = Math.max(...balls.map((b) => b.y)) + offsetY + radius * 2 + padding;

  const adjusted = balls.map((b) => ({
    ...b,
    ax: b.x + offsetX + padding / 2,
    ay: b.y + offsetY + padding / 2,
  }));

  const curvePoints = adjusted.map((b) => ({ x: b.ax + radius, y: b.ay + radius }));
  const roadPath = buildRoadPath(curvePoints);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        viewBox={`0 0 ${vbWidth} ${vbHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full max-h-[280px] sm:max-h-[360px]"
        overflow="visible"
      >
        <motion.path d={roadPath} stroke={colors.outer} strokeWidth={10} fill="none"
          strokeLinecap="round" strokeLinejoin="round"
          animate={pathAnimation} transition={pathTransition} />
        <motion.path d={roadPath} stroke={colors.inner} strokeWidth={6} fill="none"
          strokeLinecap="round" strokeLinejoin="round"
          animate={pathAnimation} transition={pathTransition} />
        <motion.path d={roadPath} stroke={colors.dash} strokeWidth={1.5}
          strokeDasharray="8 6" fill="none" strokeLinecap="round"
          animate={pathAnimation} transition={pathTransition} />

        {adjusted.map((ball, index) => (
          <motion.circle
            key={index}
            cx={ball.ax + radius}
            cy={ball.ay + radius}
            r={radius}
            fill={ball.color}
            animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0] }}
            transition={{
              duration: DURATION,
              times: [0, 0.4, 0.75, 1],
              delay: index * 0.1,
              repeat: Infinity,
              repeatDelay: 0.5,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: `${ball.ax + radius}px ${ball.ay + radius}px` }}
          />
        ))}
      </svg>
    </div>
  );
}
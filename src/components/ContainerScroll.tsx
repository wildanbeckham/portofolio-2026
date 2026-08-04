"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

export function ContainerScroll({
  titleComponent,
  children,
}: {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const rotate = useTransform(scrollYProgress, [0, 0.4], reduce ? [0, 0] : [12, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.4], reduce ? [1, 1] : [0.96, 1]);
  const translate = useTransform(
    scrollYProgress,
    [0, 0.4],
    reduce ? [0, 0] : [24, 0],
  );

  return (
    <div ref={containerRef} className="relative flex justify-center py-4 md:py-8">
      <div className="relative w-full" style={{ perspective: "1200px" }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
}

function Header({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: React.ReactNode;
}) {
  return (
    <motion.div style={{ y: translate }} className="relative z-10 mx-auto max-w-4xl">
      {titleComponent}
    </motion.div>
  );
}

function Card({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      style={{ rotateX: rotate, scale }}
      className="mx-auto mt-6 w-full origin-top will-change-transform"
    >
      {children}
    </motion.div>
  );
}

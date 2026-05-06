'use client';

import { motion } from 'framer-motion';

const pieces = Array.from({ length: 22 }, (_, index) => index);
const colors = ['#38bdf8', '#34f5c5', '#ff9f1c', '#fb5cff', '#a3e635'];

export function ConfettiBurst({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
      {pieces.map((piece) => (
        <motion.span
          key={piece}
          className="absolute left-1/2 top-1/2 h-3 w-2 rounded-sm"
          style={{ backgroundColor: colors[piece % colors.length] }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
          animate={{
            x: (piece % 2 === 0 ? 1 : -1) * (60 + piece * 9),
            y: -120 + (piece % 7) * 44,
            rotate: 240 + piece * 18,
            opacity: 0,
            scale: 0.6
          }}
          transition={{ duration: 1.15, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

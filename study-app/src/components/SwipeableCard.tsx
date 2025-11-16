import React, { ReactNode } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
}) => {
  const controls = useAnimation();

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeDistance = info.offset.x;
    const swipeVelocity = info.velocity.x;

    // Detect swipe based on distance or velocity
    if (Math.abs(swipeDistance) > swipeThreshold || Math.abs(swipeVelocity) > 500) {
      if (swipeDistance > 0 && onSwipeRight) {
        // Swiped right
        onSwipeRight();
      } else if (swipeDistance < 0 && onSwipeLeft) {
        // Swiped left
        onSwipeLeft();
      }
    }

    // Reset position
    controls.start({ x: 0 });
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ cursor: 'grab' }}
      whileTap={{ cursor: 'grabbing' }}
    >
      {children}
    </motion.div>
  );
};

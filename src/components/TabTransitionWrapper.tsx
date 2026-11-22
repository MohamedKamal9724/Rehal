import React, { useRef, useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

interface TabContextValue {
  scope: string;
  activeKey: string;
}

const TabTransitionContext = React.createContext<TabContextValue | null>(null);

export interface TabTransitionWrapperProps {
  activeKey?: string;
  activeTabKey?: string;
  children: React.ReactNode;
  className?: string;
  minHeight?: number | string;
  preventLayoutShift?: boolean;
  scope?: string;
  independent?: boolean;
}

export const TabTransitionWrapper: React.FC<TabTransitionWrapperProps> = ({
  activeKey,
  activeTabKey,
  children,
  className = '',
  minHeight = 'calc(100vh - 7rem)',
  preventLayoutShift = true,
  scope = 'main-tabs',
  independent = false,
}) => {
  const resolvedKey = activeTabKey || activeKey || 'tab-root';
  const parentContext = useContext(TabTransitionContext);

  // If already wrapped by a parent TabTransitionWrapper in the same scope with the same key, pass through
  if (!independent && parentContext && parentContext.scope === scope && parentContext.activeKey === resolvedKey) {
    return <div className={`w-full ${className}`}>{children}</div>;
  }

  return (
    <TabTransitionContext.Provider value={{ scope, activeKey: resolvedKey }}>
      <TabTransitionInner
        activeKey={resolvedKey}
        className={className}
        minHeight={minHeight}
        preventLayoutShift={preventLayoutShift}
      >
        {children}
      </TabTransitionInner>
    </TabTransitionContext.Provider>
  );
};

const TabTransitionInner: React.FC<{
  activeKey: string;
  children: React.ReactNode;
  className?: string;
  minHeight?: number | string;
  preventLayoutShift?: boolean;
}> = ({
  activeKey,
  children,
  className = '',
  minHeight = 'calc(100vh - 7rem)',
  preventLayoutShift = true,
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [lockedHeight, setLockedHeight] = useState<number | 'auto'>('auto');
  const shouldReduceMotion = useReducedMotion();

  // FIX (AUD-04): Zero-Layout-Shift ResizeObserver tracking child height dynamically
  useEffect(() => {
    const innerEl = innerRef.current;
    if (!innerEl) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (lockedHeight !== 'auto') {
          setLockedHeight(entry.contentRect.height);
        }
      }
    });

    observer.observe(innerEl);
    return () => observer.disconnect();
  }, [lockedHeight]);

  const resolvedMinHeight = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;

  return (
    <div
      ref={outerRef}
      style={{
        minHeight: resolvedMinHeight,
        height: lockedHeight === 'auto' ? 'auto' : `${lockedHeight}px`,
        transition: shouldReduceMotion
          ? 'none'
          : 'height 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`relative w-full ${lockedHeight !== 'auto' ? 'overflow-hidden' : ''} ${className}`}
    >
      <AnimatePresence
        mode="wait"
        initial={false}
        onExitComplete={() => {
          // Unlock height only AFTER the exit transition settles
          setLockedHeight('auto');
        }}
      >
        <motion.div
          key={activeKey}
          ref={innerRef}
          onAnimationStart={() => {
            if (preventLayoutShift && innerRef.current) {
              setLockedHeight(innerRef.current.offsetHeight);
            }
          }}
          onAnimationComplete={() => {
            setLockedHeight('auto');
          }}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
          transition={{
            duration: 0.15, // Matches Executive token (150ms)
            ease: [0.16, 1, 0.3, 1],
          }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

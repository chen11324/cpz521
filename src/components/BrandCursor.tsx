import { useEffect, useRef } from 'react';

const interactiveSelector = 'button, a, [role="button"], [role="tab"], summary, input[type="file"], select, label[for]';
const textSelector = 'input:not([type="file"]), textarea, [contenteditable="true"]';

export function BrandCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const media = window.matchMedia('(pointer: fine)');
    const root = document.documentElement;
    if (!cursor) return;
    const el = cursor;

    function setEnabled() {
      root.classList.toggle('brand-cursor-enabled', media.matches);
      if (!media.matches) el.classList.remove('is-visible');
    }

    function moveCursor(event: PointerEvent) {
      if (!media.matches || event.pointerType === 'touch') return;
      const target = event.target instanceof Element ? event.target : null;
      const isTextTarget = Boolean(target?.closest(textSelector));
      el.style.setProperty('--cursor-x', event.clientX + 'px');
      el.style.setProperty('--cursor-y', event.clientY + 'px');
      el.classList.toggle('is-visible', !isTextTarget);
      el.classList.toggle('is-action', Boolean(target?.closest(interactiveSelector)) && !isTextTarget);
    }

    function hideCursor() { el.classList.remove('is-visible'); }

    setEnabled();
    media.addEventListener('change', setEnabled);
    window.addEventListener('pointermove', moveCursor, { passive: true });
    window.addEventListener('blur', hideCursor);
    document.addEventListener('mouseleave', hideCursor);

    return () => {
      root.classList.remove('brand-cursor-enabled');
      media.removeEventListener('change', setEnabled);
      window.removeEventListener('pointermove', moveCursor);
      window.removeEventListener('blur', hideCursor);
      document.removeEventListener('mouseleave', hideCursor);
    };
  }, []);

  return <div ref={cursorRef} className="brand-cursor" aria-hidden="true" />;
}

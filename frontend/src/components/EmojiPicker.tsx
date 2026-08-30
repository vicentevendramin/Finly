import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import data from '@emoji-mart/data';
import { Picker } from 'emoji-mart';
import { useThemeStore } from '../store/themeStore';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClickOutside?: () => void;
}

/**
 * Thin wrapper around emoji-mart's web-component Picker (its React binding
 * doesn't support React 19 yet). Styles are Shadow-DOM encapsulated, so they
 * don't clash with Tailwind.
 */
const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClickOutside }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((state) => state.theme);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onClickOutsideRef = useRef(onClickOutside);
  onClickOutsideRef.current = onClickOutside;

  const { i18n } = useTranslation();
  const locale = (i18n.resolvedLanguage ?? 'en').split('-')[0];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const picker = new Picker({
      data,
      theme,
      locale,
      previewPosition: 'none',
      skinTonePosition: 'none',
      navPosition: 'bottom',
      onEmojiSelect: (emoji: { native: string }) => onSelectRef.current(emoji.native),
      onClickOutside: () => onClickOutsideRef.current?.(),
    });

    container.appendChild(picker as unknown as Node);
    return () => {
      container.replaceChildren();
    };
  }, [theme, locale]);

  return <div ref={containerRef} />;
};

export default EmojiPicker;

import React from 'react';
import { Bookmark } from 'lucide-react';
import { GalleyDisplayOptions, FootnoteStyleOption } from '../../../../shared/types/galleyTypes';
import styles from '../GalleyOptionsControls.module.css';

interface FootnoteStyleCardProps {
  options: GalleyDisplayOptions;
  onOptionsChange: (newOptions: GalleyDisplayOptions) => void;
}

export const FootnoteStyleCard: React.FC<FootnoteStyleCardProps> = ({
  options,
  onOptionsChange,
}) => {
  const handleFootnoteStyleChange = (style: FootnoteStyleOption) => {
    onOptionsChange({ ...options, footnoteStyle: style });
  };

  return (
    <div className={styles.cardContainer}>
      <div className={styles.headerRow}>
        <Bookmark size={20} />
        <span className={styles.title}>Footnote & Reference Options</span>
      </div>

      <div className={styles.togglesList}>
        <div className={styles.optionBlock}>
          <div className={styles.optionHeader}>
            <span className={styles.toggleLabel}>Presentation Style</span>
            <span className={styles.toggleHint}>JATS / eLife Web</span>
          </div>
          <div className={styles.segmentedGroup}>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${options.footnoteStyle === 'bottom-endnotes' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleFootnoteStyleChange('bottom-endnotes')}
            >
              Bottom Endnotes
            </button>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${options.footnoteStyle === 'popover' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleFootnoteStyleChange('popover')}
            >
              Hover Popovers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

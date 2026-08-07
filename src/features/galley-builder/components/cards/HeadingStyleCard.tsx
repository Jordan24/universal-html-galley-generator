import React from 'react';
import { ListOrdered } from 'lucide-react';
import { GalleyDisplayOptions, HeadingNumberingOption, HeadingTransformOption } from '../../../../shared/types/galleyTypes';
import styles from '../GalleyOptionsControls.module.css';

interface HeadingStyleCardProps {
  options: GalleyDisplayOptions;
  onOptionsChange: (newOptions: GalleyDisplayOptions) => void;
}

export const HeadingStyleCard: React.FC<HeadingStyleCardProps> = ({
  options,
  onOptionsChange,
}) => {
  const handleNumberingChange = (val: HeadingNumberingOption) => {
    onOptionsChange({ ...options, headingNumbering: val });
  };

  const handleTransformToggle = () => {
    const nextVal: HeadingTransformOption = options.headingTransform === 'uppercase' ? 'none' : 'uppercase';
    onOptionsChange({ ...options, headingTransform: nextVal });
  };

  return (
    <div className={styles.cardContainer}>
      <div className={styles.headerRow}>
        <ListOrdered size={20} />
        <span className={styles.title}>Section Headings & Hierarchy</span>
      </div>

      <div className={styles.togglesList}>
        {/* Option 1: Heading Numbering Format */}
        <div className={styles.optionBlock}>
          <div className={styles.optionHeader}>
            <span className={styles.toggleLabel}>Section Numbering</span>
            <span className={styles.toggleHint}>IEEE / JATS / APA</span>
          </div>
          <div className={styles.segmentedGroup}>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${options.headingNumbering === 'none' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleNumberingChange('none')}
            >
              Unnumbered
            </button>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${options.headingNumbering === 'decimal' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleNumberingChange('decimal')}
            >
              1.0 Decimal
            </button>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${options.headingNumbering === 'roman' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleNumberingChange('roman')}
            >
              I. Roman
            </button>
          </div>
        </div>

        {/* Option 2: Heading Uppercase Transform */}
        <label className={styles.toggleRow} htmlFor="toggle-heading-uppercase">
          <div className={styles.toggleInfo}>
            <div className={styles.labelGroup}>
              <span className={styles.toggleLabel}>ALL CAPS Headings</span>
            </div>
            <span className={styles.toggleHint}>
              Convert headings to uppercase style (HUMANITIES / IEEE)
            </span>
          </div>
          <div className={styles.switchWrapper}>
            <input
              id="toggle-heading-uppercase"
              type="checkbox"
              className={styles.switchInput}
              checked={options.headingTransform === 'uppercase'}
              onChange={handleTransformToggle}
              aria-label="Toggle uppercase headings"
            />
            <span className={styles.switchSlider} />
          </div>
        </label>
      </div>
    </div>
  );
};

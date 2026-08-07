import React from 'react';
import { Type, AlignLeft, AlignJustify } from 'lucide-react';
import { GalleyDisplayOptions, TextAlignmentOption, FontFamilyOption, LineHeightOption } from '../../../../shared/types/galleyTypes';
import styles from '../GalleyOptionsControls.module.css';

interface TypographyCardProps {
  options: GalleyDisplayOptions;
  onOptionsChange: (newOptions: GalleyDisplayOptions) => void;
}

export const TypographyCard: React.FC<TypographyCardProps> = ({
  options,
  onOptionsChange,
}) => {
  const handleAlignChange = (align: TextAlignmentOption) => {
    onOptionsChange({ ...options, textAlign: align });
  };

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onOptionsChange({ ...options, fontFamily: e.target.value as FontFamilyOption });
  };

  const handleLineHeightChange = (height: LineHeightOption) => {
    onOptionsChange({ ...options, lineHeight: height });
  };

  return (
    <div className={styles.cardContainer}>
      <div className={styles.headerRow}>
        <Type size={20} />
        <span className={styles.title}>Typography & Text Alignment</span>
      </div>

      <div className={styles.togglesList}>
        {/* Option 1: Text Alignment */}
        <div className={styles.optionBlock}>
          <div className={styles.optionHeader}>
            <span className={styles.toggleLabel}>Paragraph Alignment</span>
            <span className={styles.toggleHint}>W3C / Print Standard</span>
          </div>
          <div className={styles.segmentedGroup}>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${options.textAlign === 'justify' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleAlignChange('justify')}
              aria-label="Justify text"
            >
              <AlignJustify size={14} /> Justified
            </button>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${options.textAlign === 'left' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleAlignChange('left')}
              aria-label="Left align text"
            >
              <AlignLeft size={14} /> Left-Aligned
            </button>
          </div>
        </div>

        {/* Option 2: Body Font Family */}
        <div className={styles.optionBlock}>
          <div className={styles.optionHeader}>
            <span className={styles.toggleLabel}>Body Font Family</span>
            <span className={styles.toggleHint}>Publisher typography</span>
          </div>
          <select
            className={styles.selectInput}
            value={options.fontFamily}
            onChange={handleFontChange}
            aria-label="Select body font family"
          >
            <option value="serif">Academic Serif (Merriweather / Georgia)</option>
            <option value="sans-serif">Modern Digital (Inter / Sans-Serif)</option>
            <option value="inherit">Scraped Journal Theme Font</option>
          </select>
        </div>

        {/* Option 3: Paragraph Line Spacing */}
        <div className={styles.optionBlock}>
          <div className={styles.optionHeader}>
            <span className={styles.toggleLabel}>Line Height Spacing</span>
          </div>
          <div className={styles.segmentedGroup}>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${options.lineHeight === 'compact' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleLineHeightChange('compact')}
            >
              1.5 Compact
            </button>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${options.lineHeight === 'comfortable' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleLineHeightChange('comfortable')}
            >
              1.75 Normal
            </button>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${options.lineHeight === 'loose' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleLineHeightChange('loose')}
            >
              2.0 Loose
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

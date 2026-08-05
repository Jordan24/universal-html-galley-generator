import React from 'react';
import { Sliders, Type, User } from 'lucide-react';
import { GalleyDisplayOptions } from '../../../shared/types/galleyTypes';
import styles from './GalleyOptionsControls.module.css';

interface GalleyOptionsControlsProps {
  options: GalleyDisplayOptions;
  onOptionsChange: (newOptions: GalleyDisplayOptions) => void;
}

export const GalleyOptionsControls: React.FC<GalleyOptionsControlsProps> = ({
  options,
  onOptionsChange,
}) => {
  const handleToggleTitle = () => {
    onOptionsChange({
      ...options,
      showTitleInBody: !options.showTitleInBody,
    });
  };

  const handleToggleAuthors = () => {
    onOptionsChange({
      ...options,
      showAuthorsInBody: !options.showAuthorsInBody,
    });
  };

  return (
    <div className={styles.cardContainer}>
      <div className={styles.headerRow}>
        <Sliders size={22} />
        <span className={styles.title}>Galley Body Layout Options</span>
      </div>

      <div className={styles.togglesList}>
        {/* Toggle 1: Article Title in Body */}
        <label className={styles.toggleRow} htmlFor="toggle-show-title">
          <div className={styles.toggleInfo}>
            <div className={styles.labelGroup}>
              <Type size={16} className={styles.icon} />
              <span className={styles.toggleLabel}>Show Article Title in Body</span>
            </div>
            <span className={styles.toggleHint}>
              Turn off if title is already rendered in the scraped journal header
            </span>
          </div>
          <div className={styles.switchWrapper}>
            <input
              id="toggle-show-title"
              type="checkbox"
              className={styles.switchInput}
              checked={options.showTitleInBody}
              onChange={handleToggleTitle}
              aria-label="Toggle showing article title in body"
            />
            <span className={styles.switchSlider} />
          </div>
        </label>

        {/* Toggle 2: Author(s) in Body */}
        <label className={styles.toggleRow} htmlFor="toggle-show-authors">
          <div className={styles.toggleInfo}>
            <div className={styles.labelGroup}>
              <User size={16} className={styles.icon} />
              <span className={styles.toggleLabel}>Show Author(s) in Body</span>
            </div>
            <span className={styles.toggleHint}>
              Turn off if author names are already rendered in the scraped journal header
            </span>
          </div>
          <div className={styles.switchWrapper}>
            <input
              id="toggle-show-authors"
              type="checkbox"
              className={styles.switchInput}
              checked={options.showAuthorsInBody}
              onChange={handleToggleAuthors}
              aria-label="Toggle showing authors in body"
            />
            <span className={styles.switchSlider} />
          </div>
        </label>
      </div>
    </div>
  );
};

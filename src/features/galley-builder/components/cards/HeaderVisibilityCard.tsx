import React from 'react';
import { Eye, Type, User, FileText } from 'lucide-react';
import { GalleyDisplayOptions } from '../../../../shared/types/galleyTypes';
import styles from '../GalleyOptionsControls.module.css';

interface HeaderVisibilityCardProps {
  options: GalleyDisplayOptions;
  onOptionsChange: (newOptions: GalleyDisplayOptions) => void;
}

export const HeaderVisibilityCard: React.FC<HeaderVisibilityCardProps> = ({
  options,
  onOptionsChange,
}) => {
  return (
    <div className={styles.cardContainer}>
      <div className={styles.headerRow}>
        <Eye size={20} />
        <span className={styles.title}>Header Elements Visibility</span>
      </div>

      <div className={styles.togglesList}>
        {/* Toggle 1: Article Title in Body */}
        <label className={styles.toggleRow} htmlFor="toggle-show-title">
          <div className={styles.toggleInfo}>
            <div className={styles.labelGroup}>
              <Type size={16} className={styles.icon} />
              <span className={styles.toggleLabel}>Show Title in Body</span>
            </div>
            <span className={styles.toggleHint}>
              Turn off if title is rendered in scraped journal header
            </span>
          </div>
          <div className={styles.switchWrapper}>
            <input
              id="toggle-show-title"
              type="checkbox"
              className={styles.switchInput}
              checked={options.showTitleInBody}
              onChange={() =>
                onOptionsChange({ ...options, showTitleInBody: !options.showTitleInBody })
              }
              aria-label="Toggle title in body"
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
              Turn off if authors are rendered in scraped header
            </span>
          </div>
          <div className={styles.switchWrapper}>
            <input
              id="toggle-show-authors"
              type="checkbox"
              className={styles.switchInput}
              checked={options.showAuthorsInBody}
              onChange={() =>
                onOptionsChange({ ...options, showAuthorsInBody: !options.showAuthorsInBody })
              }
              aria-label="Toggle authors in body"
            />
            <span className={styles.switchSlider} />
          </div>
        </label>

        {/* Toggle 3: Abstract in Body */}
        <label className={styles.toggleRow} htmlFor="toggle-show-abstract">
          <div className={styles.toggleInfo}>
            <div className={styles.labelGroup}>
              <FileText size={16} className={styles.icon} />
              <span className={styles.toggleLabel}>Show Abstract in Body</span>
            </div>
            <span className={styles.toggleHint}>
              Turn off if abstract is rendered in scraped header
            </span>
          </div>
          <div className={styles.switchWrapper}>
            <input
              id="toggle-show-abstract"
              type="checkbox"
              className={styles.switchInput}
              checked={options.showAbstractInBody}
              onChange={() =>
                onOptionsChange({ ...options, showAbstractInBody: !options.showAbstractInBody })
              }
              aria-label="Toggle abstract in body"
            />
            <span className={styles.switchSlider} />
          </div>
        </label>
      </div>
    </div>
  );
};

import React from 'react';
import { Maximize2 } from 'lucide-react';
import { GalleyDisplayOptions, ContainerWidthOption } from '../../../../shared/types/galleyTypes';
import styles from '../GalleyOptionsControls.module.css';

interface ContainerWidthCardProps {
  options: GalleyDisplayOptions;
  onOptionsChange: (newOptions: GalleyDisplayOptions) => void;
}

export const ContainerWidthCard: React.FC<ContainerWidthCardProps> = ({
  options,
  onOptionsChange,
}) => {
  const handleWidthChange = (width: ContainerWidthOption) => {
    onOptionsChange({ ...options, containerWidth: width });
  };

  return (
    <div className={styles.cardContainer}>
      <div className={styles.headerRow}>
        <Maximize2 size={20} />
        <span className={styles.title}>Reading Container Width</span>
      </div>

      <div className={styles.togglesList}>
        <div className={styles.optionBlock}>
          <div className={styles.optionHeader}>
            <span className={styles.toggleLabel}>Max Article Body Width</span>
            <span className={styles.toggleHint}>Readability width</span>
          </div>
          <div className={styles.segmentedGroup}>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${options.containerWidth === 'narrow' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleWidthChange('narrow')}
            >
              Narrow (700px)
            </button>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${options.containerWidth === 'standard' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleWidthChange('standard')}
            >
              Standard (860px)
            </button>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${options.containerWidth === 'wide' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleWidthChange('wide')}
            >
              Wide (1000px)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

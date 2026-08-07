import React from 'react';
import { Quote, Palette } from 'lucide-react';
import { GalleyDisplayOptions, AbstractStyleOption } from '../../../../shared/types/galleyTypes';
import styles from '../GalleyOptionsControls.module.css';

interface AbstractStyleCardProps {
  options: GalleyDisplayOptions;
  onOptionsChange: (newOptions: GalleyDisplayOptions) => void;
}

export const AbstractStyleCard: React.FC<AbstractStyleCardProps> = ({
  options,
  onOptionsChange,
}) => {
  const handleStyleChange = (style: AbstractStyleOption) => {
    onOptionsChange({ ...options, abstractStyle: style });
  };

  const presetColors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Slate', value: '#64748b' }
  ];

  const currentColor = options.abstractCardColor || '#3b82f6';

  const handleColorChange = (newColor: string) => {
    onOptionsChange({ ...options, abstractCardColor: newColor });
  };

  return (
    <div className={styles.cardContainer}>
      <div className={styles.headerRow}>
        <Quote size={20} />
        <span className={styles.title}>Abstract Presentation</span>
      </div>

      <div className={styles.togglesList}>
        <div className={styles.optionBlock}>
          <div className={styles.optionHeader}>
            <span className={styles.toggleLabel}>Abstract Layout Style</span>
            <span className={styles.toggleHint}>Nature / JATS</span>
          </div>
          <div className={styles.segmentedGroup}>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${options.abstractStyle === 'standard' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleStyleChange('standard')}
            >
              Standard Header
            </button>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${options.abstractStyle === 'card' ? styles.segmentedBtnActive : ''}`}
              onClick={() => handleStyleChange('card')}
            >
              Bordered Callout Card
            </button>
          </div>

          {options.abstractStyle === 'card' && (
            <div className={styles.colorPickerContainer}>
              <div className={styles.colorPickerHeader}>
                <span className={styles.colorPickerLabel}>Card Color Accent</span>
                <span className={styles.colorValueText}>{currentColor}</span>
              </div>
              <div className={styles.colorSelectorRow}>
                {presetColors.map((color) => {
                  const isActive = currentColor.toLowerCase() === color.value.toLowerCase();
                  return (
                    <button
                      key={color.value}
                      type="button"
                      className={`${styles.presetColorBtn} ${isActive ? styles.presetColorBtnActive : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleColorChange(color.value)}
                      title={color.name}
                      aria-label={`Select ${color.name} theme`}
                    />
                  );
                })}
                <div className={styles.divider} />
                <div className={`${styles.customColorWrapper} ${
                  !presetColors.some(p => p.value.toLowerCase() === currentColor.toLowerCase())
                    ? styles.customColorWrapperActive
                    : ''
                }`} title="Custom Color">
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={currentColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    aria-label="Select custom color"
                  />
                  <Palette size={11} className={styles.customColorIcon} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Sun, Moon, Code, ShieldCheck, Coffee } from 'lucide-react';
import { ThemeMode } from '../types/galleyTypes';
import jaLogo from '../../assets/ja_logo_custom.svg';
import styles from './Header.module.css';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme }) => {
  return (
    <header className={styles.header}>
      <div className={styles.brandGroup}>
        <div className={styles.logoIcon} aria-hidden="true">
          <img src={jaLogo} alt="" className={styles.logoImg} />
        </div>
        <div>
          <div className={styles.title}>Universal HTML Galley Generator</div>
        </div>
      </div>

      <div className={styles.controlsGroup}>
        <a
          href="https://buymeacoffee.com/thejambers"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.controlBtn}
          aria-label="Buy coffee"
          title="Buy Coffee"
        >
          <Coffee size={16} />
          <span className={styles.btnLabel}>Buy coffee</span>
        </a>

        <a
          href="https://github.com/Jordan24/universal-html-galley-generator"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.controlBtn}
          aria-label="Source Code"
          title="Source Code"
        >
          <Code size={16} />
          <span className={styles.btnLabel}>Source Code</span>
        </a>

        <a
          href="https://www.apache.org/licenses/LICENSE-2.0"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.controlBtn}
          aria-label="Open Source License (Apache 2.0)"
          title="Open Source License (Apache 2.0)"
        >
          <ShieldCheck size={16} />
          <span className={styles.btnLabel}>Apache 2.0</span>
        </a>

        <button
          className={styles.controlBtn}
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={16} />
              <span className={styles.btnLabel}>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={16} />
              <span className={styles.btnLabel}>Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

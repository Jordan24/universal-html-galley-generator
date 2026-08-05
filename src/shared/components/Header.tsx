import React from 'react';
import { BookOpen, Sun, Moon, Github, ShieldCheck } from 'lucide-react';
import { ThemeMode } from '../types/galleyTypes';
import styles from './Header.module.css';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme }) => {
  return (
    <header className={styles.header}>
      <div className={styles.brandGroup}>
        <div className={styles.logoIcon}>
          <BookOpen size={22} />
        </div>
        <div>
          <div className={styles.title}>Universal HTML Galley Generator</div>
          <div className={styles.subtitle}>Client-side Academic Galley & Website Skin Embedder</div>
        </div>
      </div>

      <div className={styles.controlsGroup}>
        <span className={styles.badge} title="Open Source License">
          <ShieldCheck size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Apache 2.0
        </span>

        <button
          className={styles.themeToggleBtn}
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={16} style={{ color: '#f59e0b' }} /> Light Mode
            </>
          ) : (
            <>
              <Moon size={16} style={{ color: '#8b5cf6' }} /> Dark Mode
            </>
          )}
        </button>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.iconLink}
          aria-label="View on GitHub"
          title="GitHub Repository"
        >
          <Github size={20} />
        </a>
      </div>
    </header>
  );
};

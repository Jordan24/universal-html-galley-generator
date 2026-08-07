import React from 'react';
import { GalleyDisplayOptions } from '../../../shared/types/galleyTypes';
import { HeaderVisibilityCard } from './cards/HeaderVisibilityCard';
import { TypographyCard } from './cards/TypographyCard';
import { HeadingStyleCard } from './cards/HeadingStyleCard';
import { AbstractStyleCard } from './cards/AbstractStyleCard';
import { FootnoteStyleCard } from './cards/FootnoteStyleCard';
import { ContainerWidthCard } from './cards/ContainerWidthCard';

interface GalleyOptionsControlsProps {
  options: GalleyDisplayOptions;
  onOptionsChange: (newOptions: GalleyDisplayOptions) => void;
}

export const GalleyOptionsControls: React.FC<GalleyOptionsControlsProps> = ({
  options,
  onOptionsChange,
}) => {
  return (
    <>
      {/* Card 1: Header Elements Visibility */}
      <HeaderVisibilityCard options={options} onOptionsChange={onOptionsChange} />

      {/* Card 2: Typography & Alignment */}
      <TypographyCard options={options} onOptionsChange={onOptionsChange} />

      {/* Card 3: Headings & Hierarchy */}
      <HeadingStyleCard options={options} onOptionsChange={onOptionsChange} />

      {/* Card 4: Abstract Presentation */}
      <AbstractStyleCard options={options} onOptionsChange={onOptionsChange} />

      {/* Card 5: Footnotes & References */}
      <FootnoteStyleCard options={options} onOptionsChange={onOptionsChange} />

      {/* Card 6: Reading Container Width */}
      <ContainerWidthCard options={options} onOptionsChange={onOptionsChange} />
    </>
  );
};


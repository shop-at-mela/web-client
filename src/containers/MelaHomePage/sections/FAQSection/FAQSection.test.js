import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import FAQSection from './FAQSection';

const items = [
  { question: 'Q one?', answer: 'Answer one.' },
  { question: 'Q two?', answer: 'Answer two.' },
];

describe('FAQSection', () => {
  it('renders every question and answer as a card', () => {
    const { container } = render(<FAQSection id="faq" items={items} lastUpdated="2026-10-02" />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
    expect(screen.getByText('Answer one.')).toBeInTheDocument();
    expect(container.querySelector('section#faq')).toBeInTheDocument();
    expect(screen.getByText(/Last reviewed 2026-10-02/)).toBeInTheDocument();
  });

  it('renders nothing without items', () => {
    const { container } = render(<FAQSection items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

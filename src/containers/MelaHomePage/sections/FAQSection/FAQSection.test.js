import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import FAQSection from './FAQSection';

const items = [
  { question: 'Q one?', answer: 'Answer one.' },
  { question: 'Q two?', answer: 'Answer two.' },
];

describe('FAQSection', () => {
  it('renders every question as a <details> accordion item with its question in <summary>', () => {
    const { container } = render(<FAQSection id="faq" items={items} lastUpdated="2026-10-02" />);
    const details = container.querySelectorAll('details');
    expect(details).toHaveLength(2);
    expect(details[0].querySelector('summary h3')).toHaveTextContent('Q one?');
    expect(details[1].querySelector('summary h3')).toHaveTextContent('Q two?');
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
    expect(container.querySelector('section#faq')).toBeInTheDocument();
    expect(screen.getByText(/Last reviewed 2026-10-02/)).toBeInTheDocument();
  });

  it('opens only the first item', () => {
    const { container } = render(<FAQSection id="faq" items={items} />);
    const details = container.querySelectorAll('details');
    expect(details[0]).toHaveAttribute('open');
    expect(details[1]).not.toHaveAttribute('open');
  });

  it('keeps every answer in the DOM, including closed items', () => {
    const { container } = render(<FAQSection id="faq" items={items} />);
    const answers = Array.from(container.querySelectorAll('details > p')).map(p => p.textContent);
    expect(answers).toEqual(['Answer one.', 'Answer two.']);
  });

  it('server-renders every answer', () => {
    const { renderToString } = require('react-dom/server');
    const html = renderToString(<FAQSection id="faq" items={items} />);
    expect(html).toContain('Answer one.');
    expect(html).toContain('Answer two.');
    expect(html).toMatch(/<details[^>]*open/);
  });

  it('renders nothing without items', () => {
    const { container } = render(<FAQSection items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

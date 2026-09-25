import React from 'react';
import { arrayOf, shape, string } from 'prop-types';

import css from './FAQSection.module.css';

/**
 * Visible FAQ section — renders the same question/answer pairs that MelaHomePage
 * also embeds as FAQPage JSON-LD. Before this component existed, those Q&As lived
 * only inside a hidden <script type="application/ld+json"> block: real content that
 * no human visitor and no AI answer engine reading visible text could ever see.
 * MelaHomePage passes the identical `items` array into both places so the visible
 * copy and the structured data can never drift apart.
 */
const FAQSection = ({ items, lastUpdated }) => {
  if (!items || items.length === 0) return null;

  return (
    <section className={css.root}>
      <h2 className={css.title}>Frequently Asked Questions</h2>
      <div className={css.list}>
        {items.map(item => (
          <div key={item.question} className={css.item}>
            <h3 className={css.question}>{item.question}</h3>
            <p className={css.answer}>{item.answer}</p>
          </div>
        ))}
      </div>
      <p className={css.byline}>
        Curated by the Mela team{lastUpdated ? ` · Last reviewed ${lastUpdated}` : ''}
      </p>
    </section>
  );
};

FAQSection.propTypes = {
  items: arrayOf(
    shape({
      question: string.isRequired,
      answer: string.isRequired,
    })
  ).isRequired,
  lastUpdated: string,
};

export default FAQSection;

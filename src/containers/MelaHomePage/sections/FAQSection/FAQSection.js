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
 *
 * Accordion (homepage declutter v3): native <details>/<summary>, first item open. Closed
 * answers are still in the server-rendered HTML, so answer engines and the JSON-LD see
 * the same text; no JS is needed to open or close an item.
 */
const FAQSection = ({ id, items, lastUpdated }) => {
  if (!items || items.length === 0) return null;

  return (
    <section id={id} className={css.root}>
      <div className={css.inner}>
        <h2 className={css.title}>Shipping, Payment & Returns for US Shoppers</h2>
        <div className={css.list}>
          {items.map((item, index) => (
            <details key={item.question} className={css.item} open={index === 0}>
              <summary className={css.summary}>
                <h3 className={css.question}>{item.question}</h3>
                <span className={css.icon} aria-hidden="true" />
              </summary>
              <p className={css.answer}>{item.answer}</p>
            </details>
          ))}
        </div>
        <p className={css.byline}>
          Curated by the Mela team{lastUpdated ? ` · Last reviewed ${lastUpdated}` : ''}
        </p>
      </div>
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
  id: string,
};

export default FAQSection;

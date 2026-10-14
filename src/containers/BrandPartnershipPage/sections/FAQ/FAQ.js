import React from 'react';
import { H2, H4 } from '../../../../components';
import { BRAND_PARTNERSHIP_FAQ_ITEMS } from './faqItems';
import css from './FAQ.module.css';

const FAQ = () => {
  const faqs = BRAND_PARTNERSHIP_FAQ_ITEMS;

  return (
    <section className={css.section}>
      <div className={css.container}>
        <H2 className={css.sectionTitle}>Frequently Asked Questions</H2>

        <div className={css.faqList}>
          {faqs.map(faq => (
            <div key={faq.question} className={`${css.faqCard} ${faq.featured ? css.featured : ''}`}>
              {faq.featured && (
                <div className={css.featuredBadge}>
                  ADDRESSING CONCERNS
                </div>
              )}
              <H4 className={css.faqQuestion}>
                {faq.question}
              </H4>
              <p className={css.faqAnswer}>
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
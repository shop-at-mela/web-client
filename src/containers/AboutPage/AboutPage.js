import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { isScrollingDisabled } from '../../ducks/ui.duck';
import { Page, LayoutSingleColumn, NamedLink } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import css from './AboutPage.module.css';

// Code-owned replacement for the Sharetribe Console "about" CMS page. The copy is
// claim-checked against the shipping transparency and footer legalese PRDs: no
// shipping times, card acceptance, certifications, or "every brand" promises.
// Mela is a personal, non-commercial project run by an individual; keep the
// "Who's behind it" wording consistent with footer-legalese-prd.md, and don't add
// future-business language. "Brands don't pay to be featured" must change if any
// brand ever pays.

const CONTACT_EMAIL = 'shopatmela@gmail.com';

export const PAGE_TITLE = 'About Mela | Modern Indian Brands, Found for You';
export const PAGE_DESCRIPTION =
  "Mela is a curated home for proven Indian brands with real export experience. Discover them here, then buy on each brand's own store.";

const STEPS = [
  {
    title: 'Discover',
    text: 'Explore brands and pieces on Mela. Save the ones you like so you can find them again.',
  },
  {
    title: 'Click through',
    text: "When you're ready, we send you to that brand's own store.",
  },
  {
    title: 'Buy from the brand',
    text: 'Checkout, shipping, returns and customer service all happen with the brand.',
  },
];

const STORY = [
  'I buy a lot from India. Most of it still reaches me the old way: packed into a suitcase on the way back from a visit home.',
  "It isn't because the brands aren't good. India's independent labels are making some of the most beautiful, modern things anywhere right now. But reaching shoppers on the other side of the world is hard for a small brand. I've watched friends spend real money on Instagram ads and see almost nothing come back.",
  'And when a shopper does find one of these brands, the name rarely sticks. Ask my friends where they got a kurta they love, and the answer is often "some small brand on Instagram." They loved it. They can\'t find it again.',
  'Mela is my answer to both problems: one place to discover modern Indian brands, and to find them again. Along the way, I want to learn what actually helps these brands reach US shoppers, and share it openly.',
];

const STORY_CLOSER =
  'You probably know where to look for something handmade. I want Mela to be the place you go for modern Indian brands.';

export const AboutPageComponent = props => {
  const { scrollingDisabled } = props;

  return (
    <Page
      title={PAGE_TITLE}
      description={PAGE_DESCRIPTION}
      scrollingDisabled={scrollingDisabled}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'AboutPage',
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
      }}
    >
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <header className={css.hero}>
            <p className={css.eyebrow}>About Mela</p>
            <h1 className={css.heroTitle}>Indian brands, found for you</h1>
            <p className={css.heroText}>
              Mela is a curated home for proven Indian brands with real export experience. We look
              for the labels India already loves, across fashion, home, beauty, jewelry and kids,
              and bring them together in one place for shoppers in the US.
            </p>
            <p className={css.heroTagline}>Browse them here. Buy from the brand itself.</p>
          </header>

          <div className={css.content}>
            <section className={css.section} aria-labelledby="about-how">
              <h2 id="about-how" className={css.sectionTitle}>
                How it works
              </h2>
              <ol className={css.steps}>
                {STEPS.map((step, i) => (
                  <li key={step.title} className={css.step}>
                    <span className={css.stepNumber} aria-hidden="true">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className={css.stepTitle}>{step.title}</h3>
                      <p className={css.stepText}>{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className={css.note}>Mela doesn't sell products, take payments, or ship orders.</p>
            </section>

            <section className={css.section} aria-labelledby="about-check">
              <h2 id="about-check" className={css.sectionTitle}>
                What we check
              </h2>
              <p className={css.paragraph}>
                We look for brands that are proven in India and have real export experience: they
                already know how to get an order to a customer abroad.
              </p>
              <p className={css.paragraph}>
                On each brand's page, you'll find that brand's own US shipping cost and whether its
                prices include US import duties. These are the brand's policies, not ours, and we
                take them from the brand's own store.
              </p>
              <p className={css.paragraph}>
                Where we don't know something yet, we say so. We'd rather tell you that than guess.
              </p>
            </section>

            <section className={css.storySection} aria-labelledby="about-why">
              <h2 id="about-why" className={css.sectionTitle}>
                Why Mela exists
              </h2>
              {STORY.map(text => (
                <p key={text.slice(0, 24)} className={css.paragraph}>
                  {text}
                </p>
              ))}
              <p className={css.storyCloser}>{STORY_CLOSER}</p>
            </section>

            <section className={css.section} aria-labelledby="about-who">
              <h2 id="about-who" className={css.sectionTitle}>
                Who's behind it
              </h2>
              <p className={css.paragraph}>
                Mela is a personal project by Sanjot Sawhney. Brands don't pay to be featured.
              </p>
            </section>

            <section className={css.section} aria-labelledby="about-contact">
              <h2 id="about-contact" className={css.sectionTitle}>
                Get in touch
              </h2>
              <p className={css.paragraph}>
                Have a question about Mela, or a brand you think we should feature? Email us at{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className={css.link}>
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
              <p className={css.paragraph}>
                For anything about an order, contact the brand directly. They handle it from
                checkout to delivery.
              </p>
              <NamedLink name="BrandsPage" className={css.cta}>
                Browse the brands
              </NamedLink>
            </section>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => ({
  scrollingDisabled: isScrollingDisabled(state),
});

const AboutPage = compose(connect(mapStateToProps))(AboutPageComponent);

export default AboutPage;

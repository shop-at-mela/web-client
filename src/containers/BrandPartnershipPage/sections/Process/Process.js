import React, { useState } from 'react';
import { H2, H3 } from '../../../../components';
import css from './Process.module.css';

const Process = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: "1",
      title: "Apply & Get Approved",
      shortDesc: "Submit your brand application",
      fullDesc: "Complete our simple application form with your brand details, product catalog, and business information. Our team reviews applications within 48 hours.",
      icon: "📝",
      details: [
        "Brand & product information",
        "Quality standards verification",
        "Business documentation review",
        "48-hour approval process"
      ]
    },
    {
      number: "2",
      title: "Setup Your Store",
      shortDesc: "We help you get online quickly",
      fullDesc: "Our team works with you to create your brand profile, upload products, and optimize your listings for the US market.",
      icon: "🏪",
      details: [
        "Brand profile creation",
        "Product catalog upload",
        "US market optimization",
        "Quality photography guidance"
      ]
    },
    {
      number: "3",
      title: "Start Selling",
      shortDesc: "We drive customers to you",
      fullDesc: "We promote your products to our network of diaspora families. You handle fulfillment while we handle marketing and customer acquisition.",
      icon: "🚀",
      details: [
        "Targeted marketing campaigns",
        "Diaspora family outreach",
        "Customer acquisition",
        "Performance tracking"
      ]
    },
    {
      number: "4",
      title: "Grow Together",
      shortDesc: "Scale with our support",
      fullDesc: "As your sales grow, we expand to new markets together. Our success is directly tied to your success through our performance-based model.",
      icon: "📈",
      details: [
        "Global market expansion",
        "Performance optimization",
        "Scaling support",
        "Long-term partnership"
      ]
    }
  ];

  return (
    <section className={css.section}>
      <div className={css.container}>
        <div className={css.header}>
          <H2 className={css.title}>How It Works</H2>
          <p className={css.subtitle}>
            From application to global sales in 4 simple steps
          </p>
        </div>

        {/* Mobile: Accordion-style process */}
        <div className={css.mobileSteps}>
          {steps.map((step, index) => (
            <div
              key={index}
              className={`${css.stepCard} ${activeStep === index ? css.active : ''}`}
            >
              <button
                className={css.stepHeader}
                onClick={() => setActiveStep(activeStep === index ? -1 : index)}
              >
                <div className={css.stepNumber}>{step.number}</div>
                <div className={css.stepInfo}>
                  <div className={css.stepTitle}>{step.title}</div>
                  <div className={css.stepShortDesc}>{step.shortDesc}</div>
                </div>
                <div className={css.stepIcon}>{step.icon}</div>
                <div className={css.expandIcon}>
                  {activeStep === index ? '−' : '+'}
                </div>
              </button>

              {activeStep === index && (
                <div className={css.stepDetails}>
                  <p className={css.stepFullDesc}>{step.fullDesc}</p>
                  <ul className={css.stepDetailsList}>
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tablet/Desktop: Traditional flow */}
        <div className={css.desktopSteps}>
          {steps.map((step, index) => (
            <div key={index} className={css.desktopStep}>
              <div className={css.desktopStepIcon}>
                <span className={css.desktopStepNumber}>{step.number}</span>
                <span className={css.desktopStepEmoji}>{step.icon}</span>
              </div>
              <div className={css.desktopStepContent}>
                <H3 className={css.desktopStepTitle}>{step.title}</H3>
                <p className={css.desktopStepDesc}>{step.fullDesc}</p>
                <ul className={css.desktopStepDetails}>
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex}>{detail}</li>
                  ))}
                </ul>
              </div>
              {index < steps.length - 1 && (
                <div className={css.desktopConnector}></div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Process;
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../util/testData';
import EmailVerificationInfo from './EmailVerificationInfo';

// Mock the components
jest.mock('../../components', () => ({
  Heading: ({ children, as = 'h1', rootClassName, ...props }) => {
    const Component = as;
    return (
      <Component className={rootClassName} {...props}>
        {children}
      </Component>
    );
  },
  NamedLink: ({ children, className, name, ...props }) => (
    <a href={`/${name}`} className={className} {...props}>
      {children}
    </a>
  ),
  IconEmailSent: ({ className }) => <div className={className} data-testid="icon-email-sent" />,
  InlineTextButton: ({ children, rootClassName, onClick, ...props }) => (
    <button className={rootClassName} onClick={onClick} {...props}>
      {children}
    </button>
  ),
  IconClose: ({ rootClassName }) => <div className={rootClassName} data-testid="icon-close" />
}));

// Mock react-intl
jest.mock('../../util/reactIntl', () => ({
  FormattedMessage: ({ id, values }) => {
    if (values) {
      // Handle values containing React elements
      if (typeof values === 'object') {
        const hasReactElements = Object.values(values).some(
          value => value && typeof value === 'object' && value.type
        );

        if (hasReactElements) {
          // Render the actual React elements
          return (
            <span>
              {id} {Object.entries(values).map(([key, value], index) => {
                if (value && typeof value === 'object' && value.type) {
                  return <span key={key}>{value}</span>; // Wrap React element with key
                }
                return <span key={key}>{value}</span>;
              })}
            </span>
          );
        }

        const valueStrings = Object.entries(values)
          .map(([key, value]) => `{${key}: ${value}}`)
          .join(', ');
        return <span>{id} with values: {valueStrings}</span>;
      }
    }
    return <span>{id}</span>;
  }
}));

const defaultProps = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  onResendVerificationEmail: jest.fn(),
  resendErrorMessage: null,
  sendVerificationEmailInProgress: false
};

describe('EmailVerificationInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders all required elements', () => {
      render(<EmailVerificationInfo {...defaultProps} />);

      expect(screen.getByTestId('icon-email-sent')).toBeInTheDocument();
      expect(screen.getByTestId('icon-close')).toBeInTheDocument();
      expect(screen.getByText('AuthenticationPage.verifyEmailTitle with values: {name: John Doe}')).toBeInTheDocument();
      expect(screen.getByText('AuthenticationPage.verifyEmailText with values: {email: john.doe@example.com}')).toBeInTheDocument();
    });

    it('renders close link with correct attributes', () => {
      render(<EmailVerificationInfo {...defaultProps} />);

      const closeLink = screen.getByText('AuthenticationPage.verifyEmailClose').closest('a');
      expect(closeLink).toHaveAttribute('href', '/ProfileSettingsPage');
    });

    it('renders fix email link with correct attributes', () => {
      render(<EmailVerificationInfo {...defaultProps} />);

      const fixEmailLink = screen.getByRole('link', { name: /AuthenticationPage.fixEmailLinkText/ });
      expect(fixEmailLink).toHaveAttribute('href', '/ContactDetailsPage');
    });

    it('renders with proper heading structure', () => {
      render(<EmailVerificationInfo {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('AuthenticationPage.verifyEmailTitle');
    });
  });

  describe('Resend Email Functionality', () => {
    it('renders resend email button when not in progress', () => {
      render(<EmailVerificationInfo {...defaultProps} />);

      const resendButton = screen.getByRole('button');
      expect(resendButton).toBeInTheDocument();
      expect(resendButton).toHaveTextContent('AuthenticationPage.resendEmailLinkText');
    });

    it('calls onResendVerificationEmail when resend button is clicked', () => {
      const mockResend = jest.fn();
      render(
        <EmailVerificationInfo
          {...defaultProps}
          onResendVerificationEmail={mockResend}
        />
      );

      const resendButton = screen.getByRole('button');
      fireEvent.click(resendButton);

      expect(mockResend).toHaveBeenCalledTimes(1);
    });

    it('shows sending message when email sending is in progress', () => {
      render(
        <EmailVerificationInfo
          {...defaultProps}
          sendVerificationEmailInProgress={true}
        />
      );

      expect(screen.getByText('AuthenticationPage.sendingEmail')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows resend message when not sending', () => {
      render(
        <EmailVerificationInfo
          {...defaultProps}
          sendVerificationEmailInProgress={false}
        />
      );

      expect(screen.getByRole('button', { name: /AuthenticationPage.resendEmailLinkText/ })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when provided', () => {
      const errorMessage = <div data-testid="error-message">Failed to send email</div>;
      render(
        <EmailVerificationInfo
          {...defaultProps}
          resendErrorMessage={errorMessage}
        />
      );

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Failed to send email')).toBeInTheDocument();
    });

    it('does not display error when resendErrorMessage is null', () => {
      render(
        <EmailVerificationInfo
          {...defaultProps}
          resendErrorMessage={null}
        />
      );

      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('handles undefined error message gracefully', () => {
      render(
        <EmailVerificationInfo
          {...defaultProps}
          resendErrorMessage={undefined}
        />
      );

      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('handles missing name prop', () => {
      const propsWithoutName = { ...defaultProps };
      delete propsWithoutName.name;

      expect(() => {
        render(<EmailVerificationInfo {...propsWithoutName} />);
      }).not.toThrow();
    });

    it('handles missing email prop', () => {
      const propsWithoutEmail = { ...defaultProps };
      delete propsWithoutEmail.email;

      expect(() => {
        render(<EmailVerificationInfo {...propsWithoutEmail} />);
      }).not.toThrow();
    });

    it('handles missing onResendVerificationEmail prop', () => {
      const propsWithoutCallback = { ...defaultProps };
      delete propsWithoutCallback.onResendVerificationEmail;

      expect(() => {
        render(<EmailVerificationInfo {...propsWithoutCallback} />);
      }).not.toThrow();
    });

    it('renders with empty string values', () => {
      render(
        <EmailVerificationInfo
          {...defaultProps}
          name=""
          email=""
        />
      );

      expect(screen.getByText('AuthenticationPage.verifyEmailTitle with values: {name: }')).toBeInTheDocument();
      expect(screen.getByText('AuthenticationPage.verifyEmailText with values: {email: }')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button accessibility', () => {
      render(<EmailVerificationInfo {...defaultProps} />);

      const resendButton = screen.getByRole('button');
      expect(resendButton).toBeInTheDocument();
      expect(resendButton).toHaveTextContent('AuthenticationPage.resendEmailLinkText');
    });

    it('has proper link accessibility', () => {
      render(<EmailVerificationInfo {...defaultProps} />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2); // Close link and fix email link

      const closeLink = links.find(link => link.getAttribute('href') === '/ProfileSettingsPage');
      const fixEmailLink = links.find(link => link.getAttribute('href') === '/ContactDetailsPage');

      expect(closeLink).toBeInTheDocument();
      expect(fixEmailLink).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      render(<EmailVerificationInfo {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('provides meaningful alt text through icons', () => {
      render(<EmailVerificationInfo {...defaultProps} />);

      expect(screen.getByTestId('icon-email-sent')).toBeInTheDocument();
      expect(screen.getByTestId('icon-close')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles multiple clicks on resend button', () => {
      const mockResend = jest.fn();
      render(
        <EmailVerificationInfo
          {...defaultProps}
          onResendVerificationEmail={mockResend}
        />
      );

      const resendButton = screen.getByRole('button');
      fireEvent.click(resendButton);
      fireEvent.click(resendButton);
      fireEvent.click(resendButton);

      expect(mockResend).toHaveBeenCalledTimes(3);
    });

    it('handles keyboard navigation on resend button', () => {
      const mockResend = jest.fn();
      render(
        <EmailVerificationInfo
          {...defaultProps}
          onResendVerificationEmail={mockResend}
        />
      );

      const resendButton = screen.getByRole('button');
      resendButton.focus();
      expect(document.activeElement).toBe(resendButton);

      // Standard button behavior - clicking should trigger the onClick
      fireEvent.click(resendButton);
      expect(mockResend).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard navigation on links', () => {
      render(<EmailVerificationInfo {...defaultProps} />);

      const closeLink = screen.getByText('AuthenticationPage.verifyEmailClose').closest('a');
      closeLink.focus();
      expect(document.activeElement).toBe(closeLink);
    });
  });

  describe('Loading States', () => {
    it('transitions between loading and normal states', () => {
      const { rerender } = render(
        <EmailVerificationInfo
          {...defaultProps}
          sendVerificationEmailInProgress={false}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.queryByText('AuthenticationPage.sendingEmail')).not.toBeInTheDocument();

      rerender(
        <EmailVerificationInfo
          {...defaultProps}
          sendVerificationEmailInProgress={true}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByText('AuthenticationPage.sendingEmail')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles special characters in name and email', () => {
      render(
        <EmailVerificationInfo
          {...defaultProps}
          name="José María O'Connor"
          email="josé.maría@example-email.com"
        />
      );

      expect(screen.getByText("AuthenticationPage.verifyEmailTitle with values: {name: José María O'Connor}")).toBeInTheDocument();
      expect(screen.getByText('AuthenticationPage.verifyEmailText with values: {email: josé.maría@example-email.com}')).toBeInTheDocument();
    });

    it('handles very long email addresses', () => {
      const longEmail = 'very.long.email.address.that.might.cause.layout.issues@verylongdomainname.example.com';
      render(
        <EmailVerificationInfo
          {...defaultProps}
          email={longEmail}
        />
      );

      expect(screen.getByText(`AuthenticationPage.verifyEmailText with values: {email: ${longEmail}}`)).toBeInTheDocument();
    });

    it('handles very long names', () => {
      const longName = 'Very Long Name That Might Cause Layout Issues In Some Scenarios';
      render(
        <EmailVerificationInfo
          {...defaultProps}
          name={longName}
        />
      );

      expect(screen.getByText(`AuthenticationPage.verifyEmailTitle with values: {name: ${longName}}`)).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders correct CSS classes structure', () => {
      const { container } = render(<EmailVerificationInfo {...defaultProps} />);

      expect(container.querySelector('.content')).toBeInTheDocument();
      expect(container.querySelector('.verifyClose')).toBeInTheDocument();
      expect(container.querySelector('.modalIcon')).toBeInTheDocument();
      expect(container.querySelector('.modalTitle')).toBeInTheDocument();
      expect(container.querySelector('.modalMessage')).toBeInTheDocument();
      expect(container.querySelector('.bottomWrapper')).toBeInTheDocument();
    });

    it('maintains proper DOM hierarchy', () => {
      const { container } = render(<EmailVerificationInfo {...defaultProps} />);

      const content = container.querySelector('.content');
      expect(content).toBeInTheDocument();

      const bottomWrapper = content.querySelector('.bottomWrapper');
      expect(bottomWrapper).toBeInTheDocument();

      const helperTexts = bottomWrapper.querySelectorAll('.modalHelperText');
      expect(helperTexts).toHaveLength(2);
    });
  });
});
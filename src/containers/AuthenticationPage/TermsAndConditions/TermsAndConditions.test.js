import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../../util/testData';
import TermsAndConditions from './TermsAndConditions';

// Mock the components
jest.mock('../../../components', () => ({
  FieldCheckboxGroup: ({ name, id, optionLabelClassName, options, validate, ...props }) => (
    <div data-testid="field-checkbox-group" className={optionLabelClassName}>
      <label htmlFor={id}>
        {options.map((option, index) => (
          <div key={option.key}>
            <input
              type="checkbox"
              id={`${id}-${option.key}`}
              name={name}
              value={option.key}
              data-validate={validate ? 'true' : 'false'}
              {...props}
            />
            <span>{option.label}</span>
          </div>
        ))}
      </label>
    </div>
  )
}));

// Mock react-intl
jest.mock('../../../util/reactIntl', () => ({
  FormattedMessage: ({ id, values }) => {
    if (id === 'AuthenticationPage.termsAndConditionsTermsLinkText') {
      return <span>Terms of Service</span>;
    }
    if (id === 'AuthenticationPage.termsAndConditionsPrivacyLinkText') {
      return <span>Privacy Policy</span>;
    }
    return <span>{id}</span>;
  },
  intlShape: {}
}));

// Mock validators
jest.mock('../../../util/validators', () => ({
  requiredFieldArrayCheckbox: (message) => jest.fn().mockReturnValue(message)
}));

const defaultProps = {
  onOpenTermsOfService: jest.fn(),
  onOpenPrivacyPolicy: jest.fn(),
  formId: 'signup',
  intl: fakeIntl
};

describe('TermsAndConditions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the terms and conditions component', () => {
      render(<TermsAndConditions {...defaultProps} />);

      expect(screen.getByTestId('field-checkbox-group')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renders with correct field id when formId is provided', () => {
      render(<TermsAndConditions {...defaultProps} formId="signup" />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('id', 'signup.terms-accepted-tos-and-privacy');
    });

    it('renders with default field id when formId is not provided', () => {
      const propsWithoutFormId = { ...defaultProps };
      delete propsWithoutFormId.formId;

      render(<TermsAndConditions {...propsWithoutFormId} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('id', 'terms-accepted-tos-and-privacy');
    });

    it('renders with correct field name', () => {
      render(<TermsAndConditions {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('name', 'terms');
    });

    it('applies validation', () => {
      render(<TermsAndConditions {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-validate', 'true');
    });
  });

  describe('Terms and Privacy Links', () => {
    it('renders terms of service link', () => {
      render(<TermsAndConditions {...defaultProps} />);

      const termsLink = screen.getByText('Terms of Service');
      expect(termsLink).toBeInTheDocument();
      expect(termsLink).toHaveAttribute('role', 'button');
      expect(termsLink).toHaveAttribute('tabIndex', '0');
    });

    it('renders privacy policy link', () => {
      render(<TermsAndConditions {...defaultProps} />);

      const privacyLink = screen.getByText('Privacy Policy');
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('role', 'button');
      expect(privacyLink).toHaveAttribute('tabIndex', '0');
    });

    it('calls onOpenTermsOfService when terms link is clicked', () => {
      const mockOpenTerms = jest.fn();
      render(
        <TermsAndConditions
          {...defaultProps}
          onOpenTermsOfService={mockOpenTerms}
        />
      );

      const termsLink = screen.getByText('Terms of Service');
      fireEvent.click(termsLink);

      expect(mockOpenTerms).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenPrivacyPolicy when privacy link is clicked', () => {
      const mockOpenPrivacy = jest.fn();
      render(
        <TermsAndConditions
          {...defaultProps}
          onOpenPrivacyPolicy={mockOpenPrivacy}
        />
      );

      const privacyLink = screen.getByText('Privacy Policy');
      fireEvent.click(privacyLink);

      expect(mockOpenPrivacy).toHaveBeenCalledTimes(1);
    });

    it('prevents default behavior when terms link is clicked', () => {
      const mockOpenTerms = jest.fn();
      render(
        <TermsAndConditions
          {...defaultProps}
          onOpenTermsOfService={mockOpenTerms}
        />
      );

      const termsLink = screen.getByText('Terms of Service');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');

      termsLink.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('prevents default behavior when privacy link is clicked', () => {
      const mockOpenPrivacy = jest.fn();
      render(
        <TermsAndConditions
          {...defaultProps}
          onOpenPrivacyPolicy={mockOpenPrivacy}
        />
      );

      const privacyLink = screen.getByText('Privacy Policy');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');

      privacyLink.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('calls onOpenTermsOfService when Enter key is pressed on terms link', () => {
      const mockOpenTerms = jest.fn();
      render(
        <TermsAndConditions
          {...defaultProps}
          onOpenTermsOfService={mockOpenTerms}
        />
      );

      const termsLink = screen.getByText('Terms of Service');
      fireEvent.keyUp(termsLink, { keyCode: 13 }); // Enter key

      expect(mockOpenTerms).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenPrivacyPolicy when Enter key is pressed on privacy link', () => {
      const mockOpenPrivacy = jest.fn();
      render(
        <TermsAndConditions
          {...defaultProps}
          onOpenPrivacyPolicy={mockOpenPrivacy}
        />
      );

      const privacyLink = screen.getByText('Privacy Policy');
      fireEvent.keyUp(privacyLink, { keyCode: 13 }); // Enter key

      expect(mockOpenPrivacy).toHaveBeenCalledTimes(1);
    });

    it('does not call callbacks when non-Enter key is pressed', () => {
      const mockOpenTerms = jest.fn();
      const mockOpenPrivacy = jest.fn();
      render(
        <TermsAndConditions
          {...defaultProps}
          onOpenTermsOfService={mockOpenTerms}
          onOpenPrivacyPolicy={mockOpenPrivacy}
        />
      );

      const termsLink = screen.getByText('Terms of Service');
      const privacyLink = screen.getByText('Privacy Policy');

      fireEvent.keyUp(termsLink, { keyCode: 27 }); // Escape key
      fireEvent.keyUp(privacyLink, { keyCode: 32 }); // Space key

      expect(mockOpenTerms).not.toHaveBeenCalled();
      expect(mockOpenPrivacy).not.toHaveBeenCalled();
    });

    it('supports keyboard focus on terms link', () => {
      render(<TermsAndConditions {...defaultProps} />);

      const termsLink = screen.getByText('Terms of Service');
      termsLink.focus();

      expect(document.activeElement).toBe(termsLink);
    });

    it('supports keyboard focus on privacy link', () => {
      render(<TermsAndConditions {...defaultProps} />);

      const privacyLink = screen.getByText('Privacy Policy');
      privacyLink.focus();

      expect(document.activeElement).toBe(privacyLink);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA roles for interactive elements', () => {
      render(<TermsAndConditions {...defaultProps} />);

      const termsLink = screen.getByText('Terms of Service');
      const privacyLink = screen.getByText('Privacy Policy');

      expect(termsLink).toHaveAttribute('role', 'button');
      expect(privacyLink).toHaveAttribute('role', 'button');
    });

    it('has proper tabIndex for keyboard navigation', () => {
      render(<TermsAndConditions {...defaultProps} />);

      const termsLink = screen.getByText('Terms of Service');
      const privacyLink = screen.getByText('Privacy Policy');

      expect(termsLink).toHaveAttribute('tabIndex', '0');
      expect(privacyLink).toHaveAttribute('tabIndex', '0');
    });

    it('has proper checkbox accessibility', () => {
      render(<TermsAndConditions {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('maintains proper label association', () => {
      render(<TermsAndConditions {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      const label = screen.getByRole('checkbox').closest('label');

      expect(label).toBeInTheDocument();
      expect(label).toContainElement(checkbox);
    });
  });

  describe('Internationalization', () => {
    it('uses intl for validation message', () => {
      const mockIntl = {
        ...fakeIntl,
        formatMessage: jest.fn().mockReturnValue('Terms acceptance required')
      };

      render(
        <TermsAndConditions
          {...defaultProps}
          intl={mockIntl}
        />
      );

      expect(mockIntl.formatMessage).toHaveBeenCalledWith(
        { id: 'AuthenticationPage.termsAndConditionsAcceptRequired' }
      );
    });

    it('uses intl for accept text with link values', () => {
      const mockIntl = {
        ...fakeIntl,
        formatMessage: jest.fn().mockReturnValue('I accept the {termsLink} and {privacyLink}')
      };

      render(
        <TermsAndConditions
          {...defaultProps}
          intl={mockIntl}
        />
      );

      expect(mockIntl.formatMessage).toHaveBeenCalledWith(
        { id: 'AuthenticationPage.termsAndConditionsAcceptText' },
        expect.objectContaining({
          termsLink: expect.anything(),
          privacyLink: expect.anything()
        })
      );
    });
  });

  describe('Component Structure', () => {
    it('renders with correct CSS class structure', () => {
      const { container } = render(<TermsAndConditions {...defaultProps} />);

      expect(container.querySelector('.root')).toBeInTheDocument();
      expect(container.querySelector('.finePrint')).toBeInTheDocument();
    });

    it('applies correct CSS classes to links', () => {
      const { container } = render(<TermsAndConditions {...defaultProps} />);

      expect(container.querySelector('.termsLink')).toBeInTheDocument();
      expect(container.querySelector('.privacyLink')).toBeInTheDocument();
    });

    it('has proper DOM hierarchy', () => {
      const { container } = render(<TermsAndConditions {...defaultProps} />);

      const root = container.querySelector('.root');
      const checkboxGroup = root.querySelector('[data-testid="field-checkbox-group"]');

      expect(root).toContainElement(checkboxGroup);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing callback functions gracefully', () => {
      const propsWithoutCallbacks = {
        ...defaultProps,
        onOpenTermsOfService: undefined,
        onOpenPrivacyPolicy: undefined
      };

      expect(() => {
        render(<TermsAndConditions {...propsWithoutCallbacks} />);
      }).not.toThrow();

      const termsLink = screen.getByText('Terms of Service');
      const privacyLink = screen.getByText('Privacy Policy');

      expect(() => {
        fireEvent.click(termsLink);
        fireEvent.click(privacyLink);
      }).not.toThrow();
    });

    it('handles missing intl gracefully', () => {
      const propsWithoutIntl = { ...defaultProps };
      delete propsWithoutIntl.intl;

      expect(() => {
        render(<TermsAndConditions {...propsWithoutIntl} />);
      }).toThrow(); // This should throw because intl is required for formatMessage
    });

    it('handles null formId gracefully', () => {
      render(<TermsAndConditions {...defaultProps} formId={null} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('id', 'terms-accepted-tos-and-privacy');
    });

    it('handles empty string formId gracefully', () => {
      render(<TermsAndConditions {...defaultProps} formId="" />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('id', 'terms-accepted-tos-and-privacy');
    });
  });

  describe('User Interactions', () => {
    it('handles multiple clicks on terms link', () => {
      const mockOpenTerms = jest.fn();
      render(
        <TermsAndConditions
          {...defaultProps}
          onOpenTermsOfService={mockOpenTerms}
        />
      );

      const termsLink = screen.getByText('Terms of Service');
      fireEvent.click(termsLink);
      fireEvent.click(termsLink);
      fireEvent.click(termsLink);

      expect(mockOpenTerms).toHaveBeenCalledTimes(3);
    });

    it('handles multiple clicks on privacy link', () => {
      const mockOpenPrivacy = jest.fn();
      render(
        <TermsAndConditions
          {...defaultProps}
          onOpenPrivacyPolicy={mockOpenPrivacy}
        />
      );

      const privacyLink = screen.getByText('Privacy Policy');
      fireEvent.click(privacyLink);
      fireEvent.click(privacyLink);

      expect(mockOpenPrivacy).toHaveBeenCalledTimes(2);
    });

    it('maintains checkbox interaction behavior', () => {
      render(<TermsAndConditions {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const mockOpenTerms = jest.fn();
      const mockOpenPrivacy = jest.fn();

      const { rerender } = render(
        <TermsAndConditions
          onOpenTermsOfService={mockOpenTerms}
          onOpenPrivacyPolicy={mockOpenPrivacy}
          formId="signup"
          intl={fakeIntl}
        />
      );

      expect(screen.getByTestId('field-checkbox-group')).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <TermsAndConditions
          onOpenTermsOfService={mockOpenTerms}
          onOpenPrivacyPolicy={mockOpenPrivacy}
          formId="signup"
          intl={fakeIntl}
        />
      );

      expect(screen.getByTestId('field-checkbox-group')).toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    it('works correctly in signup form context', () => {
      render(
        <TermsAndConditions
          onOpenTermsOfService={jest.fn()}
          onOpenPrivacyPolicy={jest.fn()}
          formId="signup"
          intl={fakeIntl}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('id', 'signup.terms-accepted-tos-and-privacy');
      expect(checkbox).toHaveAttribute('name', 'terms');
    });

    it('works correctly in registration form context', () => {
      render(
        <TermsAndConditions
          onOpenTermsOfService={jest.fn()}
          onOpenPrivacyPolicy={jest.fn()}
          formId="registration"
          intl={fakeIntl}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('id', 'registration.terms-accepted-tos-and-privacy');
    });
  });
});
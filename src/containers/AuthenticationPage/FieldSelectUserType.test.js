import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Form as FinalForm } from 'react-final-form';

import { fakeIntl } from '../../util/testData';
import FieldSelectUserType from './FieldSelectUserType';

// Mock the FieldSelect component
jest.mock('../../components', () => ({
  FieldSelect: ({ children, label, id, name, className, validate, ...props }) => (
    <div data-testid="field-select" className={className}>
      <label htmlFor={id}>{label}</label>
      <select id={id} name={name} {...props}>
        {children}
      </select>
    </div>
  )
}));

const defaultProps = {
  name: 'userType',
  intl: fakeIntl
};

const mockUserTypes = [
  {
    userType: 'customer',
    label: 'Customer'
  },
  {
    userType: 'provider',
    label: 'Provider'
  },
  {
    userType: 'admin',
    label: 'Administrator'
  }
];

const singleUserType = [
  {
    userType: 'customer',
    label: 'Customer'
  }
];

// Helper to wrap component in React Final Form
const renderWithForm = (component, formProps = {}) => {
  return render(
    <FinalForm
      onSubmit={() => {}}
      initialValues={{}}
      {...formProps}
    >
      {() => component}
    </FinalForm>
  );
};

describe('FieldSelectUserType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Multiple User Types Scenario', () => {
    it('renders select field when multiple user types exist and no existing user type', () => {
      renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={mockUserTypes}
          hasExistingUserType={false}
        />
      );

      expect(screen.getByTestId('field-select')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('FieldSelectUserType.label')).toBeInTheDocument();
    });

    it('renders all user type options', () => {
      renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={mockUserTypes}
          hasExistingUserType={false}
        />
      );

      const selectElement = screen.getByRole('combobox');

      // Should have placeholder plus all user types
      expect(selectElement.children).toHaveLength(4); // 1 placeholder + 3 user types

      expect(screen.getByText('FieldSelectUserType.placeholder')).toBeInTheDocument();
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Provider')).toBeInTheDocument();
      expect(screen.getByText('Administrator')).toBeInTheDocument();
    });

    it('has correct option values', () => {
      renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={mockUserTypes}
          hasExistingUserType={false}
        />
      );

      const options = screen.getAllByRole('option');

      expect(options[0]).toHaveValue(''); // Placeholder
      expect(options[1]).toHaveValue('customer');
      expect(options[2]).toHaveValue('provider');
      expect(options[3]).toHaveValue('admin');
    });

    it('disables placeholder option', () => {
      renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={mockUserTypes}
          hasExistingUserType={false}
        />
      );

      const placeholderOption = screen.getByText('FieldSelectUserType.placeholder').closest('option');
      expect(placeholderOption).toBeDisabled();
    });

    it('applies custom className correctly', () => {
      const customClass = 'custom-user-type-select';

      renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={mockUserTypes}
          hasExistingUserType={false}
          className={customClass}
        />
      );

      const fieldSelect = screen.getByTestId('field-select');
      expect(fieldSelect).toHaveClass(customClass);
    });

    it('applies rootClassName when provided', () => {
      const rootClass = 'root-user-type-select';

      renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={mockUserTypes}
          hasExistingUserType={false}
          rootClassName={rootClass}
        />
      );

      const fieldSelect = screen.getByTestId('field-select');
      expect(fieldSelect).toHaveClass(rootClass);
    });

    it('handles user type selection', () => {
      renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={mockUserTypes}
          hasExistingUserType={false}
        />
      );

      const selectElement = screen.getByRole('combobox');

      fireEvent.change(selectElement, { target: { value: 'provider' } });

      expect(selectElement.value).toBe('provider');
    });
  });

  describe('Single User Type Scenario', () => {
    it('renders hidden field when only one user type exists', () => {
      const { container } = renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={singleUserType}
          hasExistingUserType={false}
        />
      );

      // Should not render select field
      expect(screen.queryByTestId('field-select')).not.toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

      // Should render hidden input
      const hiddenInput = container.querySelector('input[type="hidden"]');
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveAttribute('name', 'userType');
    });

    it('renders hidden field when no user types provided', () => {
      const { container } = renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={[]}
          hasExistingUserType={false}
        />
      );

      expect(screen.queryByTestId('field-select')).not.toBeInTheDocument();
      const hiddenInput = container.querySelector('input[type="hidden"]');
      expect(hiddenInput).toBeInTheDocument();
    });

    it('renders hidden field when userTypes is undefined', () => {
      const { container } = renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={undefined}
          hasExistingUserType={false}
        />
      );

      expect(screen.queryByTestId('field-select')).not.toBeInTheDocument();
      const hiddenInput = container.querySelector('input[type="hidden"]');
      expect(hiddenInput).toBeInTheDocument();
    });
  });

  describe('Existing User Type Scenario', () => {
    it('renders hidden field when user already has existing user type', () => {
      const { container } = renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={mockUserTypes}
          hasExistingUserType={true}
        />
      );

      // Should not render select field even with multiple user types
      expect(screen.queryByTestId('field-select')).not.toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

      // Should render hidden input
      const hiddenInput = container.querySelector('input[type="hidden"]');
      expect(hiddenInput).toBeInTheDocument();
    });
  });

  describe('Form Integration', () => {
    it('integrates with React Final Form correctly', () => {
      const onSubmit = jest.fn();

      render(
        <FinalForm
          onSubmit={onSubmit}
          initialValues={{ userType: 'customer' }}
        >
          {({ handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <FieldSelectUserType
                {...defaultProps}
                userTypes={mockUserTypes}
                hasExistingUserType={false}
              />
              <button type="submit">Submit</button>
            </form>
          )}
        </FinalForm>
      );

      const selectElement = screen.getByRole('combobox');
      const submitButton = screen.getByRole('button', { name: 'Submit' });

      // Change selection
      fireEvent.change(selectElement, { target: { value: 'provider' } });

      // Submit form
      fireEvent.click(submitButton);

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          userType: 'provider'
        }),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('validates required field when no selection made', () => {
      render(
        <FinalForm
          onSubmit={() => {}}
          initialValues={{}}
        >
          {({ handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <FieldSelectUserType
                {...defaultProps}
                userTypes={mockUserTypes}
                hasExistingUserType={false}
              />
              <button type="submit">Submit</button>
            </form>
          )}
        </FinalForm>
      );

      const submitButton = screen.getByRole('button', { name: 'Submit' });

      // Try to submit without selection
      fireEvent.click(submitButton);

      // Should show validation error
      expect(screen.getByText('FieldSelectUserType.required')).toBeInTheDocument();
    });

    it('passes validation when user type is selected', () => {
      render(
        <FinalForm
          onSubmit={() => {}}
          initialValues={{}}
        >
          {({ handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <FieldSelectUserType
                {...defaultProps}
                userTypes={mockUserTypes}
                hasExistingUserType={false}
              />
              <button type="submit">Submit</button>
            </form>
          )}
        </FinalForm>
      );

      const selectElement = screen.getByRole('combobox');
      const submitButton = screen.getByRole('button', { name: 'Submit' });

      // Select a user type
      fireEvent.change(selectElement, { target: { value: 'customer' } });

      // Submit form
      fireEvent.click(submitButton);

      // Should not show validation error
      expect(screen.queryByText('FieldSelectUserType.required')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper label association', () => {
      renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={mockUserTypes}
          hasExistingUserType={false}
        />
      );

      const selectElement = screen.getByRole('combobox');
      const label = screen.getByText('FieldSelectUserType.label');

      expect(selectElement).toHaveAccessibleName('FieldSelectUserType.label');
      expect(label.getAttribute('for')).toBe(selectElement.id);
    });

    it('has correct semantic structure', () => {
      renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={mockUserTypes}
          hasExistingUserType={false}
        />
      );

      const selectElement = screen.getByRole('combobox');
      const options = screen.getAllByRole('option');

      expect(selectElement).toBeInTheDocument();
      expect(options).toHaveLength(4); // 1 placeholder + 3 user types
    });

    it('supports keyboard navigation', () => {
      renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={mockUserTypes}
          hasExistingUserType={false}
        />
      );

      const selectElement = screen.getByRole('combobox');

      // Focus the select element
      selectElement.focus();
      expect(document.activeElement).toBe(selectElement);

      // Test arrow key navigation
      fireEvent.keyDown(selectElement, { key: 'ArrowDown' });
      expect(selectElement.value).toBe('customer');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty userTypes array gracefully', () => {
      const { container } = renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={[]}
          hasExistingUserType={false}
        />
      );

      expect(screen.queryByTestId('field-select')).not.toBeInTheDocument();
      const hiddenInput = container.querySelector('input[type="hidden"]');
      expect(hiddenInput).toBeInTheDocument();
    });

    it('handles null userTypes gracefully', () => {
      const { container } = renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={null}
          hasExistingUserType={false}
        />
      );

      expect(screen.queryByTestId('field-select')).not.toBeInTheDocument();
      const hiddenInput = container.querySelector('input[type="hidden"]');
      expect(hiddenInput).toBeInTheDocument();
    });

    it('handles userTypes with missing labels', () => {
      const userTypesWithMissingLabels = [
        { userType: 'customer', label: 'Customer' },
        { userType: 'provider' }, // Missing label
        { userType: 'admin', label: 'Administrator' }
      ];

      renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={userTypesWithMissingLabels}
          hasExistingUserType={false}
        />
      );

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4); // Still renders all options
    });

    it('handles userTypes with duplicate userType values', () => {
      const duplicateUserTypes = [
        { userType: 'customer', label: 'Customer' },
        { userType: 'customer', label: 'Customer Duplicate' },
        { userType: 'provider', label: 'Provider' }
      ];

      renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={duplicateUserTypes}
          hasExistingUserType={false}
        />
      );

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4); // 1 placeholder + 3 user types (includes duplicate)
    });

    it('handles very long user type labels', () => {
      const longLabelUserTypes = [
        {
          userType: 'customer',
          label: 'Customer with a very long label that might cause layout issues in some scenarios'
        },
        { userType: 'provider', label: 'Provider' }
      ];

      renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={longLabelUserTypes}
          hasExistingUserType={false}
        />
      );

      expect(screen.getByText('Customer with a very long label that might cause layout issues in some scenarios')).toBeInTheDocument();
    });

    it('maintains field name consistency', () => {
      const customName = 'customUserType';

      const { container } = renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          name={customName}
          userTypes={mockUserTypes}
          hasExistingUserType={false}
        />
      );

      const selectElement = screen.getByRole('combobox');
      expect(selectElement).toHaveAttribute('name', customName);
      expect(selectElement).toHaveAttribute('id', customName);
    });

    it('maintains field name consistency for hidden input', () => {
      const customName = 'customUserType';

      const { container } = renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          name={customName}
          userTypes={singleUserType}
          hasExistingUserType={false}
        />
      );

      const hiddenInput = container.querySelector('input[type="hidden"]');
      expect(hiddenInput).toHaveAttribute('name', customName);
    });
  });

  describe('Component State Management', () => {
    it('preserves selection state during re-renders', () => {
      const { rerender } = renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={mockUserTypes}
          hasExistingUserType={false}
        />
      );

      const selectElement = screen.getByRole('combobox');
      fireEvent.change(selectElement, { target: { value: 'provider' } });

      // Re-render with same props
      rerender(
        <FinalForm onSubmit={() => {}} initialValues={{}}>
          {() => (
            <FieldSelectUserType
              {...defaultProps}
              userTypes={mockUserTypes}
              hasExistingUserType={false}
            />
          )}
        </FinalForm>
      );

      // Selection should be preserved
      expect(screen.getByRole('combobox')).toHaveValue('provider');
    });

    it('switches between select and hidden field correctly', () => {
      const { rerender, container } = renderWithForm(
        <FieldSelectUserType
          {...defaultProps}
          userTypes={mockUserTypes}
          hasExistingUserType={false}
        />
      );

      // Initially shows select field
      expect(screen.getByTestId('field-select')).toBeInTheDocument();
      expect(container.querySelector('input[type="hidden"]')).not.toBeInTheDocument();

      // Re-render with hasExistingUserType = true
      rerender(
        <FinalForm onSubmit={() => {}} initialValues={{}}>
          {() => (
            <FieldSelectUserType
              {...defaultProps}
              userTypes={mockUserTypes}
              hasExistingUserType={true}
            />
          )}
        </FinalForm>
      );

      // Now shows hidden field
      expect(screen.queryByTestId('field-select')).not.toBeInTheDocument();
      expect(container.querySelector('input[type="hidden"]')).toBeInTheDocument();
    });
  });
});
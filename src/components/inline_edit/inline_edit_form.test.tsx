/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { render } from '../../test/rtl';
import { requiredProps } from '../../test/required_props';
import { fireEvent, act, waitFor } from '@testing-library/react';

import {
  EuiInlineEditForm,
  EuiInlineEditFormProps,
  SMALL_SIZE_FORM,
  MEDIUM_SIZE_FORM,
} from './inline_edit_form';

describe('EuiInlineEditForm', () => {
  const commonInlineEditFormProps: EuiInlineEditFormProps = {
    ...requiredProps,
    defaultValue: 'Hello World!',
    inputAriaLabel: 'Edit inline',
    sizes: MEDIUM_SIZE_FORM,
    children: (readModeValue) => readModeValue,
  };

  describe('read mode', () => {
    it('renders', () => {
      const { container } = render(
        <EuiInlineEditForm {...commonInlineEditFormProps} />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    test('isReadOnly', () => {
      const { container, getByTestSubject } = render(
        <EuiInlineEditForm
          isReadOnly={true}
          startWithEditOpen={true}
          {...commonInlineEditFormProps}
        />
      );

      expect(container.firstChild).toMatchSnapshot();

      expect(getByTestSubject('euiInlineReadModeButton')).toBeDisabled();
    });

    test('readModeProps', () => {
      const { container, getByTestSubject } = render(
        <EuiInlineEditForm
          {...commonInlineEditFormProps}
          readModeProps={{
            color: 'primary',
            iconSide: 'left',
          }}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
      expect(getByTestSubject('euiInlineReadModeButton')).toBeTruthy();
    });

    test('sizes', () => {
      const { container } = render(
        <EuiInlineEditForm
          {...commonInlineEditFormProps}
          sizes={SMALL_SIZE_FORM}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('edit mode', () => {
    it('renders', () => {
      const { container } = render(
        <EuiInlineEditForm
          {...commonInlineEditFormProps}
          startWithEditOpen={true}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    test('editModeProps.inputProps', () => {
      const onChange = jest.fn();

      const { container, getByTestSubject } = render(
        <EuiInlineEditForm
          {...commonInlineEditFormProps}
          startWithEditOpen={true}
          editModeProps={{
            inputProps: {
              prepend: 'Prepend Example',
              'data-test-subj': 'customInput',
              onChange,
            },
          }}
        />
      );
      expect(container.firstChild).toMatchSnapshot();

      const mockChangeEvent = { target: { value: 'changed' } };
      fireEvent.change(getByTestSubject('customInput'), mockChangeEvent);
      expect(onChange).toHaveBeenCalled();

      // Consumer `onChange` callbacks should not override EUI's
      expect(
        (getByTestSubject('customInput') as HTMLInputElement).value
      ).toEqual('changed');
    });

    test('editModeProps.formRowProps', () => {
      const { container, getByTestSubject } = render(
        <EuiInlineEditForm
          {...commonInlineEditFormProps}
          startWithEditOpen={true}
          editModeProps={{
            formRowProps: {
              error: ['This is an error'],
              'data-test-subj': 'customErrorText',
            },
          }}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
      expect(getByTestSubject('customErrorText')).toBeTruthy();
    });

    test('editModeProps.saveButtonProps', () => {
      const { container, getByLabelText } = render(
        <EuiInlineEditForm
          {...commonInlineEditFormProps}
          startWithEditOpen={true}
          editModeProps={{
            saveButtonProps: {
              'aria-label': "Yes! Let's save.",
              color: 'primary',
            },
          }}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
      expect(getByLabelText("Yes! Let's save.")).toBeTruthy();
    });

    test('editModeProps.cancelButtonProps', () => {
      const { container, getByLabelText } = render(
        <EuiInlineEditForm
          {...commonInlineEditFormProps}
          startWithEditOpen={true}
          editModeProps={{
            cancelButtonProps: {
              'aria-label': 'Uh no. Do not save.',
              disabled: true,
            },
          }}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
      expect(getByLabelText('Uh no. Do not save.')).toBeDisabled();
    });

    test('isLoading', () => {
      const { container, queryByTestSubject } = render(
        <EuiInlineEditForm
          {...commonInlineEditFormProps}
          startWithEditOpen={true}
          isLoading={true}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
      expect(container.querySelectorAll('.euiSkeletonRectangle')).toHaveLength(
        2
      );
      expect(queryByTestSubject('euiInlineEditModeSaveButton')).toBeFalsy();
      expect(queryByTestSubject('euiInlineEditModeCancelButton')).toBeFalsy();
    });

    test('isInvalid', () => {
      const { container, getByTestSubject } = render(
        <EuiInlineEditForm
          {...commonInlineEditFormProps}
          startWithEditOpen={true}
          isInvalid={true}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
      expect(
        getByTestSubject('euiInlineEditModeInput').hasAttribute('aria-invalid')
      ).toBeTruthy();
    });
  });

  describe('toggling between read mode and edit mode', () => {
    jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: Function) => cb());

    const onClick = jest.fn();
    const onSave = jest.fn();
    beforeEach(() => {
      onClick.mockReset();
      onSave.mockReset();
    });

    it('activates edit mode when the read mode button is clicked', () => {
      const { getByTestSubject, queryByTestSubject } = render(
        <EuiInlineEditForm
          {...commonInlineEditFormProps}
          readModeProps={{ onClick }}
        />
      );

      fireEvent.click(getByTestSubject('euiInlineReadModeButton'));

      expect(queryByTestSubject('euiInlineReadModeButton')).toBeFalsy();
      waitFor(() => {
        expect(document.activeElement).toEqual(
          getByTestSubject('euiInlineEditModeInput')
        );
      });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('saves text and returns to read mode', () => {
      const { getByTestSubject, getByText } = render(
        <EuiInlineEditForm
          {...commonInlineEditFormProps}
          startWithEditOpen={true}
          onSave={onSave}
          editModeProps={{ saveButtonProps: { onClick } }} // Consumers might call this over onSave for, e.g. tracking invalid vs valid saves
        />
      );

      fireEvent.change(getByTestSubject('euiInlineEditModeInput'), {
        target: { value: 'New message!' },
      });
      expect(
        getByTestSubject('euiInlineEditModeInput').getAttribute('value')
      ).toEqual('New message!');
      fireEvent.click(getByTestSubject('euiInlineEditModeSaveButton'));

      waitFor(() => {
        expect(document.activeElement).toEqual(
          getByTestSubject('euiInlineReadModeButton')
        );
      });
      expect(getByText('New message!')).toBeTruthy();
      expect(onSave).toHaveBeenCalledWith('New message!');
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('cancels text and returns to read mode', () => {
      const { getByTestSubject, getByText } = render(
        <EuiInlineEditForm
          {...commonInlineEditFormProps}
          startWithEditOpen={true}
          onSave={onSave}
          editModeProps={{ cancelButtonProps: { onClick } }}
        />
      );

      fireEvent.change(getByTestSubject('euiInlineEditModeInput'), {
        target: { value: 'New message!' },
      });
      expect(
        getByTestSubject('euiInlineEditModeInput').getAttribute('value')
      ).toEqual('New message!');
      fireEvent.click(getByTestSubject('euiInlineEditModeCancelButton'));

      waitFor(() => {
        expect(document.activeElement).toEqual(
          getByTestSubject('euiInlineReadModeButton')
        );
      });
      expect(getByText('Hello World!')).toBeTruthy();
      expect(onSave).not.toHaveBeenCalled();
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    describe('onSave validation', () => {
      it('returns to read mode with updated text when onSave returns true', () => {
        onSave.mockReturnValueOnce(true);

        const { getByTestSubject, getByText } = render(
          <EuiInlineEditForm
            {...commonInlineEditFormProps}
            startWithEditOpen={true}
            onSave={onSave}
          />
        );

        fireEvent.change(getByTestSubject('euiInlineEditModeInput'), {
          target: { value: 'New message!' },
        });
        act(() => {
          fireEvent.click(getByTestSubject('euiInlineEditModeSaveButton'));
        });

        expect(getByTestSubject('euiInlineReadModeButton')).toBeTruthy();
        expect(getByText('New message!')).toBeTruthy();
      });

      it('stays in edit mode when onSave returns false', () => {
        onSave.mockReturnValueOnce(false);

        const { getByTestSubject, queryByTestSubject } = render(
          <EuiInlineEditForm
            {...commonInlineEditFormProps}
            startWithEditOpen={true}
            onSave={onSave}
          />
        );

        fireEvent.change(getByTestSubject('euiInlineEditModeInput'), {
          target: { value: 'New message!' },
        });
        act(() => {
          fireEvent.click(getByTestSubject('euiInlineEditModeSaveButton'));
        });

        expect(queryByTestSubject('euiInlineReadModeButton')).toBeFalsy();
        expect(getByTestSubject('euiInlineEditModeInput')).toBeTruthy();
      });

      it('handles async promises', async () => {
        onSave.mockImplementation(
          (value) =>
            new Promise((resolve) => {
              setTimeout(resolve, 100);
              return !!value; // returns false if empty string, true if not
            })
        );

        const { getByTestSubject, queryByTestSubject, getByText } = render(
          <EuiInlineEditForm
            {...commonInlineEditFormProps}
            startWithEditOpen={true}
            onSave={onSave}
          />
        );

        // Should still be in edit mode after an empty string is submitted
        fireEvent.change(getByTestSubject('euiInlineEditModeInput'), {
          target: { value: '' },
        });
        await act(async () => {
          fireEvent.click(getByTestSubject('euiInlineEditModeSaveButton'));
          waitFor(() => setTimeout(() => {}, 100)); // Let the promise finish resolving
        });
        expect(queryByTestSubject('euiInlineReadModeButton')).toBeFalsy();
        expect(getByTestSubject('euiInlineEditModeInput')).toBeTruthy();

        // Should successfully save into read mode
        fireEvent.change(getByTestSubject('euiInlineEditModeInput'), {
          target: { value: 'hey there' },
        });
        await act(async () => {
          fireEvent.click(getByTestSubject('euiInlineEditModeSaveButton'));
        });
        waitFor(() => {
          expect(getByTestSubject('euiInlineReadModeButton')).toBeTruthy();
          expect(getByText('hey there')).toBeTruthy();
        });
      });
    });

    describe('keyboard events', () => {
      test('pressing the Enter key saves text and returns to read mode', () => {
        const { getByTestSubject, getByText } = render(
          <EuiInlineEditForm
            {...commonInlineEditFormProps}
            startWithEditOpen={true}
          />
        );

        fireEvent.change(getByTestSubject('euiInlineEditModeInput'), {
          target: { value: 'New message!' },
        });
        fireEvent.keyDown(getByTestSubject('euiInlineEditModeInput'), {
          key: 'Enter',
        });

        waitFor(() => {
          expect(document.activeElement).toEqual(
            getByTestSubject('euiInlineReadModeButton')
          );
        });
        expect(getByText('New message!')).toBeTruthy();
      });

      test('pressing the Escape key cancels text changes and returns to read mode', () => {
        const { getByTestSubject, getByText } = render(
          <EuiInlineEditForm
            {...commonInlineEditFormProps}
            startWithEditOpen={true}
          />
        );

        fireEvent.change(getByTestSubject('euiInlineEditModeInput'), {
          target: { value: 'New message!' },
        });
        fireEvent.keyDown(getByTestSubject('euiInlineEditModeInput'), {
          key: 'Escape',
        });

        waitFor(() => {
          expect(document.activeElement).toEqual(
            getByTestSubject('euiInlineReadModeButton')
          );
        });
        expect(getByText('Hello World!')).toBeTruthy();
      });

      it('calls passed `inputModeProps.onKeyDown` callbacks', () => {
        const onKeyDown = jest.fn();

        const { getByTestSubject, getByText } = render(
          <EuiInlineEditForm
            {...commonInlineEditFormProps}
            startWithEditOpen={true}
            editModeProps={{ inputProps: { onKeyDown } }}
          />
        );

        fireEvent.change(getByTestSubject('euiInlineEditModeInput'), {
          target: { value: 'New message!' },
        });
        fireEvent.keyDown(getByTestSubject('euiInlineEditModeInput'), {
          key: 'Enter',
        });

        // Both EUI and consumer `onKeyDown` events should have run
        expect(onKeyDown).toHaveBeenCalled();
        expect(getByTestSubject('euiInlineReadModeButton')).toBeTruthy();
        expect(getByText('New message!')).toBeTruthy();
      });
    });
  });
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ListScreen from '../Components/ListScreen';

// Mock external dependencies
jest.mock('../firebaseConfig', () => ({
  database: jest.fn(),
}));

jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  get: jest.fn(() => Promise.resolve({ exists: jest.fn(() => true), val: jest.fn() })),
  onValue: jest.fn(),
  push: jest.fn(() => Promise.resolve({ key: 'newListKey' })),
  set: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

jest.mock('react-native-elements', () => ({
  CheckBox: ({ children }) => 'CheckBox-' + children,
}));

jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn().mockReturnValue(true),
}));

// Define your tests
describe('ListScreen', () => {
  it('renders the add list button correctly', () => {
    const { getByText } = render(<ListScreen />);
    expect(getByText('+ Add List')).toBeTruthy();
  });

  it('opens new list modal on pressing add list button', () => {
    const { getByText, getByPlaceholderText } = render(<ListScreen />);
    const addButton = getByText('+ Add List');
    fireEvent.press(addButton);
    expect(getByPlaceholderText('New List Name')).toBeTruthy();
  });

  it('renders list items when available', async () => {
    // Assuming your fetchLists function fetches an array of lists, you can mock it to return a specific value for testing
    const lists = {
      listId1: { name: 'Inbox' },
      listId2: { name: 'Work' },
    };

    jest.mock('../firebaseConfig', () => ({
      database: jest.fn(),
      ref: jest.fn().mockReturnValue({
        get: jest.fn(() => Promise.resolve({ exists: jest.fn(() => true), val: jest.fn(() => lists) })),
      }),
    }));

    const { findByText } = render(<ListScreen />);
    expect(await findByText('Inbox')).toBeTruthy();
    expect(await findByText('Work')).toBeTruthy();
  });

});

import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../Components/HomeScreen';

// Mock external dependencies
jest.mock('../firebaseConfig', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
  },
  database: jest.fn(),
}));

jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  onValue: jest.fn(() => ({
    then: jest.fn((callback) => callback({
      exists: jest.fn().mockReturnValue(true),
      val: jest.fn().mockReturnValue([]),
    })),
  })),
}));

jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn().mockReturnValue(true),
}));

jest.mock('../Components/Weather', () => () => 'WeatherComponent');
jest.mock('../Components/AddTask', () => () => 'AddTaskComponent');



describe('HomeScreen', () => {
  it('renders the weather component correctly', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('WeatherComponent')).toBeTruthy();
  });

  it('renders the overdue tasks title and button for expanding/collapsing the list', () => {
    const { getByText, getByTestId } = render(<HomeScreen />);
    expect(getByText('Overdue')).toBeTruthy();
    expect(getByTestId('expand-collapse-button')).toBeTruthy();
  });

  it('renders the AddTask component correctly', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('AddTaskComponent')).toBeTruthy();
  });

});

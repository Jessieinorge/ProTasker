import React from 'react';
import { render } from '@testing-library/react-native';
import CalendarScreen from '../Components/CalendarScreen';
import { Text } from 'react-native';

// Mock external dependencies
jest.mock('../firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'testUID',
    },
  },
  database: jest.fn(),
}));

//  mock for firebase/database
jest.mock('firebase/database', () => ({
  ref: jest.fn().mockReturnThis(),
  get: jest.fn(() => Promise.resolve({
    exists: jest.fn().mockReturnValue(true),
    val: jest.fn().mockReturnValue({
      task1: {
        title: 'Buy groceries',
        description:'asap',
        dueDate: '2023-03-15',
        status: 'uncompeleted',
        time:'00:00',
        priority:'High priority',
        list:'lisdId1'
      },
    }),
  })),
  update: jest.fn(),
}));

jest.mock('react-native-elements', () => ({
  CheckBox: () => 'CheckBox',
}));

jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn().mockReturnValue(true),
}));

jest.mock('react-native-calendars', () => ({
  Calendar: () => 'Calendar',
}));

// Adjusted mock for AddTask to include a wrapper component for Text
jest.mock('../Components/AddTask', () => {
  const MockAddTask = () => <MockText>Add Task</MockText>;
  return MockAddTask;
});
jest.mock('react-native-dropdown-picker', () => ({
    // Mock the necessary components or functions used from react-native-dropdown-picker
    default: jest.fn().mockReturnValue(null), // Mocking the default export
  }));
  
// Mock Text component
const MockText = ({ children }) => <Text>{children}</Text>;

// Mock internal components
jest.mock('../Components/EditTask', () => () => 'EditTask');

// Define the test suite for CalendarScreen
describe('CalendarScreen', () => {
  it('renders correctly', () => {
    // Render the CalendarScreen component
    const { getByText } = render(<CalendarScreen />);

    // Expect the "Add Task" text to be rendered, verifying the AddTask component is correctly mocked
    expect(getByText('Add Task')).toBeTruthy();
  });

});

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import App from '../App';
import { NavigationContainer } from '@react-navigation/native';

describe('App', () => {
  it('renders the bottom tab navigator with all screens accessible', () => {
    const { getByA11yLabel } = render(
      <NavigationContainer>
        <App />
      </NavigationContainer>
    );

    expect(getByA11yLabel('Calendar')).toBeTruthy();
    expect(getByA11yLabel('List')).toBeTruthy();
    expect(getByA11yLabel('Today')).toBeTruthy();
    expect(getByA11yLabel('Pomodoro')).toBeTruthy();
    expect(getByA11yLabel('Filter')).toBeTruthy();
  });

  it('opens and closes the login overlay correctly', () => {
    const { getByText, getByA11yRole } = render(<App />);
    fireEvent.press(getByA11yRole('button', { name: 'Login' }));
    expect(getByText('LoginScreen')).toBeTruthy(); 
    fireEvent.press(getByText('X'));
  });

});

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PomodoroScreen from '../Components/PomodoroScreen';

describe('PomodoroScreen', () => {
  it('renders timer display and control icons correctly', () => {
    const { getByText, getByA11yLabel } = render(<PomodoroScreen />);
    // Check if the initial timer is set to 25:00 minutes
    expect(getByText('25:00')).toBeTruthy();
    
    // Check for the presence of control icons
    expect(getByA11yLabel('pause')).toBeTruthy();
    expect(getByA11yLabel('play')).toBeTruthy();
    expect(getByA11yLabel('stop')).toBeTruthy();
  });

  it('handles start, pause, and stop interactions', () => {
    jest.useFakeTimers();
    const { getByA11yLabel, getByText } = render(<PomodoroScreen />);
    
    // Simulate pressing the 'play' icon to start the timer
    fireEvent.press(getByA11yLabel('play'));
    jest.advanceTimersByTime(1000); // Fast-forward by one second
    // Expect the timer to decrement by one second (to 24:59)
    expect(getByText('24:59')).toBeTruthy();
    
    // Simulate pressing the 'pause' icon to pause the timer
    fireEvent.press(getByA11yLabel('pause'));
    jest.advanceTimersByTime(2000); // Try to fast-forward by two more seconds
    // Expect the timer to still show 24:59, indicating it's paused
    expect(getByText('24:59')).toBeTruthy();
    
    // Simulate pressing the 'stop' icon to reset the timer
    fireEvent.press(getByA11yLabel('stop'));
    // Expect the timer to reset to 25:00
    expect(getByText('25:00')).toBeTruthy();
    
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

});

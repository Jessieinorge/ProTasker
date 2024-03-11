// FilterScreen.test.js

import React from 'react';
import { render } from '@testing-library/react-native';
import FilterScreen from '../Components/FilterScreen';

describe('FilterScreen', () => {
  it('renders the search input', () => {
    const { getByPlaceholderText } = render(<FilterScreen />);
    expect(getByPlaceholderText('Search...')).toBeTruthy();
  });
});



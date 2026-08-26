import { render, screen } from '@testing-library/react-native';

import { AppScreen } from '@/ui/AppScreen';

describe('AppScreen', () => {
  it('renders an accessible placeholder shell', () => {
    render(<AppScreen />);

    expect(screen.getByRole('header', { name: 'Hermes Mobile' })).toBeOnTheScreen();
    expect(screen.getByText('The mobile shell is ready.')).toBeOnTheScreen();
  });
});

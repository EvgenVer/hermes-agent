import { render } from '@testing-library/react-native';

import { AppScreen } from '@/ui/AppScreen';

describe('AppScreen', () => {
  it('renders an accessible placeholder shell', async () => {
    const { getByRole, getByText } = await render(<AppScreen />);

    expect(getByRole('header', { name: 'Hermes Mobile' })).toBeOnTheScreen();
    expect(getByText('The mobile shell is ready.')).toBeOnTheScreen();
  });
});

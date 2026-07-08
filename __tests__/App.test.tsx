/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Không gọi mạng thật trong test — mock supabase client
jest.mock('../src/utils/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { within } from '@testing-library/dom';
import { render } from '@botframework-composer/test-utils';
import { createHistory, createMemorySource, LocationProvider } from '@reach/router';

import { App } from '../src/App';

import { wrapWithRecoil } from './testUtils';

jest.mock('axios', () => ({
  create: jest.fn().mockReturnThis(),
  get: jest.fn(),
  request: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
  },
}));

jest.mock('../', () => ({
  create: jest.fn().mockReturnThis(),
  get: jest.fn(),
  request: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
  },
}));

jest.mock('../src/telemetry/useInitializeLogger', () => ({
  useInitializeLogger: jest.fn(),
}));

function renderWithRouter(ui, { route = '/dialogs/home', history = createHistory(createMemorySource(route)) } = {}) {
  return {
    ...render(<LocationProvider history={history}>{ui}</LocationProvider>),
    history,
  };
}

const AppTest = () => <App />;

describe('<Router/> router test', () => {
  it('full app rendering/navigating', () => {
    const {
      container,
      history: { navigate },
    } = renderWithRouter(wrapWithRecoil(<AppTest />));

    const appContainer = container;
    expect(within(appContainer).findByAltText('Composer Logo')).not.toBeNull();

    navigate('/language-understanding');
    expect(appContainer.innerHTML).toMatch('Setting');

    navigate('/something-that-does-not-match');
    expect(appContainer.innerHTML).toMatch('404');
  });
});

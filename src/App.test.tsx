import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';

const EmptyRenderer = () => null;

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App render={EmptyRenderer} />, div);
  ReactDOM.unmountComponentAtNode(div);
});

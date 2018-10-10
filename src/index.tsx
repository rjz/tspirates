import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import GameView from './GameView';
import './index.css';

ReactDOM.render(
  <App render={GameView} />,
  document.getElementById('root') as HTMLElement
);

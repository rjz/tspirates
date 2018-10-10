import * as React from 'react';

import * as Game from './game';

const UPDATE_INTERVAL = 20;

type RenderProp<P> = (p: P) => React.ReactNode;

// type GameProps = {
//   render(s: Game.State): React.ReactNode,
// };

type AppProps = {
  render: RenderProp<Game.State>,
};

type AppState = Game.State;

// `App` acts as a state contained for the game.
class App extends React.Component<AppProps, AppState> {
  // Start a new game and assign it to the component `state`.
  state: Game.State = Game.start({
    height: window.innerHeight,
    width: window.innerWidth,
  });

  // `timer` to update the game state
  timer: number = 0;

  componentDidMount() {
    // Start the game timer
    this.timer = window.setInterval(this.onTic, UPDATE_INTERVAL);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  // Move the game state one `step` forward
  onTic = () => this.setState(Game.step(this.state));

  // Move the cannon following a (synthetic) `mousemove` event
  onMouseMove = (e: React.MouseEvent) =>
    this.setState(Game.rotateCannon(this.state, {
      x: e.clientX,
      y: e.clientY,
    }));

  // Fire the cannon following a (synthetic) `click` event
  onClick = ({ clientX: x, clientY: y }: React.MouseEvent) =>
    this.setState(Game.fireCannon(this.state, { x, y }));

  render() {
    const { width, height } = this.state;
    return (
      <div
        onClick={this.onClick}
        onMouseMove={this.onMouseMove}
        style={{ width, height }}
      >
        {this.props.render(this.state)}
      </div>
    );
  }
}

export default App;

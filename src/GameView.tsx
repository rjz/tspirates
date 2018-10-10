import * as React from 'react';
import './GameView.css';

import cannon from './cannon.svg';
import projectile from './projectile.svg';
import ship from './ship.svg';

import * as Game from './game';

const srcByLabel: { [K in Game.BodyLabel]: any } = {
  PROJECTILE: projectile,
  SHIP: ship,
  TURRET: cannon,
};

// Render a game sprite as a (styled) HTML `<img />` tag
const renderSprite = (body: Game.IBody) => {
  const { id, label, pos, bounds, angle } = body;

  return (
    <img
      key={id}
      src={srcByLabel[label]}
      className='Sprite'
      style={{
        height: bounds.y,
        position: 'absolute',
        transform: [
          `translate(${pos.x - bounds.x / 2}px, ${pos.y - bounds.y / 2}px)`,
          `scale(${1 + Math.max(pos.z - 50, 0) * .02})`,
          `rotate(${angle}rad)`,
        ].join(' '),
        width: body.bounds.x,
      }}
    />
  );
};

// `GameViewProps` include the 'interesting' (at least, to a renderer!)
// properties of `Game.State`.
type GameViewProps = {
  // Note that we'll still _receive_ the full state from the `<App />` conatiner,
  // but the type-checker will block us from peeking at properties that aren't
  // whitelisted here.
  [P in 'outcome' | 'shipsSunk' | 'bodies']: Game.State[P]
};

// `GameView` renders the goods. Since it's stateless, we only need to declare
// a type for `Props`!
const GameView: React.SFC<GameViewProps> = (props) => {
  let message = `TODO: Sink ${3 - props.shipsSunk} more!`;
  if (props.outcome === 'VICTORY') {
    message = 'You win!';
  } else if (props.outcome === 'DEFEAT') {
    message = 'You lost :-(';
  }

  return (
    <div className='Game'>
      {props.bodies.map(renderSprite)}
      {message && <div key={props.outcome + props.shipsSunk} className='Message'>{message}</div>}
    </div>
  );
};

export default GameView;

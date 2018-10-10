import Vector from './vector';

type Partial<T> = {
  [P in keyof T]?: T[P]
};

const A_GRAVITY = -1;
const TURRET_RAD_VELOCITY = 0.1;
const SHIP_VELOCITY = 5;
const SHIP_RAD_VELOCITY = 0.02;
const PROJECTILE_VELOCITY = SHIP_VELOCITY * 3;

// Union type for labeling different body types
export type BodyLabel = 'SHIP' | 'PROJECTILE' | 'TURRET';

export type Outcome = 'PENDING' | 'DEFEAT' | 'VICTORY';

const idCounter: {
  [key: string]: number,
} = {};

const cid = (key: BodyLabel) => {
  idCounter[key] = (idCounter[key] || 0) + 1;
  return `${key}-${idCounter[key]}`;
};

type Point = {
  x: number,
  y: number,
};

// Convert a (2D) `Point` into a (3D) `Vector`
const asVector = ({ x, y }: Point) => new Vector(x, y);

// Angle between two points in a plane
const angleBetween = (c1: Point, c2: Point) =>
  Math.atan2((c2.y - c1.y), (c2.x - c1.x));

// Represents a physical body in our paper-physical world
export interface IBody {
  createdAt: number,
  id: string,
  label: BodyLabel,

  angle: number,
  angularVelocity: number,
  pos: Vector,
  vel: Vector,

  bounds: Vector,
};

// Some default values for newly-created bodies
const createBody = (label: BodyLabel, attrs: Partial<IBody>): IBody => ({
  angle: 0,
  angularVelocity: 0,
  bounds: new Vector(),
  createdAt: Date.now(),
  id: attrs.id || cid(label),
  label,
  pos: new Vector(),
  vel: new Vector(),
  ...attrs,
});

export type State = {
  shipsSunk: number,
  startTime: number,
  outcome: Outcome,
  width: number,
  height: number,
  userAngle: number,
  bodies: IBody[],
};

export const start = (opts: {
  height: number,
  width: number,
}): State => ({
  ...opts,
  bodies: [
    createBody('TURRET', {
      angle: Math.PI / 2,
      bounds: new Vector(100, 100, 10),
      pos: new Vector(opts.width / 2, 50, 50),
    }),
  ],
  outcome: 'PENDING',
  shipsSunk: 0,
  startTime: Date.now(),
  userAngle: Math.PI / 2,
});

// Given a maximum angular velocity `w`, seek from our `current` angle towards
// a `goal`.
const angleSeeker = (w: number) =>
  (current: number, goal: number) => {
    const delta = goal - current;
    const direction = Math.sign(delta);
    const magnitude = Math.min(Math.abs(delta), w);
    return (magnitude * direction);
  };

const shipSeekToAngle = angleSeeker(SHIP_RAD_VELOCITY);
const turretSeekToAngle = angleSeeker(TURRET_RAD_VELOCITY);

// Every step of the game takes constant time, regardless of frame rate.
// TODO: normalize based on "real" time needed to complete each step
const dt = 1;

// Our game takes place in a mass-less, forceless, unbounded world. The "magic"
// here applies "forces" (i.e., updates velocity) based on object type and
// filters objects that have moved outside the scene
const doMagicPhysics = (s: State, b: IBody): Partial<IBody> | null => {
  if (b.label === 'PROJECTILE') {
    // Remove projectiles that have fallen through the plane
    if (b.pos.z < 0) {
      return null;
    }

    return {
      // Projectiles have constant velocity in the XY-plane, but their altitude
      // is subject to something resembling gravity.
      // TODO: use forces instead of magic
      vel: b.vel.add(Vector.Z.scale(A_GRAVITY * dt))
    };
  } else if (b.label === 'SHIP') {
    const turret = s.bodies.find(x => x.label === 'TURRET');
    if (turret) {
      // Ships seek directly towards the turret
      return {
        angularVelocity: shipSeekToAngle(b.angle, angleBetween(b.pos, turret.pos)),
        vel: Vector.fromPolar(SHIP_VELOCITY, b.angle),
      };
    }
  } else if (b.label === 'TURRET') {
    return {
      // The turret seeks towards the mouse
      angularVelocity: turretSeekToAngle(b.angle, s.userAngle)
    };
  }
  return {};
};

const updatePosition = <B extends IBody>(b: B): B => {
  return Object.assign(b, {
    angle: b.angle + b.angularVelocity * dt,
    pos: b.pos.add(b.vel.scale(dt)),
  });
};

const checkCollision = (s1: IBody, s2: IBody) => {
  // Whitelist the body-types that are allowed to interact with each other.
  // E.g., ships can't collide with other ships, and projectiles can't shoot
  // each other down.
  const canInteract = [
    ['SHIP', 'TURRET'],
    ['PROJECTILE', 'SHIP'],
  ].some(labels => labels.indexOf(s1.label) > -1 && labels.indexOf(s2.label) > -1);

  if (!canInteract) {
    return false;
  }

  // We can do an *approximate* collision check by making sure the bodies are
  // within some reasonable proximity to one another.
  const HACKY_COLLISION_RADIUS = 100;

  return s1.pos.distanceTo(s2.pos) < HACKY_COLLISION_RADIUS;
};

// See if any bodies have collided, and (if so) return a map of collisions.
const checkCollisions = (bodies: IBody[]): WeakMap<IBody, IBody[]> =>
  bodies.reduce((collisions, b1, i) => {
    bodies.slice(i + 1)
      .filter(b2 => checkCollision(b1, b2))
      .forEach((b2) => {
        // Brute-force: add references to both bodies' collision lists
        collisions.set(b1, (collisions.get(b1) || []).concat(b2));
        collisions.set(b2, (collisions.get(b2) || []).concat(b1));
      });
    return collisions;
  }, new WeakMap<IBody, IBody[]>());

const spawnShip = (s: State) => createBody('SHIP', {
  angle: -(Math.PI / 2),
  bounds: new Vector(300, 210, 200),
  pos: new Vector(s.width * Math.random(), s.height),
  vel: Vector.Y.scale(-SHIP_VELOCITY),
});

export const rotateCannon = (s: State, dest: Point): State => {
  // We assume one turret per game: easy for a demo, but limiting if we wanted
  // to expand our coastal defense operation...
  // TODO: pass `turret` in
  const turret = s.bodies.find(b => b.label === 'TURRET');
  if (!turret) {
    return s;
  }

  return {
    ...s,
    userAngle: angleBetween(turret.pos, asVector(dest)),
  };
};

export const fireCannon = (s: State, dest: Point): State => {
  // TODO: pass `turret` in
  const turret = s.bodies.find(b => b.label === 'TURRET');
  if (!turret) {
    return s;
  }

  return ({
    ...s,
    bodies: s.bodies.concat(createBody('PROJECTILE', {
      bounds: new Vector(20, 20, 20),
      pos: turret.pos.add(new Vector(
        // Offset to the tip of the cannon, or so.
        Math.cos(turret.angle) * turret.bounds.x / 2,
        Math.sin(turret.angle) * turret.bounds.y / 2,
      )),
      vel: Vector
        .fromPolar(PROJECTILE_VELOCITY, turret.angle)
        .add(Vector.Z.scale(Math.sin(
          // TODO: actually solve for this angle
          (turret.pos.distanceTo(asVector(dest)) / s.height) * Math.PI / 2
        ) * PROJECTILE_VELOCITY)),
    })),
  });
};

export const step = (prevState: State): State => {
  if (prevState.outcome !== 'PENDING') {
    // Stop re-computing game state once it's over.
    return prevState;
  }

  const ships = prevState.bodies.filter(b => b.label === 'SHIP');

  // There's a lot of less-than-necessary abstraction as we iterate through the
  // collision list and apply logic based on what's in it.  TODO: extract and
  // tidy up the collision-handling API.
  const collMap = checkCollisions(prevState.bodies);
  const shipsSunk = prevState.shipsSunk + ships.filter(b => collMap.has(b)).length;

  let outcome: Outcome = prevState.outcome;
  if (prevState.bodies.some(b => b.label === 'TURRET' && collMap.has(b))) {
    outcome = 'DEFEAT';
  } else if (shipsSunk >= 3) {
    outcome = 'VICTORY';
  }

  // Re-do all the phyics.
  const updateBodies = <T extends IBody>(bodies: T[]): T[] =>
    bodies.reduce((bs, b) => {
      if (collMap.has(b)) {
        return bs;
      }

      const newAttrs = doMagicPhysics(prevState, b);
      if (newAttrs) {
        return [...bs, updatePosition(Object.assign({}, b, newAttrs))];
      }
      return bs;
    }, []);

  return {
    ...prevState,
    bodies: updateBodies(prevState.bodies)
      // *Maybe* spawn a new ship.
      .concat((ships.length < 3 && Math.random() < 0.02) ? spawnShip(prevState) : []),
    outcome,
    shipsSunk,
  };
}

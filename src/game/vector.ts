export default class Vector {
  static X = new Vector(1, 0);
  static Y = new Vector(0, 1);
  static Z = new Vector(0, 0, 1);

  static fromPolar(r: number, theta: number) {
    return new Vector(
      r * Math.cos(theta),
      r * Math.sin(theta),
    );
  }

  readonly x: number;
  readonly y: number;
  readonly z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  scale(s: number) {
    return new Vector(this.x * s, this.y * s, this.z * s);
  }

  add({ x, y, z }: Vector) {
    return new Vector(this.x + x, this.y + y, this.z + z);
  }

  subtract(v: Vector) {
    return this.add(v.scale(-1));
  }

  distanceTo(v: Vector) {
    return this.subtract(v).magnitude();
  }
};

// Piece model
class Piece {
  constructor({ type, position = [0, 4], rotation = 0, color = null }) {
    if (!type) {
      throw new Error('Piece requires a type');
    }
    this.type = type; // 'I', 'O', 'T', 'S', 'Z', 'J', 'L'
    this.position = position; // [row, col]
    this.rotation = rotation; // 0-3
    this.color = color; // string or null
  }

  setPosition(position) {
    if (!Array.isArray(position) || position.length !== 2) {
      throw new Error('Position must be an array of [row, col]');
    }
    this.position = position;
  }

  setRotation(rotation) {
    if (typeof rotation !== 'number' || rotation < 0 || rotation > 3) {
      throw new Error('Rotation must be a number between 0 and 3');
    }
    this.rotation = rotation;
  }

  rotate() {
    this.rotation = (this.rotation + 1) % 4;
  }
}

export default Piece; 
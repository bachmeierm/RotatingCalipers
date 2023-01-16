export const area = (a: Vector, b: Vector, c: Vector): number => {
    return Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
}

export class Vector {
    public readonly x: number;
    public readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    toString(): string {
        return `(${this.x}, ${this.y})`;
    }

    length(): number {
        return Math.hypot(this.x, this.y);
    }

    add(other: Vector): Vector {
        return new Vector(this.x + other.x, this.y + other.y);
    }

    sub(other: Vector): Vector {
        return new Vector(this.x - other.x, this.y - other.y);
    }

    scale(scalar: number): Vector {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    normalized(): Vector {
        const rcp = 1 / this.length();
        return new Vector(this.x * rcp, this.y * rcp);
    }
}

export class Vertex extends Vector {
    private readonly polygon: Polygon;
    private readonly idx: number;

    constructor(polygon: Polygon, idx: number) {
        const v = polygon.vertices[idx];
        super(v.x, v.y);

        this.polygon = polygon;
        this.idx = idx;
    }

    next(): Vertex {
        const i = (this.idx + 1) % this.polygon.vertices.length;
        return new Vertex(this.polygon, i);
    }

    isEqual(other: Vertex): boolean {
        return this.idx === other.idx;
    }

    isNotEqual(other: Vertex): boolean {
        return this.idx !== other.idx;
    }
}

export class Polygon {
    public readonly vertices: ReadonlyArray<Vector>;

    constructor(vertices: ReadonlyArray<Vector>) {
        this.vertices = vertices;
    }

    getVertex(idx: number): Vertex {
        return new Vertex(this, idx);
    }
}

export class Extent {
    public readonly min: Vector;
    public readonly max: Vector;

    constructor(min: Vector, max: Vector) {
        this.min = min;
        this.max = max;
    }

    get width(): number {
        return this.max.x - this.min.x;
    }

    get height(): number {
        return this.max.y - this.min.y;
    }

    get center(): Vector {
        const offset = new Vector(this.width / 2, this.height / 2);
        return this.min.add(offset);
    }

    mergeWith(...other: Extent[]): Extent {
        const merge = (a: Extent, b: Extent): Extent => {
            const minX = Math.min(a.min.x, b.min.x);
            const minY = Math.min(a.min.y, b.min.y);
            const maxX = Math.max(a.max.x, b.max.x);
            const maxY = Math.max(a.max.y, b.max.y);
            const min = new Vector(minX, minY);
            const max = new Vector(maxX, maxY);
            return new Extent(min, max);
        };
        return other.reduce((p, c) => merge(p, c), this);
    }
}

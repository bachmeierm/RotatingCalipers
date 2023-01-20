export class Vector {
    public readonly x: number;
    public readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    equals(b: Vector): boolean {
        return this.x === b.x && this.y === b.y;
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

    mergeWithPoint(pos: Vector): Polygon {
        return getConvexHull([...this.vertices, pos]);
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

    mergeWith(...other: ReadonlyArray<Extent>): Extent {
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

export class PointSet {
    public readonly points: ReadonlyArray<Vector>;

    constructor(points: ReadonlyArray<Vector>) {
        this.points = points;
    }

    addPoints(...points: ReadonlyArray<Vector>): PointSet {
        return new PointSet([...this.points, ...points]);
    }

    getConvexHull(): Polygon {
        return getConvexHull(this.points);
    }
}

export const area = (a: Vector, b: Vector, c: Vector): number => {
    return Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
}

export const getConvexHull = (points: ReadonlyArray<Vector>): Polygon => {
    type Turn = "Clockwise" | "CounterClockwise" | "Collinear";

    const getTurn = (a: Vector, b: Vector, c: Vector): Turn => {
        const crossProduct = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
        if (crossProduct > 0) {
            return "CounterClockwise";
        } else if(crossProduct < 0) {
            return "Clockwise";
        } else {
            return "Collinear";
        }
    };

    const arePointsCollinear = (points: ReadonlyArray<Vector>): boolean => {
        if (points.length < 2) {
            return true;
        }
        const a = points[0];
        const b = points[1];
        for (let i = 2; i < points.length; i++) {
            const c = points[i];
            if(getTurn(a, b, c) != "Collinear") {
                return false;
            }
        }
        return true;
    };

    const getLowestPoint = (points: ReadonlyArray<Vector>) =>  {
        let lowest = points[0];
        for (let i = 1; i < points.length; i++) {
            const temp = points[i];
            if(temp.y < lowest.y || (temp.y == lowest.y && temp.x < lowest.x)) {
                lowest = temp;
            }
        }
        return lowest;
    };

    const getSortedPoints = (points: ReadonlyArray<Vector>) => {
        const lowest = getLowestPoint(points);
        const compare = (a: Vector, b: Vector): number => {
            if(a.equals(b)) {
                return 0;
            }
            const dirA = a.sub(lowest);
            const dirB = b.sub(lowest);
            const thetaA = Math.atan2(dirA.y, dirA.x);
            const thetaB = Math.atan2(dirB.y, dirB.x);
            if(thetaA < thetaB) {
                return -1;
            } else if(thetaA > thetaB) {
                return 1;
            } else {
                const distA = a.sub(lowest).length();
                const distB = b.sub(lowest).length();
                return distA < distB ? -1 : 1;
            }
        };
        return points.concat().sort(compare);
    };

    const sorted = getSortedPoints(points);
    if(sorted.length < 3) {
        return new Polygon(points);
    }
    if(arePointsCollinear(sorted)) {
        throw new Error("Cannot create a convex hull from collinear points!");
    }
    const stack: Vector[] = [];
    stack.push(sorted[0]);
    stack.push(sorted[1]);
    for (let i = 2; i < sorted.length; i++) {
        const head = sorted[i];
        const middle = stack.pop()!;
        const tail = stack[stack.length - 1];
        const turn = getTurn(tail, middle, head);
        switch(turn) {
            case "CounterClockwise":
                stack.push(middle);
                stack.push(head);
                break;
            case "Clockwise":
                i--;
                break;
            case "Collinear":
                stack.push(head);
                break;
        }
    }
    //stack.push(sorted[0]);
    return new Polygon(stack);
};

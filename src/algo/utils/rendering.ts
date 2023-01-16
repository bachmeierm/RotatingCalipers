import { Polygon, Vector } from "./math";

export type RenderFn = (ctx: RenderContext) => void;

export type Color = string;
export type Brush = {color: string};
export type Stroke = {color: Color, thickness: number, style: StrokeStyle};
export type StrokeStyle = "Solid" | "Dashed";

export interface RenderContext {
    readonly deltaSeconds: number;
    drawLine(a: Vector, b: Vector, stroke: Stroke): void;
    drawPolygon(vertices: ReadonlyArray<Vector>, stroke: Stroke): void;
    fillPolygon(vertices: ReadonlyArray<Vector>, brush: Brush): void;
}

export const createRenderContext = (ctx: CanvasRenderingContext2D, deltaSeconds: number): RenderContext => ({
    deltaSeconds,
    drawLine: (a, b, stroke) => {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
            ctx.closePath()
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.thickness;
            ctx.stroke();
    },
    drawPolygon: (vertices, stroke) => {
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.thickness;
        vertices.forEach(v => {
            ctx.lineTo(v.x, v.y);
        });
        ctx.closePath();
        ctx.stroke();
    },
    fillPolygon: (vertices, brush) => {
        ctx.beginPath();
        ctx.fillStyle = brush.color;
        vertices.forEach(v => {
            ctx.lineTo(v.x, v.y);
        });
        ctx.closePath();
        ctx.fill();

    },
});

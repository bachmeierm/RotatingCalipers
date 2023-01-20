import { area, createScenario, Polygon, RenderContext, Stroke, Vector } from "./utils";

export const DiameterScenario = createScenario("Diameter", async ctx => {
    const polygon = ctx.polygons[0];

    let p = polygon.getVertex(0);
    let q = p.next();

    const render = (ctx: RenderContext, a: Vector, b: Vector, dir: Vector) => {
        const strokeBlack: Stroke = {color: "black", thickness: 1, style: "Solid"};
        const strokeBlue: Stroke = {color: "blue", thickness: 1, style: "Solid"};
        ctx.drawPolygon(polygon.vertices, strokeBlack);
        ctx.drawLine(a.sub(dir), a.add(dir), strokeBlue);
        ctx.drawLine(b.sub(dir), b.add(dir), strokeBlue);
    };

    const renderP = (ctx: RenderContext) => {
        const dir = p.next().sub(p).normalized().scale(10000);
        render(ctx, p, q, dir);
    };

    const renderQ = (ctx: RenderContext) => {
        const dir = q.next().sub(q).normalized().scale(10000);
        render(ctx, p, q, dir);
    };

    // Search for the initial antipodal pair
    while (area(p, p.next(), q.next()) > area(p, p.next(), q)) {
        q = q.next();
    }

    ctx.log(`First antipodal pair ${p.toString()} and ${q.toString()}`, "Success");

    // Remember the initial antipodal pair, so we know when we are done
    const p0 = p;
    const q0 = q;

    // Let the calipers do their magic
    //while (q.isNotEqual(p0)) {
    while (true) {
        await ctx.waitForStep(renderP);
        p = p.next();
        ctx.log(`Found pair ${p.toString()} and ${q.toString()}`, "Success");
        while (area(p, p.next(), q.next()) > area(p, p.next(), q)) {
            await ctx.waitForStep(renderQ);
            q = q.next();
            //if (p.isNotEqual(q0) && q.isNotEqual(p0)) {
            if (true) {
                ctx.log(`Found pair ${p.toString()} and ${q.toString()}`, "Success");
            } else {
                ctx.log(`Skipping (inner loop)`, "Warning");
                return;
            }
        }
        if (area(p, p.next(), q.next()) == area(p, p.next(), q)) {
            if (p.isNotEqual(q0) && q.isNotEqual(p0)) {
                ctx.log(`Found pair ${p.toString()} and ${q.next().toString()}`, "Success");
            } else {
                ctx.log(`Found pair ${p.next().toString()} and ${q.toString()}`, "Success");
            }
            await ctx.waitForStep(renderP);
        } else {
            ctx.log(`Skipping (outer loop)`, "Warning");
        }
    }
});

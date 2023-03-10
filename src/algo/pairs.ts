import { area, Brush, createScenario, RenderContext, Stroke, Vector } from "./utils";

export const AntipodalPairsScenario = createScenario("AntipodalPairs", async ctx => {
    const polygon = ctx.polygons[0];

    const strokeBlack: Stroke = {color: "black", thickness: 2, style: "Solid"};
    const strokeBlackDashed: Stroke = {color: "black", thickness: 2, style: "Dashed"};
    const strokeRed: Stroke = {color: "red", thickness: 4, style: "Solid"};

    const brushBlue: Brush = {color: "#2DBFFF88"};

    let p = polygon.getVertex(0);
    let q = p.next();

    let convexChain: Vector[] = [];

    const render = (ctx: RenderContext, a: Vector, b: Vector, dir: Vector) => {
        ctx.fillPolygon(polygon.vertices, brushBlue);
        ctx.drawPolygon(polygon.vertices, strokeBlack);
        ctx.drawLine(a.sub(dir), a.add(dir), strokeBlack);
        ctx.drawLine(b.sub(dir), b.add(dir), strokeBlack);
        ctx.drawPolyline(convexChain, strokeRed);
    };

    const renderInit = (ctx: RenderContext) => {
        const dir = p.next().sub(p).normalized().scale(10000);
        ctx.fillPolygon(polygon.vertices, brushBlue);
        ctx.drawPolygon(polygon.vertices, strokeBlack);
        ctx.drawLine(p.sub(dir), p.add(dir), strokeBlack);
        ctx.drawLine(q.sub(dir), q.add(dir), strokeBlack);
        ctx.drawLine(p, q, strokeBlackDashed);
        ctx.drawLine(p.next(), q, strokeBlackDashed);
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
        await ctx.waitForStep(renderInit);
        ctx.log(`Searching q^-`, "Info");
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
        // Determine q+ for visualization
        let qq = q;
        convexChain = [q];
        while (area(p, p.next(), qq.next()) > area(p, p.next(), qq)) {
            qq = qq.next();
            convexChain.push(qq);
        }
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

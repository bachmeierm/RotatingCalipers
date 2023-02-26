import {Component, ElementRef, ViewChild, AfterViewInit, OnDestroy} from "@angular/core";
import {createRenderContext, LogStyle, Polygon, RenderContext, RenderFn, Scenario, ScenarioContext, scenarios, Vector} from "../algo";
import {AntipodalPairsScenario} from "src/algo/pairs";

type LogItem = {text: string, style?: LogStyle};

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent implements AfterViewInit, OnDestroy {

    polygon: Polygon = new Polygon([]);
    scenario: Scenario = AntipodalPairsScenario;
    isAutoplayActive: boolean = true;
    logItems: LogItem[] = [];

    @ViewChild("canvas", {static: true})
    private canvasRef?: ElementRef<HTMLCanvasElement>;

    private animationFrameId?: number;

    private currentRenderFn?: RenderFn;
    private currentResolveFn?: () => void;

    ngAfterViewInit(): void {
        const canvas = this.canvasRef?.nativeElement!;
        this.setupRendering(canvas);

        const fn = () => setTimeout(() => {
            if (this.isAutoplayActive && this.currentResolveFn) {
                this.currentResolveFn();
            }
            fn();
        }, 1000);

        fn();
    }

    ngOnDestroy(): void {
        if (this.animationFrameId != null) {
            window.cancelAnimationFrame(this.animationFrameId);
        }
    }

    runScenario(): void {
        this.runAlgorithm();
    }

    stopScenario(): void {
        this.currentRenderFn = undefined;
        this.currentResolveFn = undefined;
        this.polygon = new Polygon([]);
    }

    toggleAutoplay(): void {
        this.isAutoplayActive = !this.isAutoplayActive;
    }

    step(): void {
        if (!this.currentResolveFn) return;
        this.currentResolveFn();
    }

    canvasClick(event: MouseEvent): void {
        const target = event.target as HTMLCanvasElement;
        const rect = target.getBoundingClientRect();
        const x = Math.round(event.clientX - rect.left);
        const y = Math.round(event.clientY - rect.top);
        const pos = new Vector(x, y);
        this.polygon = this.polygon.mergeWithPoint(pos);
    }

    trackIndex(index: number): any {
        return index;
    }

    private setupRendering(canvas: HTMLCanvasElement): void {
        const context = canvas.getContext("2d")!;
        let frameCount: number = 0;
        let animationFrameId: number;

        const render = () => {
            frameCount++
            this.resizeCanvas(canvas);
            this.draw(context, frameCount);
            this.animationFrameId = window.requestAnimationFrame(render);
        }

        render();
    }

    private draw(ctx: CanvasRenderingContext2D, frameCount: number): void {
        const renderCtx = createRenderContext(ctx, frameCount);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (!this.currentRenderFn) {
            this.drawEditMode(renderCtx);
        } else {
            this.currentRenderFn(renderCtx);
        }
    }

    private drawEditMode(ctx: RenderContext): void {
        ctx.fillPolygon(this.polygon.vertices, {color: "#2DBFFF88"});
        ctx.drawPolygon(this.polygon.vertices, {color: "black", thickness: 2, style: "Solid"});
    }

    private async runAlgorithm() {
        const ctx: ScenarioContext = {
            polygons: [this.polygon],
            log: (text, style) => this.logItems.push({text, style}),
            waitForStep: render => new Promise(x => {
                this.currentRenderFn = render;
                this.currentResolveFn = x;
            }),
        };
        //ctx.log(`Starting scenario: ${scenario.name}`);
        await this.scenario.run(ctx);
        //ctx.log(`Scenario complete: ${scenario.name}`);
    }

    private resizeCanvas(canvas: HTMLCanvasElement): boolean {
        const {width, height} = canvas.getBoundingClientRect();

        if (canvas.width !== width || canvas.height !== height) {
            const {devicePixelRatio: ratio = 1} = window;
            const context = canvas.getContext("2d")!;
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            context.scale(ratio, ratio);
            return true;
        }

        return false;
    }
}

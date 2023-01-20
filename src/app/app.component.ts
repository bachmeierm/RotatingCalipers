import {Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectionStrategy} from "@angular/core";
import {createRenderContext, LogStyle, Polygon, RenderContext, RenderFn, Scenario, ScenarioContext, scenarios, Vector} from "../algo";
import {DiameterScenario} from "src/algo/diameter";

type LogItem = {text: string, style?: LogStyle};

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit, OnDestroy {

    scenarios: Scenario[] = scenarios;
    polygons: Polygon[] = [];
    selectedPolygonIdx?: number;
    currentScenario?: Scenario;
    isAutoplayActive: boolean = true;
    logItems: LogItem[] = [];

    @ViewChild("canvas", {static: true})
    private canvasRef?: ElementRef<HTMLCanvasElement>;

    private animationFrameId?: number;

    private currentRenderFn?: RenderFn;
    private currentResolveFn?: () => void;

    ngAfterViewInit(): void {
        this.currentScenario = DiameterScenario;

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
        // TODO: Implement
    }

    toggleAutoplay(): void {
        this.isAutoplayActive = !this.isAutoplayActive;
    }

    step(): void {
        if (!this.currentResolveFn) return;
        this.currentResolveFn();
    }

    addPolygon(): void {
        this.polygons.push(new Polygon([]));
    }

    removePolygon(index: number): void {
        if (this.selectedPolygonIdx === index) {
            this.selectedPolygonIdx = undefined;
        }
        if (this.selectedPolygonIdx != null && this.selectedPolygonIdx > index) {
            this.selectedPolygonIdx--;
        }
        this.polygons.splice(index, 1);
    }

    selectPolygon(index: number): void {
        this.selectedPolygonIdx = index;
    }

    canvasClick(event: MouseEvent): void {
        const target = event.target as HTMLCanvasElement;
        const rect = target.getBoundingClientRect();
        const x = Math.round(event.clientX - rect.left);
        const y = Math.round(event.clientY - rect.top);
        const pos = new Vector(x, y);
        if (this.selectedPolygonIdx != null) {
            let polygon = this.polygons[this.selectedPolygonIdx];
            polygon = polygon.mergeWithPoint(pos);
            this.polygons[this.selectedPolygonIdx] = polygon;
        }
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
        this.polygons.forEach(p => {
            ctx.drawPolygon(p.vertices, {color: "black", thickness: 1, style: "Solid"});
        });
    }

    private async runAlgorithm() {
        const ctx: ScenarioContext = {
            polygons: this.polygons,
            log: (text, style) => this.logItems.push({text, style}),
            waitForStep: render => new Promise(x => {
                this.currentRenderFn = render;
                this.currentResolveFn = x;
            }),
        };
        const scenario = DiameterScenario;
        ctx.log(`Starting scenario: ${scenario.name}`);
        await DiameterScenario.run(ctx);
        ctx.log(`Scenario complete: ${scenario.name}`);
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

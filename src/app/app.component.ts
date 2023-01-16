import {Component, ElementRef, ViewChild, AfterViewInit, OnDestroy} from "@angular/core";
import { DiameterScenario } from "src/algo/diameter";
import {createRenderContext, RenderFn, Scenario, ScenarioContext, scenarios} from "../algo";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent implements AfterViewInit, OnDestroy {

    scenarios: Scenario[] = scenarios;

    @ViewChild("canvas", {static: true})
    private canvasRef?: ElementRef<HTMLCanvasElement>;

    private animationFrameId?: number;

    private currentRenderFn?: RenderFn;
    private currentResolveFn?: () => void;

    ngAfterViewInit(): void {
        const canvas = this.canvasRef?.nativeElement!;
        this.setupRendering(canvas);
        this.runAlgoLoop();

        const fn = () => setTimeout(() => {
            if (this.currentResolveFn) {
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

    step(): void {
        if (!this.currentResolveFn) return;
        this.currentResolveFn();
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
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (!this.currentRenderFn) return;
        this.currentRenderFn(createRenderContext(ctx, frameCount));
    }

    private async runAlgoLoop() {
        const ctx: ScenarioContext = {
            log: text => console.log(text),
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

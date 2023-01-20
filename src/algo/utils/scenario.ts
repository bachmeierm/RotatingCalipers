import { Polygon } from "./math";
import { RenderContext } from "./rendering";

export type LogStyle = "Info" | "Success" | "Warning" | "Error";

export type ScenarioRunFn = (ctx: ScenarioContext) => Promise<void>;
export type ScenarioDrawFn = (ctx: RenderContext) => void;

export interface Scenario {
    name: string;
    run: ScenarioRunFn;
}

export interface ScenarioContext {
    readonly polygons: ReadonlyArray<Polygon>;
    log(text: string, style?: LogStyle): void;
    waitForStep(draw: ScenarioDrawFn): Promise<void>;
}

export const createScenario = (name: string, run: ScenarioRunFn) => {
    return {name, run};
};

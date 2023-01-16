import { Vector } from "./math";
import { RenderContext } from "./rendering";

export type ScenarioRunFn = (ctx: ScenarioContext) => Promise<void>;
export type ScenarioDrawFn = (ctx: RenderContext) => void;

export interface Scenario {
    name: string;
    run: ScenarioRunFn;
}

export interface ScenarioContext {
    log(text: string): void;
    waitForStep(draw: ScenarioDrawFn): Promise<void>;
}

export class ScenarioContextImpl implements ScenarioContext {
    log(text: string): void {
        console.log(text);
    }
    waitForStep(draw: ScenarioDrawFn): Promise<void> {
        return new Promise(resolve => resolve());
    }
}

export const createScenario = (name: string, run: ScenarioRunFn) => {
    return {name, run};
};

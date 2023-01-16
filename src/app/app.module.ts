import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { BrowserModule } from "@angular/platform-browser";
import { AppComponent } from "./app.component";

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forRoot([]),
        BrowserModule,
    ],
    declarations: [
        AppComponent,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}

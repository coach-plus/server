import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { Http, HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { rootRouterConfig } from './app.routes';
import { AppComponent } from './app.component';
import * as $ from 'jquery';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    HttpClientModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(rootRouterConfig, { useHash: false, anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {NgxPageScrollModule} from 'ngx-page-scroll';

import {HeaderComponent} from './header/header.component';
import {FooterComponent} from './footer/footer.component';
// Services
import {WINDOW_PROVIDERS} from './services/windows.service';
import {LandingFixService} from '../shared/services/landing-fix.service';
import {PageComponent} from './page/page.component';
import {HttpClientModule} from '@angular/common/http';

@NgModule({
    exports: [
        CommonModule,
        HeaderComponent,
        FooterComponent,
        PageComponent
    ],
    imports: [
        CommonModule,
        RouterModule,
        NgxPageScrollModule,
        HttpClientModule
    ],
    declarations: [
        HeaderComponent,
        FooterComponent,
        PageComponent
    ],
    providers: [
        WINDOW_PROVIDERS,
        LandingFixService
    ]
})
export class SharedModule {
}

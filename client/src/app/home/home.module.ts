import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeRoutingModule } from './home-routing.module';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OwlModule } from 'ngx-owl-carousel';

import { HomeComponent } from './home.component';
import { IntroComponent } from './intro/intro.component';
import { AboutComponent } from './about/about.component';
import { FeatureComponent } from './feature/feature.component';
import { ScreenshotComponent } from './screenshot/screenshot.component';
import { FaqComponent } from './faq/faq.component';
import { DownloadComponent } from './download/download.component';
import { TermsOfUseComponent } from './terms-of-use/terms-of-use.component';
import { DataPrivacyComponent } from './data-privacy/data-privacy.component';
import { ImpressumComponent } from './impressum/impressum.component';

@NgModule({
  imports: [
    CommonModule,
    HomeRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    OwlModule
  ],
  declarations: [
    HomeComponent,
    IntroComponent,
    AboutComponent,
    FeatureComponent,
    ScreenshotComponent,
    FaqComponent,
    DownloadComponent,
    TermsOfUseComponent,
    DataPrivacyComponent,
    ImpressumComponent
  ]
})
export class HomeModule { }

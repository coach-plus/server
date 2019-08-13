import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerificationComponent } from './verification/verification.component';
import {AppRoutingModule } from './app-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { OwlModule } from 'ngx-owl-carousel';
import { RedirectComponent } from './redirect/redirect.component';
@NgModule({
  declarations: [VerificationComponent, RedirectComponent],
  imports: [
    CommonModule,
    AppRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    OwlModule
  ]
})
export class AppModule { }

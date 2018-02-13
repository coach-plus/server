import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { RouterModule, Routes } from '@angular/router'

import { AppComponent } from './app.component';
import { RegisterComponent } from './register/register.component';
import { VerificationComponent } from './verification/verification.component';
import { RedirectComponent } from './redirect/redirect.component';

const appRoutes: Routes = [
  {
    path: 'register', component: RegisterComponent
  },
  {
    path: 'verification/:token',
    component: VerificationComponent
  },
  {
    path: 'teams/:public/join/:token',
    component: RedirectComponent
  }
]

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    VerificationComponent,
    RedirectComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(appRoutes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

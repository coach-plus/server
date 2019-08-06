import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { RegisterComponent } from './register/register.component';
import { VerificationComponent } from './verification/verification.component';
import { RedirectComponent } from './redirect/redirect.component';
import { HomeComponent } from './home/home.component';

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
  },
  {
    path: '**',
    component: HomeComponent
  }
];

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    VerificationComponent,
    RedirectComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

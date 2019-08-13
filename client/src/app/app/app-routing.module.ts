import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VerificationComponent } from './verification/verification.component';
import { RedirectComponent } from './redirect/redirect.component';

// Routes
const routes: Routes = [
  {
    path: 'verification',
    component: VerificationComponent,
  }, {
    path: 'teams/:public/join/:token',
    component: RedirectComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

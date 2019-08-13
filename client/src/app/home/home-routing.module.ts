import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home.component';

// Routes
const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: {
      title: 'Coach+',
      content: 'Sei nicht nur Coach, sei Coach+'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }

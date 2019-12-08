import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home.component';
import { TermsOfUseComponent } from './terms-of-use/terms-of-use.component';
import { DataPrivacyComponent } from './data-privacy/data-privacy.component';

// Routes
const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: {
      title: 'Coach+',
      content: 'Sei nicht nur Coach, sei Coach+'
    }
  },
  {
    path: 'terms-of-use',
    component: TermsOfUseComponent,
    data: {
      title: 'Coach+',
      content: 'Nutzungsbedingungen'
    }
  },
  {
    path: 'data-privacy',
    component: DataPrivacyComponent,
    data: {
      title: 'Coach+',
      content: 'Datenschutz'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }

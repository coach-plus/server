import { Routes, RouterModule } from '@angular/router';

export const rootRouterConfig: Routes = [
  {
    path: '',
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'app',
    loadChildren: () => import('./app/app.module').then(m => m.AppModule)
  },
  {
    path: '**',
    redirectTo: ''
  }
];


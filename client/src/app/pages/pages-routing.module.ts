import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SignInComponent } from './sign-in/sign-in.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { ForgetPasswordComponent } from './forget-password/forget-password.component';
import { ThankYouComponent } from './thank-you/thank-you.component';
import { ReviewComponent } from './review/review.component';
import { ErrorPageComponent } from './error-page/error-page.component';
import { FaqComponent } from './faq/faq.component';
import { DownloadComponent } from './download/download.component';
import { ComingSoonComponent } from './coming-soon/coming-soon.component';
import { RequestFormComponent } from './request-form/request-form.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'sign-in',
        component: SignInComponent,
        data: {
          title: "Sign-In | Chatloop Landing Page"
        }
      },
      {
        path: 'sign-up',
        component: SignUpComponent,
        data: {
          title: "Sign-Up | Chatloop Landing Page"
        }
      }, 
      {
        path: 'forget-password',
        component: ForgetPasswordComponent,
        data: {
          title: "Forget-Password | Chatloop Landing Page"
        }
      }, 
      {
        path: 'thank-you',
        component: ThankYouComponent,
        data: {
          title: "Thank You | Chatloop Landing Page"
        }
      }, 
      {
        path: 'review',
        component: ReviewComponent,
        data: {
          title: "Review | Chatloop Landing Page"
        }
      },
      {
        path: '404',
        component: ErrorPageComponent,
        data: {
          title: "404 | Chatloop Landing Page"
        }
      },
      {
        path: 'faq',
        component: FaqComponent,
        data: {
          title: "FAQ | Chatloop Landing Page"
        }
      },
      {
        path: 'download',
        component: DownloadComponent,
        data: {
          title: "Download| Chatloop Landing Page"
        }
      },
      {
        path: 'coming-soon',
        component: ComingSoonComponent,
        data: {
          title: "Comming-Soon | Chatloop Landing Page"
        }
      },
      {
        path: 'request',
        component: RequestFormComponent,
        data: {
          title: "Request | Chatloop Landing Page"
        }
      }         
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }

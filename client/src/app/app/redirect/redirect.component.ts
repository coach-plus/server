import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { ApiService } from 'src/app/shared/services/api.service';
import { switchMap, publishReplay, refCount, map } from 'rxjs/operators';

@Component({
  selector: 'app-redirect',
  templateUrl: './redirect.component.html',
  styleUrls: ['./redirect.component.scss']
})
export class RedirectComponent implements OnInit, OnDestroy {


  private sub: Subscription
  private url
  private team
  public loading = true
  public error

  constructor(private route: ActivatedRoute, private apiService: ApiService) {

  }

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
        this.url = window.location.href
        if (params.get('mode')) {
          const mode = params.get('mode')
          if (mode === 'private') {
            return this.apiService.getInvitation(params.get('tokenOrTeamId')).pipe(map((apiResult: any) => apiResult.content.team))
          } else if (mode === 'public') {
            return this.apiService.getPublicTeam(params.get('tokenOrTeamId')).pipe(map((apiResult: any) => apiResult.content))
          }
        }
      }),
      publishReplay(1),
      refCount()
    ).subscribe((team) => {
      this.team = team
      this.loading = false
    }, (e) => {
      this.error = 'Du kannst dem Team nicht beitreten.'
      this.loading = false
    })
  }

  ngOnDestroy(): void {
  }



}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Http, Headers, Response } from '@angular/http';
import { Observable, Observer } from 'rxjs';
import 'rxjs/add/operator/map';

@Component({
  selector: 'app-verification',
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.css']
})
export class VerificationComponent implements OnInit, OnDestroy {

  private sub: any;

  token: string
  verified: boolean

  constructor(private route: ActivatedRoute, private http: Http) { }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.token = params['token']
      this.verify()
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  verify() {
    this.http.post(`/api/users/verification/${this.token}`, {}).map((res: any) => {
      return res.json();
    }).subscribe(() => {
      this.verified = true
    })
  }
}

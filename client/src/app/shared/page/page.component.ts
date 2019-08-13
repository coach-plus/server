import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { LandingFixService } from '../services/landing-fix.service';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss']
})
export class PageComponent implements OnInit, OnDestroy {

  @Input() name = '';

  constructor(
    private fix: LandingFixService,
    private route: ActivatedRoute,
    private title: Title,
    private meta: Meta
  ) { }

  ngOnInit() {
    this.fix.addFixPages();
    this.title.setTitle( this.route.snapshot.data['title']);
  }

  ngOnDestroy() {
    this.fix.removeFixPages();
  }
}

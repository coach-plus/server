import { Component, HostListener, Inject, OnInit, Input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { WINDOW } from '../services/windows.service';
declare var $: any;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  @Input() public showMenu = true;
  @Input() public showDarkHeader = false;

  public darkHeader = false;
  public menuItems: any[];

  // Inject Document object
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(WINDOW) private window
  ) { }

  ngOnInit() {
     $.getScript('./assets/js/script.js');
     $.getScript('./assets/js/tilt.jquery.js');
   }


  // @HostListener Decorator
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const number = this.window.pageYOffset || this.document.documentElement.scrollTop || this.document.body.scrollTop || 0;
    if (number >= 60) {
      this.darkHeader = true;
    } else {
      this.darkHeader = false;
    }
  }

}

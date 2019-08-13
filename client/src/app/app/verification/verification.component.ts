import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {map} from 'rxjs/operators';
import {ApiService} from '../../shared/services/api.service';

@Component({
    selector: 'app-verification',
    templateUrl: './verification.component.html',
    styleUrls: ['./verification.component.scss']
})
export class VerificationComponent implements OnInit, OnDestroy {

    loading = true;
    success: boolean;
    text: string;
    private sub: any;

    constructor(private route: ActivatedRoute, private apiService: ApiService) {
    }

    ngOnInit() {
        this.loading = true;
        this.sub = this.route.params.subscribe(params => {
            this.text = 'Wir bestätigen deine E-Mail Adresse, einen Moment bitte.'
            const token = params['token'];
            this.verify(token);
        }, (e) => {
            this.text = 'Deine E-Mail Adresse konnte nicht verifiziert werden.';
            this.success = false;
            this.loading = false;
        });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    verify(token: string) {
        this.apiService.verifyEmail(token).pipe(
            map((res: any) => {
                return res.json();
            })).subscribe(() => {
            this.text = 'Deine E-Mail Adresse wurde verifiziert.';
            this.success = true;
            this.loading = false;
        }, (e) => {
            this.text = 'Deine E-Mail Adresse konnte nicht verifiziert werden.';
            this.success = false;
            this.loading = false;
        });
    }

}

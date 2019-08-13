import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = '/api';


  constructor(private readonly http: HttpClient) { }

  public verifyEmail(token: string) {
    return this.http.post(`${this.baseUrl}/users/verification/${token}`, {});
  }


}

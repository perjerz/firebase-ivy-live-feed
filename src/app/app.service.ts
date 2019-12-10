
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireFunctions } from '@angular/fire/functions';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private afs: AngularFireFunctions, private http: HttpClient, private auth: AngularFireAuth) {}
  async post(image: File, message: string) {
    try {
      const token = await this.auth.auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append('image', image);
      formData.append('message', message);
      return this.http.post('http://localhost:8080/post', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (err) {
      return throwError('No token');
    }
  }
  toggleLike() {
    // TODO: race condition like
  }
}

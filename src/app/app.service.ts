import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireFunctions } from '@angular/fire/functions';
import { throwError } from 'rxjs';
import { catchError,  exhaustMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  constructor(
    private afs: AngularFireFunctions,
    private http: HttpClient,
    private auth: AngularFireAuth
  ) {}

  post(image: File, message: string) {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('message', message);

    return this.auth.idToken.pipe(
      exhaustMap(token =>
        this.http.post('/Post', formData, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          responseType: 'text'
        }).pipe(catchError(err => throwError(err.statusText))),
      )
    );
  }
  toggleLike() {
    // TODO: race condition like
    return this.afs.httpsCallable('like');
  }
}


import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private afs: AngularFireFunctions) {}
  post(userId: string, image: File, message: string) {
    // TODO: completed API
    const call = this.afs.httpsCallable('');
    return call({userId, image, message});
  }
}

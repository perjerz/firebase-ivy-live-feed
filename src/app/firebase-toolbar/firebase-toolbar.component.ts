import { User } from './../app.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';

import * as firebase from 'firebase';

@Component({
  selector: 'app-firebase-toolbar',
  templateUrl: './firebase-toolbar.component.html',
  styleUrls: ['./firebase-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FirebaseToolbarComponent implements OnInit {
  @Input() user: User;

  constructor(private auth: AngularFireAuth, private matSnackbar: MatSnackBar) { }

  ngOnInit() { }


  signIn() {
    const authProvider = new firebase.auth.FacebookAuthProvider();
    authProvider.addScope('email');
    this.auth
      .signInWithPopup(authProvider)
      .then(() => {
        this.matSnackbar.open('Sign in successfully.');
      })
      .catch(err => {
        this.matSnackbar.open(err.toString());
      });
  }

  signOut() {
    this.auth.signOut();
  }
}

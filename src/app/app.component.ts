import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { fromEvent, of, race, throwError, timer } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { FeedDialogComponent } from './feed-dialog/feed-dialog.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import * as firebase from 'firebase';

const MAX_FILE_SIZE =  4 * 1024 * 1024; // 4 * Mega * Bytes
const IMAGE_LOAD_TIMEOUT = 100;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    private matDialog: MatDialog,
    private matSnackbar: MatSnackBar,
    public auth: AngularFireAuth,
  ) {}

  trackByKey(index: number) {
    return index;
  }

  private pickImage() {
    const input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg, image/png';
    input.click();
    return fromEvent(input, 'change').pipe(
      switchMap(() => {
        const file = input.files[0];
        if (file.size > MAX_FILE_SIZE) {
          return throwError('Too large file. File must be less than 4 MB.');
        }
        return of(file);
      })
    );
  }

  private readFileToBase64(file: File) {
    const reader = new FileReader();
    const readFile$ = (fileReader: FileReader) => {
      return fromEvent(fileReader, 'load').pipe(take(1));
    };
    reader.readAsDataURL(file);
    return readFile$(reader).pipe(map(() => reader.result as string));
  }

  private checkImageError(base64: string) {
    const img: HTMLImageElement = document.createElement('img');
    img.src = base64;
    return race(
      fromEvent(img, 'error').pipe(
        take(1),
        switchMap(() => throwError('You image is failed to load.'))
      ),
      timer(IMAGE_LOAD_TIMEOUT).pipe(map(() => base64))
    );
  }

  openFeedDialog() {
    const image$ = this.pickImage();
    image$
      .pipe(
        switchMap(file => this.readFileToBase64(file)),
        switchMap(base64 => this.checkImageError(base64))
      )
      .subscribe(
        base64 => {
          this.matDialog.open(FeedDialogComponent, {
            maxWidth: '95vw',
            data: base64
          });
        },
        err => {
          this.matSnackbar.open(err);
        }
      );
  }

  signIn() {
    const authProvider = new firebase.auth.FacebookAuthProvider();
    authProvider.addScope('email');
    this.auth.auth.signInWithPopup(authProvider).then(user => {
      this.matSnackbar.open('Sign in successfully.');
    }).catch(err => {
      this.matSnackbar.open(err.toString());
    });
  }
}

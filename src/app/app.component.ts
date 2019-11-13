import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { EMPTY, fromEvent, Observable, of, race, throwError, timer } from 'rxjs';
import { map, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { AppService } from './app.service';
import { FeedDialogComponent } from './feed-dialog/feed-dialog.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import * as firebase from 'firebase';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 * Mega * Bytes
const IMAGE_LOAD_TIMEOUT = 100;

interface Post {
  postUserId: string;
  imageUrl: string;
  message: string;
  likeUserIds: string[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  posts$: Observable<Post[]>;
  user$: Observable<firebase.User>;
  myLike: boolean;

  constructor(
    private matDialog: MatDialog,
    private matSnackbar: MatSnackBar,
    private afs: AngularFirestore,
    private auth: AngularFireAuth,
    private appService: AppService,
  ) { }

  ngOnInit() {
    this.user$ = this.auth.user;
    this.posts$ = this.afs.collection<Post>('posts').valueChanges();
  }

  trackByKey(index: number) {
    return index;
  }

  openFeedDialog() {
    let uploadImage: File;
    const image$ = this.pickImage();
    const message$ = (base64: string) => this.matDialog
    .open<FeedDialogComponent, unknown, string>(FeedDialogComponent, {
      maxWidth: '95vw',
      data: base64
    })
    .afterClosed();
    image$
      .pipe(
        tap(file => {
          uploadImage = file;
        }),
        switchMap(file => this.readFileToBase64(file)),
        switchMap(base64 => this.checkImageError(base64)),
        switchMap(base64 => message$(base64)),
        switchMap(message => {
          if (message === undefined) {
            return EMPTY;
          }
          return of(message);
        }),
        withLatestFrom(this.user$),
        switchMap(([message, user]) => this.appService.post(user.uid, uploadImage, message))
      )
      .subscribe(
        () => {
          this.matSnackbar.open('Posted successfully!');
        },
        err => {
          this.matSnackbar.open(err);
        },
        () => {
          this.matSnackbar.open('What\'s wrong? Why didn\'t you post?');
        },
      );
  }

  signIn() {
    const authProvider = new firebase.auth.FacebookAuthProvider();
    authProvider.addScope('email');
    this.auth.auth
      .signInWithPopup(authProvider)
      .then(user => {
        this.matSnackbar.open('Sign in successfully.');
      })
      .catch(err => {
        this.matSnackbar.open(err.toString());
      });
  }

  like() {
    this.myLike = !this.myLike;
    // TODO: Optimistic update
  }

  share() {
    // TODO: Web Share API
  }

  private pickImage() {
    const input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg, image/png';
    // TODO: test input click because it doesn't work in some browsers
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
}

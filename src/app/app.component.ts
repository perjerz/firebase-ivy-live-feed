import { Post, User } from './app.interface';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import {
  EMPTY,
  fromEvent,
  Observable,
  of,
  race,
  throwError,
  timer
} from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { AppService } from './app.service';
import { FeedDialogComponent } from './feed-dialog/feed-dialog.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import * as firebase from 'firebase';
import { AngularFireStorage } from '@angular/fire/storage';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 * Mega * Bytes
const IMAGE_LOAD_TIMEOUT = 100;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
    public storage: AngularFireStorage,
    private appService: AppService
  ) {}

  ngOnInit() {
    const usersRef = this.afs.collection<User>('users');

    this.user$ = this.auth.user;
    this.posts$ = this.afs
      .collection<Post>('posts')
      .snapshotChanges()
      .pipe(
        map(actions => {
            return actions.map(a => {
              const id = a.payload.doc.id;
              const post = a.payload.doc.data();
              return {
                ...post,
                id,
                image$: this.storage.ref(post.imageUrl).getDownloadURL(),
                user$: usersRef.doc<User>(post.postUserId).valueChanges()
              };
            });
          }
        )
      );

    this.storage.ref('post');
  }

  trackById(index: number, post: Post) {
    return post.id;
  }

  openFeedDialog() {
    const image$ = this.pickImage();
    const dialog$ = (url: string) =>
      this.matDialog
        .open<FeedDialogComponent, unknown, string>(FeedDialogComponent, {
          maxWidth: '95vw',
          data: url
        })
        .afterClosed();
    image$
      .pipe(
        switchMap(file =>
          this.checkImageError(file).pipe(
            switchMap(url => dialog$(url)),
            switchMap(message => {
              if (message === undefined) {
                return EMPTY;
              }
              return of(message);
            }),
            switchMap(message => this.appService.post(file, message))
          )
        )
      )
      .subscribe(
        () => {
          this.matSnackbar.open('Posted successfully!', '', { duration: 2000 });
        },
        err => {
          this.matSnackbar.open(err.statusText, '', { duration: 3000 });
        },
        () => {
          this.matSnackbar.open('What is wrong? Why did not you post?', '', {
            duration: 2000
          });
        }
      );
  }

  like(postId: string) {
    // TODO: Optimistic update
  }

  private pickImage() {
    const input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg, image/png';
    // TODO: test input click because it doesn't work in some browsers
    setTimeout(() => {
      input.click();
    }, 100);
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

  private checkImageError(file: File) {
    const img: HTMLImageElement = document.createElement('img');
    const src = URL.createObjectURL(file);
    img.src = src;
    return race(
      fromEvent(img, 'error').pipe(
        take(1),
        switchMap(() => throwError('You image is failed to load.'))
      ),
      timer(IMAGE_LOAD_TIMEOUT).pipe(map(() => src))
    );
  }
}

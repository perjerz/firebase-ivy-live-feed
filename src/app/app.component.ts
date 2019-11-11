import { Component } from '@angular/core';
import { from, fromEvent, of, race, throwError, timer } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { FeedDialogComponent } from './feed-dialog/feed-dialog.component';
import { MatDialog, MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private matDialog: MatDialog, private matSnackbar: MatSnackBar) {}

  trackByKey(index: number) {
    return index;
  }

  openFeedDialog() {
    const input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg, image/png';
    setTimeout(() => {
      input.click();
    }, 0);

    const imageSelected$ = fromEvent(input, 'change').pipe(
      switchMap(() => {
        const file = input.files[0];
        const MAX_FILE_SIZE =  4 * 1024 * 1024; // 4 * Mega * BYTE
        if (file.size > MAX_FILE_SIZE) {
          return throwError('Too large file. File is larger than 4 MB');
        }
        return of(file);
      })
    );
    const img: HTMLImageElement = document.createElement('img');

    const readFile$ = (fileReader: FileReader) => {
      return fromEvent(fileReader, 'load').pipe(take(1));
    };

    imageSelected$
      .pipe(
        switchMap(file => {
          const reader = new FileReader();
          setTimeout(() => {
            reader.readAsDataURL(file);
          }, 0);
          return readFile$(reader).pipe(map(() => reader.result));
        }),
        switchMap((result: string) => {
          setTimeout(() => {
            img.src = result;
          }, 0);
          return race(
            fromEvent(img, 'error').pipe(
              take(1),
              switchMap(() => throwError(''))
            ),
            timer(100).pipe(map(() => result))
          );
        })
      )
      .subscribe(
        base64 => {
          this.matDialog.open(FeedDialogComponent, {
            maxWidth: '95vw',
            data: base64
          });
        },
        err => {
          this.matSnackbar.open('Wrong Image');
        }
      );
  }
}

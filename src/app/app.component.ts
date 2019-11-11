import { Component } from '@angular/core';
import { fromEvent, of, race, throwError, timer } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { FeedDialogComponent } from './feed-dialog/feed-dialog.component';
import { MatDialog, MatSnackBar } from '@angular/material';

const MAX_FILE_SIZE =  4 * 1024 * 1024; // 4 * Mega * Bytes
const MAX_TIME_IMAGE_LOAD = 100;

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

  private pickImage() {
    const input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg, image/png';
    setTimeout(() => {
      input.click();
    }, 0);

    return fromEvent(input, 'change').pipe(
      switchMap(() => {
        const file = input.files[0];
        if (file.size > MAX_FILE_SIZE) {
          return throwError('Too large file. File must be less than 4 MB');
        }
        return of(file);
      })
    );
  }

  readFileToBase64(file: File) {
    const reader = new FileReader();
    const readFile$ = (fileReader: FileReader) => {
      return fromEvent(fileReader, 'load').pipe(take(1));
    };
    setTimeout(() => {
      reader.readAsDataURL(file);
    }, 0);
    return readFile$(reader).pipe(map(() => reader.result as string));
  }

  checkImageError(base64: string) {
    const img: HTMLImageElement = document.createElement('img');
    setTimeout(() => {
      img.src = base64;
    }, 0);
    return race(
      fromEvent(img, 'error').pipe(
        take(1),
        switchMap(() => throwError(''))
      ),
      timer(MAX_TIME_IMAGE_LOAD).pipe(map(() => base64))
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
}

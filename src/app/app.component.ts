import { Component } from '@angular/core';
import { fromEvent } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { FeedDialogComponent } from './feed-dialog/feed-dialog.component';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private matDialog: MatDialog) {}

  trackByKey(index: number) {
    return index;
  }

  openFeedDialog() {
    const input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg, image/png';
    const readFile$ = (fileReader: FileReader) =>  {
      return fromEvent(fileReader, 'load').pipe(take(1));
    };
    const imageSelected$ = fromEvent(input, 'change').pipe(
      take(1),
      map(() => input.files[0])
    );
    imageSelected$.pipe(
      switchMap(file => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        return readFile$(reader).pipe(map(() => reader.result));
      }),
    ).subscribe(result => {
        const base64 = result;
        this.matDialog.open(FeedDialogComponent, { maxWidth: '95vw', data: base64 });
    }, err => {
      console.error(err);
    });
    input.click();
  }
}

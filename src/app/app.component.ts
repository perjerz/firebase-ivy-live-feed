import { Component } from '@angular/core';
import { fromPromise } from 'rxjs/internal-compatibility';
import { map } from 'rxjs/operators';
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
    fromPromise(
      navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'environment' }
      })
    ).pipe(
      map((stream: MediaStream) => {
        const video = document.createElement('video');
        video.width = 1024;
        video.height = 1024;
        const canvas = document.createElement('canvas');
        video.srcObject = stream;
        canvas.width = video.width;
        canvas.height = video.height;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0);
        const img = canvas.toDataURL('img/png', 1.0);
        console.log(img);
        return img;
      })
    ).subscribe(img => {
        this.matDialog.open(FeedDialogComponent, {data: img});
    },
    err => {
      console.error(err);
    });
  }
}

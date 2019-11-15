import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, Inject, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-feed-dialog',
  templateUrl: './feed-dialog.component.html',
  styleUrls: ['./feed-dialog.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedDialogComponent implements OnInit {
  @ViewChild('textArea', { static: true }) textArea: ElementRef<HTMLTextAreaElement>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: string,
    private matDialogRef: MatDialogRef<FeedDialogComponent>,
    private matSnackbar: MatSnackBar
    ) {
  }

  ngOnInit() { }

  post() {
    const { value: message } = this.textArea.nativeElement;
    this.matDialogRef.close(message);
  }

  imageError() {
    this.matDialogRef.afterClosed().subscribe(() => {
      this.matSnackbar.open('You image is failed to load.', '', { duration: 2000 });
    });
    this.matDialogRef.close();
  }
}

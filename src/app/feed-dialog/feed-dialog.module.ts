import { FeedDialogComponent } from './feed-dialog.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSnackBarModule } from '@angular/material';

@NgModule({
  declarations: [FeedDialogComponent],
  imports: [
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  entryComponents: [FeedDialogComponent]
})
export class FeedDialogModule { }

import { FormsModule } from '@angular/forms';
import { FeedDialogComponent } from './feed-dialog.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule } from '@angular/material';

@NgModule({
  declarations: [FeedDialogComponent],
  imports: [
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatDialogModule,
    FormsModule
  ],
  entryComponents: [FeedDialogComponent]
})
export class FeedDialogModule { }

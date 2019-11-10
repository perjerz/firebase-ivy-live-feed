import { FeedDialogComponent } from './feed-dialog.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatFormFieldModule, MatInputModule } from '@angular/material';



@NgModule({
  declarations: [FeedDialogComponent],
  imports: [
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule
  ],
  entryComponents: [FeedDialogComponent]
})
export class FeedDialogModule { }

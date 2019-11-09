import { FeedDialogModule } from './feed-dialog/feed-dialog.module';
import { MatButtonModule, MatCardModule, MatIconModule, MatToolbarModule, MatDialogModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NoopAnimationsModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatDialogModule,
    FeedDialogModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

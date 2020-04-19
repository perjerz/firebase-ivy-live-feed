
import { ApiInterceptorService } from './api-interceptor.service';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireFunctionsModule } from '@angular/fire/functions';
import { environment } from '../environments/environment';
import { FeedDialogModule } from './feed-dialog/feed-dialog.module';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FirebaseCardComponent } from './firebase-card/firebase-card.component';
import { FirebaseToolbarComponent } from './firebase-toolbar/firebase-toolbar.component';

@NgModule({
  declarations: [AppComponent, FirebaseCardComponent, FirebaseToolbarComponent],
  imports: [
    BrowserModule,
    NoopAnimationsModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatBadgeModule,
    MatMenuModule,
    FeedDialogModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireFunctionsModule,
    AngularFireStorageModule,
    HttpClientModule
  ],
  providers: environment.production
    ? [
      {
        provide: HTTP_INTERCEPTORS,
        useClass: ApiInterceptorService,
        multi: true
      }
    ]
    : [],
  bootstrap: [AppComponent]
})
export class AppModule {}

import { Post } from './../app.interface';
import { Component, OnInit, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-firebase-card',
  templateUrl: './firebase-card.component.html',
  styleUrls: ['./firebase-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FirebaseCardComponent implements OnInit {
  myLike: boolean;
  @Input() post: Post;

  @Output() like = new EventEmitter<string>();

  constructor() { }

  ngOnInit() {
    this.myLike = false;
  }

  likePost() {
    this.myLike = !this.myLike;
    this.like.emit(this.post.id);
  }

  share() {
    // TODO: Web Share API
  }

}

import { Observable } from 'rxjs';

export interface User {
  displayName: string;
  photoURL: string;
}
export interface Post {
  id?: string;
  PostID: string;
  UserID: string;
  Image: string;
  image$?: Observable<string>;
  user$?: Observable<User>;
  Message: string;
  LikeUserIDs: string[];
  displayName: string;
}

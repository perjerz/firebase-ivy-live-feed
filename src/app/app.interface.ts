import { Observable } from 'rxjs';

export interface User {
  displayName: string;
  photoURL: string;
}
export interface Post {
  id?: string;
  postUserId: string;
  imageUrl: string;
  image$?: Observable<string>;
  user$?: Observable<User>;
  message: string;
  likeUserIds: string[];
  displayName: string;
}

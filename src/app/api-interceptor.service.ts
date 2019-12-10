import { environment } from './../environments/environment';
import { Observable } from 'rxjs';
import { HttpRequest, HttpInterceptor, HttpHandler } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class ApiInterceptorService implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    const newReq = req.clone({
      url: environment.cloudFunctionEndPoint + req.url
    });
    return next.handle(newReq);
  }
  constructor() {}

}

import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    return next(
      req.clone({ setHeaders: { Authorization: `Basic ${token}` } }),
    );
  }
  return next(req);
};

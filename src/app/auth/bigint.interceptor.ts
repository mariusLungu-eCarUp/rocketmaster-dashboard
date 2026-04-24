import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

export const bigIntInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.responseType !== 'json') return next(req);

  return next(req.clone({ responseType: 'text' })).pipe(
    map((event) => {
      if (event instanceof HttpResponse) {
        const body = parseSafe(event.body as string);
        return event.clone({ body });
      }
      return event;
    }),
  );
};

function parseSafe(text: string): unknown {
  if (!text) return null;
  const safe = text.replace(
    /("(?:[^"\\]|\\.)*")|-?\b(\d{16,})\b/g,
    (match, str) => str ?? `"${match}"`,
  );
  try {
    return JSON.parse(safe);
  } catch {
    return JSON.parse(text);
  }
}

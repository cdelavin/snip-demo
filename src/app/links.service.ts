import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';

export interface Link {
  code: string;
  url: string;
  shortUrl: string;
  hits: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class LinksService {
  private base = 'http://localhost:3000';

  create(url: string): Observable<Link> {
    return from(
      fetch(`${this.base}/api/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      }).then(r => r.json() as Promise<Link>)
    );
  }

  list(): Observable<Link[]> {
    return from(
      fetch(`${this.base}/api/links`).then(r => r.json() as Promise<Link[]>)
    );
  }
}

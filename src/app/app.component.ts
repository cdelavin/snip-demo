import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LinksService, Link } from './links.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  template: `
    <main>
      <h1>Snip</h1>

      <section class="card">
        <h2>Shorten a URL</h2>
        <form (ngSubmit)="submit()">
          <input
            type="url"
            name="url"
            [(ngModel)]="urlInput"
            placeholder="https://example.com"
            autocomplete="off"
            required
          />
          <button type="submit" [disabled]="submitting()">
            {{ submitting() ? 'Shortening\u2026' : 'Shorten' }}
          </button>
        </form>
        @if (error()) {
          <p class="msg error">{{ error() }}</p>
        }
        @if (createdLink()) {
          <p class="msg success">
            &#x2713; Short link:
            <a [href]="createdLink()!.shortUrl" target="_blank" rel="noopener">
              {{ createdLink()!.shortUrl }}
            </a>
          </p>
        }
      </section>

      <section class="card">
        <h2>All links</h2>
        @if (links().length === 0) {
          <p class="empty">No links yet.</p>
        } @else {
          <table>
            <thead>
              <tr><th>Code</th><th>Original URL</th><th>Hits</th></tr>
            </thead>
            <tbody>
              @for (link of links(); track link.code) {
                <tr>
                  <td><a [href]="link.shortUrl" target="_blank" rel="noopener">{{ link.code }}</a></td>
                  <td class="url-cell" [title]="link.url">{{ link.url }}</td>
                  <td class="hits">{{ link.hits }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </main>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    main {
      max-width: 760px;
      margin: 2rem auto;
      padding: 0 1rem;
      font-family: system-ui, sans-serif;
      color: #111;
      background: #f5f5f5;
      min-height: 100vh;
    }

    h1 {
      font-size: 2rem;
      font-weight: 700;
      padding-top: 2rem;
      margin-bottom: 1.5rem;
      color: #7c3aed;
      letter-spacing: -0.5px;
    }

    h2 {
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #555;
      margin-bottom: 0.75rem;
    }

    .card {
      background: #fff;
      border-radius: 8px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }

    form { display: flex; gap: 0.5rem; }

    input[type="url"] {
      flex: 1;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.95rem;
      outline: none;
    }

    input[type="url"]:focus {
      border-color: #7c3aed;
      box-shadow: 0 0 0 2px rgba(124,58,237,.15);
    }

    button {
      padding: 0.5rem 1.25rem;
      background: #7c3aed;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 0.95rem;
      cursor: pointer;
      white-space: nowrap;
    }

    button:disabled { opacity: .6; cursor: not-allowed; }

    .msg { margin-top: 0.6rem; font-size: 0.9rem; }
    .error { color: #dc2626; }
    .success a { color: #7c3aed; font-weight: 600; word-break: break-all; }

    .empty { color: #888; font-size: 0.9rem; }

    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }

    th {
      text-align: left;
      padding: 0.4rem 0.5rem;
      border-bottom: 2px solid #e5e7eb;
      font-weight: 600;
      color: #555;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    td {
      padding: 0.5rem;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: middle;
    }

    td a { color: #7c3aed; font-weight: 600; text-decoration: none; }
    td a:hover { text-decoration: underline; }

    .url-cell {
      max-width: 420px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #444;
    }

    .hits { text-align: right; font-variant-numeric: tabular-nums; color: #666; }
  `],
})
export class AppComponent implements OnInit {
  private svc = inject(LinksService);

  urlInput = '';
  submitting = signal(false);
  createdLink = signal<Link | null>(null);
  error = signal<string | null>(null);
  links = signal<Link[]>([]);

  ngOnInit() {
    this.loadLinks();
  }

  private loadLinks() {
    this.svc.list().subscribe({ next: (list) => this.links.set(list) });
  }

  private validUrl(raw: string): boolean {
    try {
      const { protocol } = new URL(raw);
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  }

  submit() {
    const url = this.urlInput.trim();
    if (!this.validUrl(url)) {
      this.error.set('Please enter a valid http or https URL.');
      return;
    }
    this.submitting.set(true);
    this.createdLink.set(null);
    this.error.set(null);

    this.svc.create(url).subscribe({
      next: (link) => {
        this.createdLink.set(link);
        this.urlInput = '';
        this.submitting.set(false);
        this.loadLinks();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.error ?? 'Network error \u2014 is the backend running?');
        this.submitting.set(false);
      },
    });
  }
}

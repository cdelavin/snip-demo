import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LinksService, Link } from './links.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  styleUrl: './app.component.css',
  template: `
    <div class="page">
      <div class="glow g1" aria-hidden="true"></div>
      <div class="glow g2" aria-hidden="true"></div>
      <div class="glow g3" aria-hidden="true"></div>

      <header class="hero">
        <h1>Snip it,&nbsp;share it.</h1>
        <p class="sub">Paste a long URL — get a crisp short link instantly.</p>
      </header>

      <main>
        <div class="prompt-card">
          <form (ngSubmit)="submit()">
            <input
              type="url"
              name="url"
              [(ngModel)]="urlInput"
              class="prompt-input"
              placeholder="Paste a URL to shorten…"
              autocomplete="off"
            />
            <button
              class="prompt-btn"
              type="submit"
              [disabled]="submitting()"
              aria-label="Shorten"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"/>
                <polyline points="5 12 12 5 19 12"/>
              </svg>
            </button>
          </form>

          @if (error()) {
            <p class="notice notice-error">{{ error() }}</p>
          }
          @if (createdLink()) {
            <p class="notice notice-success">
              <span aria-hidden="true">&#x2713;</span>
              <a [href]="createdLink()!.shortUrl" target="_blank" rel="noopener">
                {{ createdLink()!.shortUrl }}
              </a>
            </p>
          }
        </div>

        @if (links().length > 0) {
          <div class="links-card">
            <p class="card-eyebrow">Recent links</p>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Original URL</th>
                  <th>Hits</th>
                </tr>
              </thead>
              <tbody>
                @for (link of links(); track link.code) {
                  <tr>
                    <td>
                      <a class="code-link" [href]="link.shortUrl" target="_blank" rel="noopener">
                        {{ link.code }}
                      </a>
                    </td>
                    <td class="url-cell" [title]="link.url">{{ link.url }}</td>
                    <td class="hits-cell">{{ link.hits }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </main>
    </div>
  `,
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
        this.error.set(err.error?.error ?? 'Network error — is the backend running?');
        this.submitting.set(false);
      },
    });
  }
}
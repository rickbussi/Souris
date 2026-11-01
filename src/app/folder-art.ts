import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-folder-art',
  template: `
    <svg [attr.viewBox]="compact ? '86 36 380 236' : '0 0 520 330'"
      [class.open]="open" role="img" [attr.aria-label]="open ? 'Dossier Images ouvert' : 'Dossier Images fermé'">
      <defs>
        <linearGradient id="folder-back-color" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#FFB51A" />
          <stop offset="1" stop-color="#E99A00" />
        </linearGradient>
        <linearGradient id="folder-front-color" x1="0" y1="0" x2="0.12" y2="1">
          <stop offset="0" stop-color="#FFD11A" />
          <stop offset="1" stop-color="#FFB800" />
        </linearGradient>
      </defs>
      <path d="M 96 260 V 58 Q 96 43 111 43 H 226 Q 233 43 237 50 L 259 73
        Q 264 78 271 78 H 410 Q 425 78 425 93 V 260 Z" fill="url(#folder-back-color)" />
      <path d="M 96 77 H 425 V 108 H 96 Z" fill="#D98C00" opacity=".55" />
      @if (!compact) {
        <g class="previews">
          @for (photo of photos; track photo.file) {
            <g [attr.transform]="'translate(' + photo.x + ' ' + photo.y + ') rotate(' + photo.angle + ' 46 54)'">
              <rect width="92" height="108" rx="3" fill="white" stroke="#D3D7DF" />
              <image x="5" y="5" width="82" height="78" preserveAspectRatio="xMidYMid slice"
                [attr.href]="'/assets/' + photo.file" />
            </g>
          }
        </g>
      }
      <g class="folder-front">
        <path d="M 109 78 H 412 Q 425 78 425 91 V 246 Q 425 260 411 260
          H 96 V 91 Q 96 78 109 78 Z" fill="url(#folder-front-color)"
          stroke="#E9A000" stroke-width="1" />
        <path d="M 99 256 V 91 Q 99 81 110 81 H 412" fill="none"
          stroke="#FFE88D" stroke-width="2.5" opacity=".8" stroke-linecap="round" />
      </g>
      @if (!compact) {
        <text x="260" y="304" text-anchor="middle" fill="#17345C" font-size="21" font-weight="600">Images</text>
      }
    </svg>
  `
})
export class FolderArt {
  @Input() open = false;
  @Input() compact = false;
  readonly photos = [
    { file: 'cappuccino-heart.png', x: 122, y: 144, angle: -8 },
    { file: 'suv-gris.png', x: 187, y: 132, angle: 7 },
    { file: 'ballon-plage.png', x: 247, y: 144, angle: -4 },
    { file: 'cavalier-echecs.png', x: 306, y: 135, angle: 10 }
  ];
}

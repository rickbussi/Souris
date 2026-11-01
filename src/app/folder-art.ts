import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-folder-art',
  template: `
    <svg [attr.viewBox]="compact ? '75 104 376 176' : '0 0 520 330'"
      [class.open]="open" role="img" aria-label="Dossier Images">
      <path d="M 78 132 L 78 113 Q 78 106 86 106 L 181 106 L 201 128 L 438 128
        Q 449 128 449 139 L 449 267 Q 449 277 438 277 L 89 277 Q 78 277 78 267 Z"
        fill="#DCA23C" stroke="#AA711E" stroke-width="2" />
      @if (!compact) {
        <path class="opening" d="M 83 163 L 444 163 L 438 200 L 89 200 Z" fill="#916222" />
        <g class="previews">
          @for (image of images; track image; let i = $index) {
            <g [attr.transform]="'translate(' + (97 + i * 87) + ' 176) rotate(' + rotations[i] + ' 39 46)'">
              <rect width="78" height="92" rx="2" fill="white" stroke="#D3D7DF" />
              <image x="5" y="5" width="68" height="68" preserveAspectRatio="xMidYMid slice"
                [attr.href]="'/assets/' + image" />
            </g>
          }
        </g>
      }
      <path class="folder-front" d="M 82 151 L 446 151 L 433 269 Q 432 278 422 278
        L 105 278 Q 96 278 94 269 Z" fill="#F8C958" stroke="#B67B20" stroke-width="2" />
      @if (!compact) {
        <text x="260" y="309" text-anchor="middle" fill="#17345C" font-size="21" font-weight="600">Images</text>
      }
    </svg>
  `
})
export class FolderArt {
  @Input() open = false;
  @Input() compact = false;
  readonly images = ['cappuccino-heart.png', 'suv-gris.png', 'ballon-plage.png', 'cavalier-echecs.png'];
  readonly rotations = [-5, -2, 3, 6];
}

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-trash-art',
  template: `
    <svg viewBox="0 0 160 210" role="img"
      [attr.aria-label]="images.length ? 'Corbeille contenant ' + images.length + ' image' + (images.length > 1 ? 's' : '') : 'Corbeille vide'">
      <path d="M 29 39 H 131 L 121 180 Q 120 191 109 191 H 51 Q 40 191 39 180 Z"
        fill="#8db2ca" opacity=".38" />
      @for (file of images; track file; let i = $index) {
        <g [attr.transform]="'translate(' + positions[i].x + ' ' + positions[i].y + ') rotate(' + positions[i].angle + ' 23 27)'">
          <rect width="46" height="55" rx="2" fill="#fff" stroke="#b8c4cf" />
          <image x="3" y="3" width="40" height="40" preserveAspectRatio="xMidYMid slice"
            [attr.href]="'/assets/' + file" />
        </g>
      }
      <path d="M 29 39 H 131 L 121 180 Q 120 191 109 191 H 51 Q 40 191 39 180 Z"
        fill="#d9ecfa" fill-opacity=".55" stroke="#8aa8bb" stroke-width="2" />
      <path d="M 31 42 L 41 179 Q 42 185 47 187 H 55 L 41 42 Z" fill="#acd5f1" opacity=".55" />
      <path d="M 119 42 L 108 187 H 113 Q 118 187 119 179 L 129 42 Z" fill="#acd5f1" opacity=".55" />
      <text x="80" y="164" text-anchor="middle" font-family="Segoe UI Symbol, sans-serif"
        font-size="51" fill="#2679bb" opacity=".55">♻</text>
      <path d="M 25 24 H 135 Q 143 24 143 32 L 141 40 Q 140 47 133 47 H 27
        Q 20 47 19 40 L 17 32 Q 17 24 25 24 Z" fill="#849ba7" />
      <path d="M 39 179 H 121 L 120 187 Q 119 196 110 196 H 50 Q 41 196 40 187 Z"
        fill="#839ba7" />
    </svg>
  `
})
export class TrashArt {
  @Input() images: ReadonlyArray<string> = [];
  readonly positions = [
    { x: 43, y: 75, angle: -9 },
    { x: 69, y: 82, angle: 8 },
    { x: 39, y: 112, angle: -5 },
    { x: 71, y: 118, angle: 10 }
  ];
}

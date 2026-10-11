import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  templateUrl: './section-placeholder.html',
  styleUrl: './section-placeholder.scss',
})
export class SectionPlaceholder {
  readonly title = inject(ActivatedRoute).snapshot.data['title'] as string;
}

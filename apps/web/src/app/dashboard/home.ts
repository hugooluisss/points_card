import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KpiCard } from '../components/kpi-card/kpi-card';

@Component({
  standalone: true,
  imports: [RouterLink, KpiCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}

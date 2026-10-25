
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { DataService } from '../data.service';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false,
})
export class MapsPage implements OnInit {
  map!: L.Map;

  private dataService = inject(DataService);
  private router = inject(Router);

  constructor() {}

  async loadPoints() {
    try {
      const points: any = await this.dataService.getPoints();

      if (!points) return;

      for (const key in points) {
        if (Object.prototype.hasOwnProperty.call(points, key)) {
          const point = points[key];

          const coordinates = point.coordinates
            .split(',')
            .map((c: string) => parseFloat(c));

          const marker = L.marker(
            coordinates as L.LatLngExpression
          ).addTo(this.map);

          marker.bindPopup(`
            <b>${point.name}</b><br>
            <ion-button color="warning" size="small"
              class="edit-link" data-key="${key}">
              <ion-icon name="create-outline"></ion-icon>
            </ion-button>
            <ion-button color="danger" size="small"
              class="delete-link" data-key="${key}">
              <ion-icon name="trash-outline"></ion-icon>
            </ion-button>
          `);
        }
      }

      this.map.on('popupopen', (e) => {
        const popup = e.popup;
        const popupElement = popup.getElement();

        if (!popupElement) return;

        const editButton =
          popupElement.querySelector('.edit-link');

        if (editButton) {
          editButton.addEventListener('click', (event) => {
            event.preventDefault();

            const key = (
              event.currentTarget as HTMLElement
            ).dataset['key'];

            if (key) {
              this.router.navigate(['/editpoint', key]);
            }
          });
        }

        const deleteButton =
          popupElement.querySelector('.delete-link');

        if (deleteButton) {
          deleteButton.addEventListener('click', async (event) => {
            event.preventDefault();

            const key = (
              event.currentTarget as HTMLElement
            ).dataset['key'];

            if (key) {
              await this.deletePoint(key, popup.getLatLng());
              this.map.closePopup();
            }
          });
        }
      });

    } catch (error) {
      console.error('Gagal memuat point:', error);
    }
  }

  async deletePoint(
    key: string,
    latLng: L.LatLng | undefined
  ) {
    try {
      await this.dataService.deletePoint(key);

      if (latLng) {
        this.map.eachLayer((layer) => {
          if (
            layer instanceof L.Marker &&
            layer.getLatLng().equals(latLng)
          ) {
            this.map.removeLayer(layer);
          }
        });
      }
    } catch (error) {
      console.error('Gagal menghapus point:', error);
    }
  }

  ngOnInit() {
    const iconRetinaUrl = 'assets/icon/marker-icon-2x.png';
    const iconUrl = 'assets/icon/marker-icon.png';
    const shadowUrl = 'assets/icon/marker-shadow.png';

    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

    L.Marker.prototype.options.icon = iconDefault;

    if (!this.map) {
      setTimeout(() => {
        this.map = L.map('map').setView(
          [-7.7956, 110.3695],
          13
        );

        const osm = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; OpenStreetMap contributors'
          }
        );

        osm.addTo(this.map);

        L.marker([-7.7956, 110.3695])
          .addTo(this.map)
          .bindPopup('Yogyakarta');

        this.loadPoints();
      });
    }
  }
}

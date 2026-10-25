import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, AlertController } from '@ionic/angular';
import * as L from 'leaflet';
import { DataService } from '../data.service';

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

@Component({
  selector: 'app-editpoint',
  templateUrl: './editpoint.page.html',
  styleUrls: ['./editpoint.page.scss'],
  standalone: false,
})
export class EditpointPage implements OnInit {

  map!: L.Map;
  key = '';
  name = '';
  coordinates = '';

  private route = inject(ActivatedRoute);
  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private dataService = inject(DataService);

  constructor() { }

  async ngOnInit() {
    this.key = this.route.snapshot.paramMap.get('key') || '';

    try {
      const point: any = await this.dataService.getPoint(this.key);

      if (!point) {
        await this.showAlert(
          'Data Tidak Ditemukan',
          'Point yang dipilih tidak ditemukan.'
        );
        this.navCtrl.back();
        return;
      }

      this.name = point.name;
      this.coordinates = point.coordinates;

      setTimeout(() => {
        const latLng = this.coordinates
          .split(',')
          .map((value) => parseFloat(value));

        this.map = L.map('mapedit').setView(
          latLng as L.LatLngExpression,
          13
        );

        const osm = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; OpenStreetMap contributors'
          }
        );

        const esri = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Tiles &copy; Esri'
          }
        );

        osm.addTo(this.map);

        const baseMaps = {
          'OpenStreetMap': osm,
          'Esri World Imagery': esri
        };

        L.control.layers(baseMaps).addTo(this.map);

        const marker = L.marker(
          latLng as L.LatLngExpression,
          { draggable: true }
        ).addTo(this.map);

        marker.bindPopup(
          'Geser marker untuk mengubah koordinat lokasi.'
        );

        marker.openPopup();

        marker.on('dragend', (event) => {
          const position = event.target.getLatLng();

          const lat = position.lat.toFixed(9);
          const lng = position.lng.toFixed(9);

          this.coordinates = `${lat},${lng}`;
        });
      });
    } catch (error: any) {
      await this.showAlert(
        'Gagal Memuat Data',
        error.message || 'Data point gagal dimuat.'
      );
    }
  }

  async save() {
    if (!this.name.trim() || !this.coordinates.trim()) {
      await this.showAlert(
        'Data Belum Lengkap',
        'Nama dan koordinat harus diisi.'
      );
      return;
    }

    try {
      await this.dataService.updatePoint(this.key, {
        name: this.name.trim(),
        coordinates: this.coordinates.trim()
      });

      this.navCtrl.back();
    } catch (error: any) {
      await this.showAlert(
        'Save Failed',
        error.message || 'Perubahan point gagal disimpan.'
      );
    }
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }
}

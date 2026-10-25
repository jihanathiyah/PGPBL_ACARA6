import { Injectable } from '@angular/core';
import {
  ref,
  push,
  onValue,
  remove,
  get,
  update
} from 'firebase/database';

import { database } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // Save a new point
  savePoint(point: { name: string; coordinates: string }) {
    const pointsRef = ref(database, 'points');
    return push(pointsRef, point);
  }

  // Get all points
  getPoints() {
    const pointsRef = ref(database, 'points');

    return new Promise((resolve, reject) => {
      onValue(
        pointsRef,
        (snapshot) => {
          resolve(snapshot.val());
        },
        (error) => {
          reject(error);
        },
        { onlyOnce: true }
      );
    });
  }

  // Get one point by key
  getPoint(key: string) {
    const pointRef = ref(database, `points/${key}`);

    return get(pointRef).then((snapshot) => {
      return snapshot.val();
    });
  }

  // Update an existing point
  updatePoint(
    key: string,
    point: { name: string; coordinates: string }
  ) {
    const pointRef = ref(database, `points/${key}`);
    return update(pointRef, point);
  }

  // Delete an existing point
  deletePoint(key: string) {
    const pointRef = ref(database, `points/${key}`);
    return remove(pointRef);
  }
}

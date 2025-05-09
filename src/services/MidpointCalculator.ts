import { Location } from "../models/locationTypes";

/**
 * A utility class that provides methods for calculating midpoints and distances between geographic locations.
 */
export class MidpointCalculator {
  /**
   * Converts degrees to radians.
   */
  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180.0);
  }

  /**
   * Converts radians to degrees.
   */
  private static radiansToDegrees(radians: number): number {
    return radians * (180.0 / Math.PI);
  }

  /**
   * Calculates the geographic midpoint between two locations.
   */
  static calculateGeographicMidpoint(locationA: Location, locationB: Location): Location {
    const lat1 = this.degreesToRadians(locationA.latitude);
    const lon1 = this.degreesToRadians(locationA.longitude);
    const lat2 = this.degreesToRadians(locationB.latitude);
    const lon2 = this.degreesToRadians(locationB.longitude);

    const x1 = Math.cos(lat1) * Math.cos(lon1);
    const y1 = Math.cos(lat1) * Math.sin(lon1);
    const z1 = Math.sin(lat1);

    const x2 = Math.cos(lat2) * Math.cos(lon2);
    const y2 = Math.cos(lat2) * Math.sin(lon2);
    const z2 = Math.sin(lat2);

    const x = (x1 + x2) / 2;
    const y = (y1 + y2) / 2;
    const z = (z1 + z2) / 2;

    const lon = Math.atan2(y, x);
    const hyp = Math.sqrt(x * x + y * y);
    const lat = Math.atan2(z, hyp);

    const midpointLat = this.radiansToDegrees(lat);
    const midpointLon = this.radiansToDegrees(lon);

    return {
      name: "Midpoint",
      latitude: midpointLat,
      longitude: midpointLon,
    };
  }

  /**
   * Calculates a weighted midpoint between two locations based on specified weights.
   */
  static calculateWeightedMidpoint(
    locationA: Location,
    locationB: Location,
    weightA: number,
    weightB: number
  ): Location {
    const totalWeight = weightA + weightB;
    if (totalWeight === 0) { // Avoid division by zero if both weights are 0
        // Return geographic midpoint or handle as an error/specific case
        return this.calculateGeographicMidpoint(locationA, locationB);
    }
    const normalizedWeightA = weightA / totalWeight;
    const normalizedWeightB = weightB / totalWeight;

    const lat1 = this.degreesToRadians(locationA.latitude);
    const lon1 = this.degreesToRadians(locationA.longitude);
    const lat2 = this.degreesToRadians(locationB.latitude);
    const lon2 = this.degreesToRadians(locationB.longitude);

    const x1 = Math.cos(lat1) * Math.cos(lon1);
    const y1 = Math.cos(lat1) * Math.sin(lon1);
    const z1 = Math.sin(lat1);

    const x2 = Math.cos(lat2) * Math.cos(lon2);
    const y2 = Math.cos(lat2) * Math.sin(lon2);
    const z2 = Math.sin(lat2);

    // Corrected weight application
    const x = x1 * normalizedWeightA + x2 * normalizedWeightB;
    const y = y1 * normalizedWeightA + y2 * normalizedWeightB;
    const z = z1 * normalizedWeightA + z2 * normalizedWeightB;

    const lon = Math.atan2(y, x);
    const hyp = Math.sqrt(x * x + y * y);
    const lat = Math.atan2(z, hyp);

    const midpointLat = this.radiansToDegrees(lat);
    const midpointLon = this.radiansToDegrees(lon);

    return {
      name: "Weighted Midpoint",
      latitude: midpointLat,
      longitude: midpointLon,
    };
  }

  /**
   * Calculates the great-circle distance between two locations in kilometers using the Haversine formula.
   */
  static calculateDistance(locationA: Location, locationB: Location): number {
    const earthRadius = 6371.0; // Earth's radius in kilometers

    const lat1 = this.degreesToRadians(locationA.latitude);
    const lon1 = this.degreesToRadians(locationA.longitude);
    const lat2 = this.degreesToRadians(locationB.latitude);
    const lon2 = this.degreesToRadians(locationB.longitude);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    return distance;
  }
}


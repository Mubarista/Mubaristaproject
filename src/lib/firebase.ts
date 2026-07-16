// Mock Firebase functions for demo mode - Firebase is not connected

export function getFirebaseDb() {
  throw new Error("Firebase is not connected in demo mode");
}

export function getFirebaseAuth() {
  throw new Error("Firebase is not connected in demo mode");
}

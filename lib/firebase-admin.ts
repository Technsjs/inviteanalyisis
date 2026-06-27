import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { ServiceAccount } from "firebase-admin/app";

let app: App | undefined;
let db: Firestore | undefined;

function getAdminApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0]!;
    return app;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is missing. Download a service account JSON from Firebase Console → Project settings → Service accounts.",
    );
  }

  const serviceAccount = JSON.parse(raw) as ServiceAccount;

  app = initializeApp({
    credential: cert(serviceAccount),
  });

  return app;
}

export function getAdminDb(): Firestore {
  if (!db) db = getFirestore(getAdminApp());
  return db;
}

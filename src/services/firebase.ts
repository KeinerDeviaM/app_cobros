import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'cobroapp-keiner-35b05',
  appId: '1:317717233519:web:8a4cec4aecfb1f6553729a',
  storageBucket: 'cobroapp-keiner-35b05.firebasestorage.app',
  apiKey: 'AIzaSyD9dg7VxvnON-mMcCkpF2UAnby1dbUt_eY',
  authDomain: 'cobroapp-keiner-35b05.firebaseapp.com',
  messagingSenderId: '317717233519',
  measurementId: 'G-E0BXY5HJNB'
};

export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
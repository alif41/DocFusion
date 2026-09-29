import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface DocumentRecord {
  id: string;
  userId: string;
  title: string;
  toolType: 'merge' | 'split' | 'compress' | 'edit';
  pageCount?: number;
  originalSize?: number;
  finalSize?: number;
  savedBytes?: number;
  createdAt: any;
  metadata?: Record<string, any>;
}

export interface SavedSignatureRecord {
  id: string;
  userId: string;
  label: string;
  dataUrl: string;
  createdAt: any;
}

export interface ActivityLogRecord {
  id: string;
  userId: string;
  action: string;
  details?: string;
  timestamp: any;
}

// 1. Record document action in Firestore
export const recordDocumentOperation = async (
  userId: string,
  data: Omit<DocumentRecord, 'id' | 'userId' | 'createdAt'>
): Promise<string> => {
  try {
    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const docRef = doc(db, 'documents', docId);

    const record: DocumentRecord = {
      id: docId,
      userId,
      ...data,
      createdAt: serverTimestamp(),
    };

    await setDoc(docRef, record);

    // Also log user activity
    await logUserActivity(
      userId,
      `Processed ${data.toolType.toUpperCase()} document`,
      `Processed "${data.title}" (${data.pageCount || 1} pages)`
    );

    return docId;
  } catch (err) {
    console.warn('Could not record document operation to Firestore:', err);
    return '';
  }
};

// 2. Fetch user's processed documents
export const getUserDocuments = async (userId: string): Promise<DocumentRecord[]> => {
  try {
    const q = query(
      collection(db, 'documents'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as DocumentRecord);
  } catch (err) {
    console.warn('Could not load user documents from Firestore:', err);
    return [];
  }
};

// 3. Delete document record
export const deleteDocumentRecord = async (docId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'documents', docId));
  } catch (err) {
    console.warn('Could not delete document record:', err);
  }
};

// 4. Save and retrieve digital signatures
export const saveUserSignatureRecord = async (
  userId: string,
  label: string,
  dataUrl: string
): Promise<string> => {
  try {
    const sigId = `sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const sigRef = doc(db, 'signatures', sigId);

    const record: SavedSignatureRecord = {
      id: sigId,
      userId,
      label,
      dataUrl,
      createdAt: serverTimestamp(),
    };

    await setDoc(sigRef, record);
    return sigId;
  } catch (err) {
    console.warn('Could not save signature to Firestore:', err);
    return '';
  }
};

export const getUserSignatures = async (userId: string): Promise<SavedSignatureRecord[]> => {
  try {
    const q = query(
      collection(db, 'signatures'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SavedSignatureRecord);
  } catch (err) {
    console.warn('Could not load user signatures:', err);
    return [];
  }
};

export const deleteUserSignature = async (sigId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'signatures', sigId));
  } catch (err) {
    console.warn('Could not delete signature:', err);
  }
};

// 5. Activity Logs
export const logUserActivity = async (
  userId: string,
  action: string,
  details?: string
): Promise<void> => {
  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const logRef = doc(db, 'activityLogs', logId);

    const record: ActivityLogRecord = {
      id: logId,
      userId,
      action,
      details,
      timestamp: serverTimestamp(),
    };

    await setDoc(logRef, record);
  } catch (err) {
    console.warn('Could not log activity:', err);
  }
};

export const getUserActivityLogs = async (userId: string): Promise<ActivityLogRecord[]> => {
  try {
    const q = query(
      collection(db, 'activityLogs'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(25)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ActivityLogRecord);
  } catch (err) {
    console.warn('Could not fetch activity logs:', err);
    return [];
  }
};

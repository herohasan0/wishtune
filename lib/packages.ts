import { db } from './firebase';

const PACKAGES_COLLECTION = 'creditPackages';

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
  description: string;
  active?: boolean;
  createdAt?: FirebaseFirestore.Timestamp | null;
  updatedAt?: FirebaseFirestore.Timestamp | null;
}

/**
 * Get all active credit packages
 */
export async function getCreditPackages(): Promise<CreditPackage[]> {
  try {
    // Try to fetch with orderBy first (requires composite index)
    try {
      const packagesSnapshot = await db
        .collection(PACKAGES_COLLECTION)
        .where('active', '==', true)
        .orderBy('price', 'asc')
        .get();

      const packages = packagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CreditPackage[];

      return packages;
    } catch (orderByError: unknown) {
      // If orderBy fails (likely due to missing index), fetch without orderBy
      const error = orderByError as { code?: number; message?: string };
      if (error?.code === 9 || error?.message?.includes('index')) {
        console.warn('⚠️ Composite index not found, fetching without orderBy');
        const packagesSnapshot = await db
          .collection(PACKAGES_COLLECTION)
          .where('active', '==', true)
          .get();

        const packages = packagesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CreditPackage[];

        const sorted = packages.sort((a, b) => a.price - b.price);
        return sorted;
      }
      throw orderByError;
    }
  } catch (error: unknown) {
    console.error('❌ Error fetching credit packages:', error);
    
    // Final fallback: fetch all packages and filter in memory
    try {
      const packagesSnapshot = await db
        .collection(PACKAGES_COLLECTION)
        .get();

      const allPackages = packagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CreditPackage[];

      // Filter active packages (or packages without active field, treating them as active)
      const activePackages = allPackages.filter(
        (pkg) => pkg.active !== false
      );

      const sorted = activePackages.sort((a, b) => a.price - b.price);
      return sorted;
    } catch (fallbackError) {
      console.error('❌ Error fetching credit packages (final fallback):', fallbackError);
      // Return empty array instead of throwing to prevent page crash
      return [];
    }
  }
}

/**
 * Get a specific credit package by ID
 */
export async function getCreditPackageById(packageId: string): Promise<CreditPackage | null> {
  try {
    const packageDoc = await db
      .collection(PACKAGES_COLLECTION)
      .doc(packageId)
      .get();

    if (!packageDoc.exists) {
      return null;
    }

    return {
      id: packageDoc.id,
      ...packageDoc.data(),
    } as CreditPackage;
  } catch (error) {
    console.error('Error fetching credit package:', error);
    throw error;
  }
}


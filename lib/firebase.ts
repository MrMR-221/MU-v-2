import * as admin from 'firebase-admin';

// Interface for our service account environment variables
// واجهة للمتغيرات البيئية الخاصة بحساب الخدمة
interface FirebaseParams {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

// Function to format private key correctly
// دالة لتنسيق المفتاح الخاص بشكل صحيح (يتطلب استبدال \n)
const formatPrivateKey = (key: string) => {
    return key.replace(/\\n/g, '\n');
};

// Singleton initialization to prevent multiple instances in Next.js hot reload
// تهيئة Firebase كـ Singleton لتجنب إعادة التهيئة المتكررة
if (!admin.apps.length) {
    const params: FirebaseParams = {
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
    };

    if (params.projectId && params.clientEmail && params.privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: params.projectId,
                clientEmail: params.clientEmail,
                privateKey: formatPrivateKey(params.privateKey),
            }),
        });
        console.log("Firebase Admin Initialized Successfully");
    } else {
        // We log a warning but don't crash, allowing the app to build even without keys
        console.warn("Firebase Admin keys missing in environment variables. Functionality will be limited.");
    }
}

// Export Firestore instance
// تصدير مثيل قاعدة البيانات لاستخدامه في باقي التطبيق
export const db = admin.firestore();

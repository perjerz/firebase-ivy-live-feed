import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase);

export const createUserDocument = functions.auth.user().onCreate((request) => {
  const { displayName, photoURL, uid } = request;
  admin.firestore().collection('users').doc(uid).set({
    displayName,
    photoURL,
  })
  .then(() => {
    console.log(`Succeeded to create uid ${uid} Firestore document`);
  })
  .catch(err => {
    console.error(`Failed to create uid ${uid} Firestore document`);
  });
});

export const deleteUserDocument = functions.auth.user().onDelete((request) => {
  const userDoc = admin.firestore().collection('users').doc(request.uid);
  if (userDoc) {
    userDoc.delete()
    .then(() => {
      console.log(`Succeeded to delete ${request.uid}`);
    })
    .catch(() => {
      console.error(`Failed to delete ${request.uid}`);
    });
  }
});

export const deleteUserAuth = functions.firestore.document('users/{uid}').onDelete(async (snapshot) => {
  const data = snapshot.data();
  if (data) {
    const { uid } = data;
    const user = await admin.auth().getUser(uid);
    if (user) {
      try {
        await admin.auth().deleteUser(user.uid);
        console.log(`Succeeded to delete ${uid}`);
      }
      catch (err) {
        console.error(`Failed to delete ${uid}`);
      }
    }
  }
});

// import * as path from 'path';
// import * as os from 'os';
// import * as fs from 'fs';
//
// import * as Busboy from 'busboy';

// export const updatePostCollection = functions.https.onRequest( async(req, res) => {
//
//   if (req.method !== 'POST') {
//     // Return a "method not allowed" error
//     return res.status(405).end();
//   }
//
//   if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
//     !(req.cookies && req.cookies.__session)) {
//     console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
//       'Make sure you authorize your request by providing the following HTTP header:',
//       'Authorization: Bearer <Firebase ID Token>',
//       'or by passing a "__session" cookie.');
//     res.status(403).send('Unauthorized');
//     return;
//   }
//
//   let idToken;
//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
//     console.log('Found "Authorization" header');
//     // Read the ID Token from the Authorization header.
//     idToken = req.headers.authorization.split('Bearer ')[1];
//   } else if(req.cookies) {
//     console.log('Found "__session" cookie');
//     // Read the ID Token from cookie.
//     idToken = req.cookies.__session;
//   } else {
//     // No cookie
//     res.status(403).send('Unauthorized');
//     return;
//   }
//
//   try {
//     const decodedIdToken = await admin.auth().verifyIdToken(idToken);
//     console.log('ID Token correctly decoded', decodedIdToken);
//     req.user = decodedIdToken;
//   } catch (error) {
//     console.error('Error while verifying Firebase ID token:', error);
//     res.status(403).send('Unauthorized');
//     return;
//   }
//
//   const busboy = new Busboy({
//     headers: req.headers,
//     limits: { fileSize: 4 * 1024 * 1024}
//   });
//   const tmpdir = os.tmpdir();
//
//   // This object will accumulate all the fields, keyed by their name
//   const fields: {[key: string]: string } = {};
//
//   // This object will accumulate all the uploaded files, keyed by their name.
//   const uploads: {[key: string]: string } = {};
//
//   // This code will process each non-file field in the form.
//   busboy.on('field', (fieldname, val) => {
//     // TODO(developer): Process submitted field values here
//     console.log(`Processed field ${fieldname}: ${val}.`);
//     fields[fieldname] = val;
//   });
//
//   const fileWrites: Promise<unknown>[] = [];
//
//   // This code will process each file uploaded.
//   busboy.on('file', (fieldname, file, filename) => {
//     // Note: os.tmpdir() points to an in-memory file system on GCF
//     // Thus, any files in it must fit in the instance's memory.
//     console.log(`Processed file ${filename}`);
//     const filepath = path.join(tmpdir, filename);
//     uploads[fieldname] = filepath;
//
//     const writeStream = fs.createWriteStream(filepath);
//     file.pipe(writeStream);
//
//     // File was processed by Busboy; wait for it to be written to disk.
//     const promise = new Promise((resolve, reject) => {
//       file.on('end', () => {
//         writeStream.end();
//       });
//       writeStream.on('finish', resolve);
//       writeStream.on('error', reject);
//     });
//     fileWrites.push(promise);
//   });
//
//   // Triggered once all uploaded files are processed by Busboy.
//   // We still need to wait for the disk writes (saves) to complete.
//   busboy.on('finish', () => {
//     Promise.all(fileWrites).then(() => {
//       // TODO(developer): Process saved files here
//       for (const name in uploads) {
//         const file = uploads[name];
//         fs.unlinkSync(file);
//       }
//
//       res.send();
//     });
//   });
//
//   busboy.end(req.rawBody);
//
// });

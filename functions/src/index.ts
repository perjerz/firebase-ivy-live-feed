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

// export const updatePost = functions.https.onCall(async (data, context) => {

//   const mimeType = data.image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)[1];
//   const base64EncodedImageString = data.image.replace(/^data:image\/\w+;base64,/, '');
//   const imageBuffer = new Buffer(base64EncodedImageString, 'base64');

//   const filename = `posts/${data.name}.${mimeTypes.detectExtension(mimeType)}`;
//   const file = admin.storage().bucket().file(filename);
//   await file.save(imageBuffer, { contentType: 'image/jpeg' });
//   const photoURL = await file.getSignedUrl({ action: 'read', expires: '03-09-2491' }).then(urls => urls[0]);

//   return { photoURL };
// });

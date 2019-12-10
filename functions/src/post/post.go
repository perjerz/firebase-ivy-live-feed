package post

import (
  "context"
  "errors"
  "fmt"
  "io"
  "log"
  "net/http"
  "net/url"
  "os"
  "strings"

  "cloud.google.com/go/firestore"
  firebase "firebase.google.com/go"
  auth "firebase.google.com/go/auth"
  "firebase.google.com/go/storage"
)

// Post is the post document store in FireStore
type Post struct {
	UserID      string   `json:"postUserId"`
	Image       string   `json:"imageUrl""`
	Message     string   `json:"message"`
	LikeUserIDs []string `json:"likeUserIds"`
}

var (
	ctx             context.Context
	fireStoreClient *firestore.Client
	storageClient   *storage.Client
	authClient      *auth.Client
)

func init() {
	ctx = context.Background()

	app, err := firebase.NewApp(ctx, nil)
	if err != nil {
		log.Fatalf("firebase.NewApp: %v", err)
		return
	}

	storageClient, err = app.Storage(ctx)
	if err != nil {
		log.Fatalf("app.Storage: %v", err)
		return
	}

	fireStoreClient, err = app.Firestore(ctx)
	if err != nil {
		log.Fatalf("app.Firestore: %v", err)
		return
	}

	authClient, err = app.Auth(ctx)
	if err != nil {
		fireStoreClient.Close()
		log.Fatalf("app.Auth: %v", err)
		return
	}
}

func parseToken(r *http.Request) (*auth.Token, error) {
	auth := r.Header.Get("Authorization")
	cookie, _ := r.Cookie("__session")
	if !strings.HasPrefix(auth, "Bearer ") && cookie == nil {
		return nil, errors.New("Unauthorized")
	}

	var idToken string
	if strings.HasPrefix(auth, "Bearer ") {
		idToken = strings.TrimPrefix(auth, "Bearer ")
	} else if cookie != nil {
		idToken = cookie.Value
	} else {
		return nil, errors.New("Unauthorized")
	}

	token, err := authClient.VerifyIDToken(ctx, idToken)
	return token, err
}

// PostImage is triggered by HTTP Request
func PostImage(w http.ResponseWriter, r *http.Request) {
	defer fireStoreClient.Close()
	if r.Method != "POST"{
	  log.Fatalf("Wrong Method: %v", r.Method)
	  http.Error(w, "Accept POST only", http.StatusMethodNotAllowed)
	  return
  }

	token, err := parseToken(r)
	if err != nil {
		log.Fatalf("parseToken: %v", err.Error())
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

  err = r.ParseMultipartForm(4 << 20)
  if err != nil {
    log.Fatalf("r.ParseMultipartForm: %v", err)
    http.Error(w, err.Error(), http.StatusBadRequest)
    return
  }

  defer func() {
    if err := r.MultipartForm.RemoveAll(); err != nil {
      http.Error(w, "Error cleaning up form files", http.StatusInternalServerError)
      log.Printf("Error cleaning up form files: %v", err)
    }
  }()

  // Image file
  for _, h := range r.MultipartForm.File["image"] {
    file, err := h.Open()
    if err != nil {
      http.Error(w, "r.MultipartForm.File", http.StatusBadRequest)
      return
    }
    tmpfile, err := os.Create("./" + h.Filename)
    if err != nil {
      http.Error(w, "os.Create", http.StatusInternalServerError)
      return
    }
    tmpfile.Close()
    io.Copy(tmpfile, file)
  }

	f, fh, err := r.FormFile("message")
	defer f.Close()
	if err != nil {
		log.Fatalf("r.FormFile: %v", err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
  //metadata, err := ioutil.ReadAll(f)
  //if err != nil {
  //  log.Fatalf("ioutil.ReadAll: %v", err.Error())
  //  http.Error(w, err.Error(), http.StatusInternalServerError)
  //  return
  //}

  //
	//buffer := make([]byte, 512)
	//if _, err = f.Read(buffer); err != nil {
	//	log.Fatalf("f.Read: %v", err)
	//	http.Error(w, err.Error(), http.StatusBadRequest)
	//	return
	//}
  //
	//if http.DetectContentType(buffer) == "application/octet-stream" {
	//	log.Fatalf("UID %v posts wrong image", token.UID)
	//	http.Error(w, "Image is not valid.", http.StatusBadRequest)
	//	return
	//}

	bucketHandle, err := storageClient.DefaultBucket()
	if err != nil {
		log.Fatalf("storageClient.DefaultBucket: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	obj := bucketHandle.Object(fh.Filename)
	sw := obj.NewWriter(ctx)
	if _, err = io.Copy(sw, f); err != nil {
		log.Fatalf("Object(fh.Filename).NewWriter: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := sw.Close(); err != nil {
		log.Fatalf("sw.Close: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	attrs, err := bucketHandle.Attrs(ctx)
	if err != nil {
		log.Fatalf("bucketHandle.Attrs: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	u, _ := url.Parse("/" + attrs.Name + "/" + sw.Attrs().Name)

	// TODO: sanitize message
	message := fh.Header.Get("message")
	post := Post{
		UserID:  token.UID,
		Image:   u.EscapedPath(),
		Message: message,
	}

	_, _, err = fireStoreClient.Collection("posts").Add(ctx, post)
	if err != nil {
		log.Fatalf(`Collection("posts").Add: %v`, err)
		err2 := bucketHandle.Object(fh.Filename).Delete(ctx)
		if err2 != nil {
			log.Fatalf("bucketHandle.Object(fh.Filename).Delete: %v", err)
      http.Error(w, err2.Error(), http.StatusInternalServerError)
      return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "Post successfully! URL: %s", u.EscapedPath())
}

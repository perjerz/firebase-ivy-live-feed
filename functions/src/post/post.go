package post

import (
	"context"
	"errors"
	firebase "firebase.google.com/go"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"strings"

	auth "firebase.google.com/go/auth"
)

// Post is the post document store in FireStore
type post struct {
	UserID      string   `json:"postUserId" firestore:"postUserId"`
	Image       string   `json:"imageUrl" firestore:"imageUrl"`
	Message     string   `json:"message" firestore:"message"`
	LikeUserIDs []string `json:"likeUserIds" firestore:"likeUserIds"`
}

func parseToken(c *auth.Client, ctx context.Context, r *http.Request) (*auth.Token, error) {
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

	token, err := c.VerifyIDToken(ctx, idToken)
	return token, err
}

// Post is triggered by HTTP Request
func Post(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	config := &firebase.Config{
		ProjectID:     "fir-ivy-live-feed",
		StorageBucket: "fir-ivy-live-feed.appspot.com",
		DatabaseURL:   "https://fir-ivy-live-feed.firebaseio.com",
	}
	app, err := firebase.NewApp(ctx, config)
	if err != nil {
		log.Fatalf("firebase.NewApp: %v", err)
		return
	}

	storageClient, err := app.Storage(ctx)
	if err != nil {
		log.Fatalf("app.Storage: %v", err)
		return
	}

	firestoreClient, err := app.Firestore(ctx)
	if err != nil {
		log.Fatalf("app.Firestore: %v", err)
		return
	}

	authClient, err := app.Auth(ctx)
	if err != nil {
		firestoreClient.Close()
		log.Fatalf("app.Auth: %v", err)
		return
	}
	defer firestoreClient.Close()

	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "https://fir-ivy-live-feed.web.app")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "POST")
		w.Header().Set("Access-Control-Max-Age", "7200")
		return
	}
	if r.Method != http.MethodPost {
		log.Fatalf("Wrong Method: %v", r.Method)
		http.Error(w, "Accept POST only", http.StatusMethodNotAllowed)
		return
	}

	token, err := parseToken(authClient, ctx, r)
	if err != nil {
		log.Fatalf("parseToken: %v", err.Error())
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 4<<20)
	err = r.ParseMultipartForm(5 << 20)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	f, fh, err := r.FormFile("image")

	defer f.Close()

	if err != nil {
		log.Fatalf("File error: %v", err.Error())
		http.Error(w, "", http.StatusBadRequest)
		return
	}

	buffer, err := ioutil.ReadAll(f)

	if err != nil {
		log.Fatalf("File error: %v", err.Error())
		http.Error(w, "", http.StatusInternalServerError)
		return
	}

	fileType := http.DetectContentType(buffer)

	if !strings.HasPrefix(fileType, "image/") {
		log.Fatalf("UID posts wrong image")
		http.Error(w, "Image is not valid.", http.StatusBadRequest)
		return
	}

	if _, err := f.Seek(0, io.SeekStart); err != nil {
		log.Fatalf("f.Seek: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	bh, err := storageClient.DefaultBucket()
	if err != nil {
		log.Fatalf("storageClient.DefaultBucket: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	obj := bh.Object("posts/" + fh.Filename)

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

	attrs, err := bh.Attrs(ctx)
	if err != nil {
		log.Fatalf("bh.Attrs: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("Attrs: %v %v", sw.Attrs().ContentType, sw.Attrs().Size)

	u, err := url.Parse("/" + attrs.Name + "/" + sw.Attrs().Name)

	if err != nil {
		log.Fatalf("url.Parse: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// TODO: sanitize message
	message := r.FormValue("message")
	post := post{
		UserID:      token.UID,
		Image:       sw.Attrs().Name,
		Message:     message,
		LikeUserIDs: []string{},
	}

	_, _, err = firestoreClient.Collection("posts").Add(ctx, post)
	if err != nil {
		log.Fatalf(`Collection("posts").Add: %v`, err)
		err2 := bh.Object("posts/" + fh.Filename).Delete(ctx)
		if err2 != nil {
			log.Fatalf("bucketHandle.Object(fh.Filename).Delete: %v", err)
			http.Error(w, err2.Error(), http.StatusInternalServerError)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Access-Control-Allow-Origin", "https://fir-ivy-live-feed.web.app")
	fmt.Fprintf(w, "Post successfully! URL: %s", u.EscapedPath())
}

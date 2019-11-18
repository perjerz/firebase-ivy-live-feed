package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	auth "firebase.google.com/go/auth"
	"firebase.google.com/go/storage"
)

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
	config := &firebase.Config{
		ProjectID:     "fir-ivy-live-feed",
		DatabaseURL:   "https://fir-ivy-live-feed.firebaseio.com",
		StorageBucket: "fir-ivy-live-feed.appspot.com",
	}

	app, err := firebase.NewApp(ctx, config)
	if err != nil {
		log.Println(err)
		return
	}

	storageClient, err = app.Storage(ctx)
	if err != nil {
		log.Println(err)
		return
	}

	fireStoreClient, err = app.Firestore(ctx)
	if err != nil {
		log.Println(err)
		return
	}

	authClient, err = app.Auth(ctx)
	if err != nil {
		log.Println(err)
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
	return token, nil
}

func PostImage(w http.ResponseWriter, r *http.Request) {
	defer fireStoreClient.Close()
	token, err := parseToken(r)
	if err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	f, fh, err := r.FormFile("image")
	defer f.Close()
	if err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = r.ParseMultipartForm(4 * 1024 * 1024)
	if err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
	}

	buffer := make([]byte, 512)
	if _, err = f.Read(buffer); err != nil {
		msg := fmt.Sprintf("Could not get image: %v", err)
		log.Println(msg)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if http.DetectContentType(buffer) == "application/octet-stream" {
		http.Error(w, "Image is not valid.", http.StatusBadRequest)
		return
	}

	bucketHandle, err := storageClient.DefaultBucket()
	if err != nil {
		msg := fmt.Sprintf("Could not write file: %v", err)
		log.Println(msg)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sw := bucketHandle.Object(fh.Filename).NewWriter(ctx)
	if _, err = io.Copy(sw, f); err != nil {
		msg := fmt.Sprintf("Could not upload file: %v", err)
		log.Println(msg)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := sw.Close(); err != nil {
		msg := fmt.Sprintf("Could not upload file: %v", err)
		log.Println(msg)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	attrs, err := bucketHandle.Attrs(ctx)
	if err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	u, _ := url.Parse("/" + attrs.Name + "/" + sw.Attrs().Name)

	// TODO: sanitize message
	message := fh.Header.Get("message")
	post := Post{
		UserID:  token.UID,
		Image:   u,
		Message: message,
	}

	ref, _, err := fireStoreClient.Collection("posts").Add(ctx, post)
	if err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "Post successfully! URL: %s", u.EscapedPath())
}

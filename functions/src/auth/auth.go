package auth

import (
	firestore "cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	"golang.org/x/net/context"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"log"
	"time"
)

// AuthEvent is the payload of a FireStore Auth Event
type AuthEvent struct {
	Email    string `json:"email"`
	Metadata struct {
		CreatedAt time.Time `json:"createdAt"`
	} `json:"metadata"`
	UID         string `json:"uid"`
	DisplayName string `json:"displayName"`
	PhotoURL    string `json:"photoURL"`
}

var client *firestore.Client

func init() {
	ctx := context.Background()

	app, err := firebase.NewApp(ctx, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client, err = app.Firestore(ctx)
	if err != nil {
		log.Fatalln(err)
		return
	}
}

type User struct {
	DisplayName string `json:"displayName"`
	PhotoURL    string `json:"photoURL"`
}

// CreateUserDocument is triggered by FireStore Auth Event
func CreateUserDocument(ctx context.Context, e AuthEvent) error {
	defer client.Close()
	u := User{
		DisplayName: e.DisplayName,
		PhotoURL:    e.PhotoURL,
	}
	_, err := client.Collection("users").Doc(e.UID).Set(ctx, u)
	if err != nil {
		log.Fatalf("client.Collection: %v", err)
		return err
	}
	log.Printf("Succeeded to create uid %s Firestore document", e.UID)
	return nil
}

// DeleteUserDocument is triggered by FireStore Auth Event
func DeleteUserDocument(ctx context.Context, e AuthEvent) error {
	defer client.Close()
	doc := client.Collection("users").Doc(e.UID)
	_, err := doc.Get(ctx)
	if status.Code(err) == codes.NotFound {
		log.Fatalf("doc.Get: %v", err)
		return err
	}
	_, err = doc.Delete(ctx)
	if err != nil {
		log.Fatalf("doc.Delete: %v", err)
		return err
	}
	return nil
}

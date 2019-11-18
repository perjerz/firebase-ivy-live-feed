package firestore

import (
	"context"
	firebase "firebase.google.com/go"
	"firebase.google.com/go/auth"
	"log"
	"time"
)

type FireStoreEvent struct {
	OldValue   FireStoreValue `json:"oldValue"`
	Value      FireStoreValue `json"value"`
	UpdateMask struct {
		FieldPaths []string `json:"fieldPaths"`
	} `json:"updateMask"`
}

type User struct {
	UID         string `json:"uid"`
	DisplayName string `json:"displayName"`
	PhotoURL    string `json:"photoURL"`
}

type FireStoreValue struct {
	CreateTime time.Time `json:"createTime"`
	Fields     User      `json:"fields"`
	Name       string    `json:"name"`
	UpdateTime time.Time `json:"updateTime"`
}

var client *auth.Client

func init() {
	ctx := context.Background()

	app, err := firebase.NewApp(ctx, nil)
	if err != nil {
		log.Fatalf("firebase.NewApp: %v", err)
	}
	client, err = app.Auth(ctx)
	if err != nil {
		log.Fatalf("app.Firestore: %v", err)
	}
}

func DeleteUserAuth(ctx context.Context, e FireStoreEvent) error {
	err := client.DeleteUser(ctx, e.Value.Fields.UID)
	if err != nil {
		log.Fatalf("client.DeleteUser: %v", err)
		return err
	}
	return nil
}

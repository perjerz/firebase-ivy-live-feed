package main

import (
	"io/ioutil"
	"log"
	"net/http"
	"strings"
)

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/post", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Origin", "https://localhost:4200")
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

		r.Body = http.MaxBytesReader(w, r.Body, 4<<20)
		err := r.ParseMultipartForm(5 << 20)

		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		f, _, err := r.FormFile("image")

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

		message := r.FormValue("message")

		log.Printf("message %v", message)
		w.Header().Set("Access-Control-Allow-Origin", "https://localhost:4200")

	})

	http.ListenAndServe(":8080", mux)
}

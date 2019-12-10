package main

import (
  "fmt"
  "io"
  "io/ioutil"
  "log"
  "net/http"
  "os"
)

func main() {
  mux := http.NewServeMux()

  mux.HandleFunc("/upload", func(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST"{
      log.Fatalf("Wrong Method: %v", r.Method)
      http.Error(w, "Accept POST only", http.StatusMethodNotAllowed)
      return
    }
    err := r.ParseMultipartForm(4 << 20)
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

    var tmpfile *os.File
    for _, h := range r.MultipartForm.File["image"] {
      file, err := h.Open()
      if err != nil {
        http.Error(w, "r.MultipartForm.File", http.StatusBadRequest)
        return
      }
      tmpfile, err = os.Create("./" + h.Filename)
      if err != nil {
        http.Error(w, "os.Create", http.StatusInternalServerError)
        return
      }
      tmpfile.Close()
      io.Copy(tmpfile, file)
    }

    f, _, err := r.FormFile("message")
    if err != nil {
      message := fmt.Sprint("Error %v", err.Error())
      http.Error(w, message, http.StatusInternalServerError)
    }
    message, err := ioutil.ReadAll(f)
    log.Printf("message %v", message)

    buffer := make([]byte, 512)
    if _, err = tmpfile.Read(buffer); err != nil {
    	log.Fatalf("f.Read: %v", err)
    	http.Error(w, err.Error(), http.StatusBadRequest)
    	return
    }
    if http.DetectContentType(buffer) == "application/octet-stream" {
      log.Fatalf("UID posts wrong image")
      http.Error(w, "Image is not valid.", http.StatusBadRequest)
      return
    }

  })

  http.ListenAndServe(":8080", mux)
}

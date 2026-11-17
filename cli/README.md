# nightfall terminal controls

The Go CLI talks to the native desktop renderer over a private Unix socket.

```sh
CGO_ENABLED=0 go build -trimpath -o nightfall .
NIGHTFALL_RENDERER=/absolute/path/to/nightfall-renderer ./nightfall
```

Installed copies find the renderer automatically. `NIGHTFALL_RENDERER` is useful
for source builds. The terminal binary needs no GTK libraries or cgo; rendering
still needs the native desktop dependencies.

Arrows select and change settings. `q` closes controls while snow keeps running,
`x` stops the renderer, and `c` requests Santa's cleanup.

```sh
go test -race ./...
go vet ./...
```

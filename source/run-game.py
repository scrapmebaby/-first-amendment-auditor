"""Serve the standalone game on localhost; no dependencies required."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser

if __name__ == '__main__':
    directory = str(Path(__file__).resolve().parent)
    handler = partial(SimpleHTTPRequestHandler, directory=directory)
    with ThreadingHTTPServer(('127.0.0.1', 8080), handler) as server:
        url = 'http://127.0.0.1:8080/1st-amendment-auditor.html'
        print(f'1st Amendment Auditor: {url}\nPress Ctrl+C to stop.')
        webbrowser.open(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass

# Dev server: like `python3 -m http.server`, but tells browsers not to cache (Safari on iOS
# otherwise keeps old modules for a long time). Usage: python3 tools/serve.py [port]
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
print(f'serving on http://0.0.0.0:{port}/ (no-store)')
ThreadingHTTPServer(('0.0.0.0', port), partial(NoCache, directory='.')).serve_forever()

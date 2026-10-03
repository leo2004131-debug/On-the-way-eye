from html.parser import HTMLParser

class MyHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []

    def handle_starttag(self, tag, attrs):
        if tag not in ['meta', 'link', 'input', 'img', 'br', 'hr']:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag not in ['meta', 'link', 'input', 'img', 'br', 'hr']:
            if self.stack and self.stack[-1] == tag:
                self.stack.pop()
            else:
                print(f"Unmatched closing tag: {tag}, expected {self.stack[-1] if self.stack else 'nothing'}")

parser = MyHTMLParser()
with open('app.html', 'r', encoding='utf-8') as f:
    parser.feed(f.read())

if parser.stack:
    print("Unclosed tags:", parser.stack)
else:
    print("All tags matched!")


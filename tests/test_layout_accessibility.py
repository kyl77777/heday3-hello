import unittest
from html.parser import HTMLParser
from pathlib import Path


class LayoutHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stylesheets = []
        self.elements_with_classes = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == "link" and attrs_dict.get("rel") == "stylesheet":
            href = attrs_dict.get("href")
            if href:
                self.stylesheets.append(href)

        class_attr = attrs_dict.get("class", "")
        classes = set(class_attr.split())
        if classes:
            self.elements_with_classes.append(classes)


class LayoutAccessibilityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        project_root = Path(__file__).resolve().parents[1]
        cls.index_path = project_root / "index.html"
        cls.css_path = project_root / "assets" / "css" / "styles.css"

        cls.html = cls.index_path.read_text(encoding="utf-8")
        parser = LayoutHTMLParser()
        parser.feed(cls.html)
        cls.stylesheets = parser.stylesheets
        cls.elements_with_classes = parser.elements_with_classes

    def test_external_stylesheet_is_linked(self):
        self.assertIn(
            "assets/css/styles.css",
            self.stylesheets,
            msg="index.html must link external stylesheet assets/css/styles.css",
        )

    def test_sticky_cta_class_exists(self):
        has_sticky_cta = any("sticky-cta" in classes for classes in self.elements_with_classes)
        self.assertTrue(has_sticky_cta, msg="Sticky CTA bar with class 'sticky-cta' is required")

    def test_responsive_breakpoint_exists_in_css(self):
        self.assertTrue(self.css_path.exists(), msg="assets/css/styles.css must exist")
        css = self.css_path.read_text(encoding="utf-8")
        self.assertIn("@media (max-width: 768px)", css)


if __name__ == "__main__":
    unittest.main()

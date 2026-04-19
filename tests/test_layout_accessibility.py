import re
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
    @staticmethod
    def _extract_css_block(css: str, block_start_pattern: str):
        start_match = re.search(block_start_pattern, css, flags=re.S)
        if not start_match:
            return None

        open_brace_index = css.find("{", start_match.start())
        if open_brace_index == -1:
            return None

        depth = 0
        for idx in range(open_brace_index, len(css)):
            if css[idx] == "{":
                depth += 1
            elif css[idx] == "}":
                depth -= 1
                if depth == 0:
                    return css[open_brace_index + 1 : idx]

        return None

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

        if not cls.css_path.exists():
            raise AssertionError("assets/css/styles.css must exist")
        cls.css = cls.css_path.read_text(encoding="utf-8")

    def test_external_stylesheet_is_linked(self):
        self.assertIn(
            "assets/css/styles.css",
            self.stylesheets,
            msg="index.html must link external stylesheet assets/css/styles.css",
        )

    def test_sticky_cta_class_exists(self):
        has_sticky_cta = any("sticky-cta" in classes for classes in self.elements_with_classes)
        self.assertTrue(has_sticky_cta, msg="Sticky CTA bar with class 'sticky-cta' is required")

    def test_sticky_cta_css_has_fixed_bottom_anchor(self):
        sticky_block = self._extract_css_block(self.css, r"\.sticky-cta\s*\{")
        self.assertIsNotNone(sticky_block, msg="Missing .sticky-cta CSS block")

        self.assertRegex(sticky_block, r"position\s*:\s*fixed\s*;", msg=".sticky-cta must use fixed positioning")
        self.assertRegex(sticky_block, r"bottom\s*:\s*[^;]+;", msg=".sticky-cta must anchor to the bottom")

    def test_mobile_breakpoint_adjusts_sticky_cta_layout(self):
        mobile_block = self._extract_css_block(self.css, r"@media\s*\(max-width:\s*768px\)\s*\{")
        self.assertIsNotNone(mobile_block, msg="Missing mobile breakpoint @media (max-width: 768px)")

        mobile_sticky = self._extract_css_block(mobile_block, r"\.sticky-cta\s*\{")
        self.assertIsNotNone(mobile_sticky, msg="Missing .sticky-cta overrides in mobile breakpoint")

        self.assertRegex(
            mobile_sticky,
            r"flex-direction\s*:\s*column\s*;",
            msg="Mobile .sticky-cta should stack content vertically",
        )
        self.assertRegex(
            mobile_sticky,
            r"align-items\s*:\s*stretch\s*;",
            msg="Mobile .sticky-cta should stretch controls for tap accessibility",
        )


if __name__ == "__main__":
    unittest.main()

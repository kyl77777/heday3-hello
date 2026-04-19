import unittest
from html.parser import HTMLParser
from pathlib import Path


class LandingHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.element_ids = set()
        self.anchor_hrefs = set()

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        element_id = attrs_dict.get("id")
        if element_id:
            self.element_ids.add(element_id)
        if tag == "a":
            href = attrs_dict.get("href")
            if href:
                self.anchor_hrefs.add(href)


class LandingStructureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        index_path = Path(__file__).resolve().parents[1] / "index.html"
        cls.html = index_path.read_text(encoding="utf-8")
        parser = LandingHTMLParser()
        parser.feed(cls.html)
        cls.element_ids = parser.element_ids
        cls.anchor_hrefs = parser.anchor_hrefs

    def test_required_section_ids_exist(self):
        required_ids = {
            "hero",
            "pain-points",
            "curriculum",
            "offline-benefits",
            "trust",
            "pricing-location",
            "contact",
        }
        missing_ids = sorted(required_ids - self.element_ids)
        self.assertFalse(missing_ids, msg=f"Missing section id(s): {', '.join(missing_ids)}")

    def test_required_copy_exists(self):
        self.assertIn("비개발자도 따라오는 쉬운 커리큘럼", self.html)

    def test_required_cta_links_exist(self):
        required_hrefs = {
            "tel:0212345678",
            "https://open.kakao.com/o/aiassistedu",
            "#contact",
        }
        missing_hrefs = sorted(required_hrefs - self.anchor_hrefs)
        self.assertFalse(missing_hrefs, msg=f"Missing CTA href(s): {', '.join(missing_hrefs)}")


if __name__ == "__main__":
    unittest.main()
